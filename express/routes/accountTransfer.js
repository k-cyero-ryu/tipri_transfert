import express from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import pool from '../db.js';
import { logActivity } from './activityLog.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'tipri-secret-key-2024';

// Middleware to authenticate user
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Transfer between accounts
router.post('/transfer', authenticate, async (req, res) => {
  try {
    const { from_account_id, to_account_id, send_amount, receive_amount } = req.body;

    if (!from_account_id || !to_account_id || !send_amount || !receive_amount) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (from_account_id === to_account_id) {
      return res.status(400).json({ error: 'Cannot transfer to the same account' });
    }

    // Get both accounts
    const fromAccount = await query('SELECT * FROM accounts WHERE id = $1', [from_account_id]);
    const toAccount = await query('SELECT * FROM accounts WHERE id = $1', [to_account_id]);

    if (fromAccount.rows.length === 0 || toAccount.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Check if sender has sufficient balance
    if (parseFloat(fromAccount.rows[0].balance) < parseFloat(send_amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Start transaction
    const client = await (await import('../db.js')).default.connect();
    try {
      await client.query('BEGIN');

      // Debit sender account
      const newFromBalance = parseFloat(fromAccount.rows[0].balance) - parseFloat(send_amount);
      await client.query(
        'UPDATE accounts SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newFromBalance, from_account_id]
      );

      await client.query(`
        INSERT INTO account_transactions (account_id, type, amount, balance_before, balance_after, description)
        VALUES ($1, 'debit', $2, $3, $4, $5)
      `, [from_account_id, send_amount, fromAccount.rows[0].balance, newFromBalance, 'Transfer to another account']);

      // Credit receiver account
      const newToBalance = parseFloat(toAccount.rows[0].balance) + parseFloat(receive_amount);
      await client.query(
        'UPDATE accounts SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newToBalance, to_account_id]
      );

      await client.query(`
        INSERT INTO account_transactions (account_id, type, amount, balance_before, balance_after, description)
        VALUES ($1, 'credit', $2, $3, $4, $5)
      `, [to_account_id, receive_amount, toAccount.rows[0].balance, newToBalance, 'Received from another account']);

      // Record the transfer in account_transfer table
      const transferResult = await client.query(`
        INSERT INTO account_transfer (from_account_id, to_account_id, from_currency, to_currency, send_amount, receive_amount, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7)
        RETURNING id
      `, [from_account_id, to_account_id, fromAccount.rows[0].currency, toAccount.rows[0].currency, send_amount, receive_amount, req.user.id]);

      await client.query('COMMIT');

      // Log activity
      await logActivity(pool, req.user.id, 'Account Transfer', 
        `Transferred ${send_amount} ${fromAccount.rows[0].currency} to ${receive_amount} ${toAccount.rows[0].currency} (cost: ${send_amount - receive_amount})`, 
        'account_transfer', transferResult.rows[0].id);

      res.json({ 
        success: true, 
        message: 'Transfer completed successfully',
        from_account: { id: from_account_id, new_balance: newFromBalance },
        to_account: { id: to_account_id, new_balance: newToBalance }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error transferring:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
