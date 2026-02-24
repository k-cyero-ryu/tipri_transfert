import express from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import pool from '../db.js';
import { logActivity } from './activityLog.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'tipri-secret-key-2024';

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get all clients
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, 
        COALESCE(
          (SELECT SUM(t.transaction_amount) 
           FROM transactions t 
           WHERE t.client_name = c.name 
           AND t.is_credit = true 
           AND t.credit_paid = false), 0
        ) as current_balance
       FROM clients c 
       WHERE c.is_active = true 
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get client by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT c.*, 
        COALESCE(
          (SELECT SUM(t.transaction_amount) 
           FROM transactions t 
           WHERE t.client_name = c.name 
           AND t.is_credit = true 
           AND t.credit_paid = false), 0
        ) as current_balance
       FROM clients c 
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new client
router.post('/', isAdmin, async (req, res) => {
  try {
    const { name, credit_limit } = req.body;

    if (!name || credit_limit === undefined) {
      return res.status(400).json({ error: 'Name and credit limit are required' });
    }

    // Check if client with same name already exists
    const existingClient = await query(
      'SELECT id FROM clients WHERE name = $1 AND is_active = true',
      [name]
    );

    if (existingClient.rows.length > 0) {
      return res.status(400).json({ error: 'Client with this name already exists' });
    }

    const result = await query(
      'INSERT INTO clients (name, credit_limit) VALUES ($1, $2) RETURNING id, name, credit_limit, current_balance, is_active, created_at',
      [name, credit_limit]
    );

    // Log activity
    await logActivity(pool, req.user.id, 'Create Client', `Created client: ${name} (credit limit: $${credit_limit})`, 'client', result.rows[0].id);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update client
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, credit_limit, is_active } = req.body;

    // Check if client exists
    const existingClient = await query(
      'SELECT * FROM clients WHERE id = $1',
      [id]
    );

    if (existingClient.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Check if name already exists for another client
    if (name && name !== existingClient.rows[0].name) {
      const nameExists = await query(
        'SELECT id FROM clients WHERE name = $1 AND id != $2 AND is_active = true',
        [name, id]
      );
      if (nameExists.rows.length > 0) {
        return res.status(400).json({ error: 'Client with this name already exists' });
      }
    }

    let updateQuery = 'UPDATE clients SET ';
    const updateParts = [];
    const queryParams = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateParts.push(`name = $${paramIndex++}`);
      queryParams.push(name);
    }
    if (credit_limit !== undefined) {
      updateParts.push(`credit_limit = $${paramIndex++}`);
      queryParams.push(credit_limit);
    }
    if (is_active !== undefined) {
      updateParts.push(`is_active = $${paramIndex++}`);
      queryParams.push(is_active);
    }

    if (updateParts.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateQuery += updateParts.join(', ') + ', updated_at = CURRENT_TIMESTAMP';
    queryParams.push(id);
    updateQuery += ` WHERE id = $${paramIndex} RETURNING id, name, credit_limit, is_active, created_at, updated_at`;

    const result = await query(updateQuery, queryParams);
    
    // Log activity
    await logActivity(pool, req.user.id, 'Update Client', `Updated client: ${result.rows[0].name} (credit limit: $${credit_limit}, active: ${is_active})`, 'client', parseInt(id));

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Liquidate client debt (mark all credits as paid and add to account)
router.post('/:id/liquidate', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { account_id } = req.body;

    console.log('Liquidate request:', { id, account_id });

    if (!account_id) {
      return res.status(400).json({ error: 'Account ID is required' });
    }

    // Check if client exists
    const client = await query(
      'SELECT * FROM clients WHERE id = $1',
      [id]
    );

    if (client.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Check if account exists
    const account = await query(
      'SELECT * FROM accounts WHERE id = $1 AND is_active = true',
      [account_id]
    );

    if (account.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found or inactive' });
    }

    const clientName = client.rows[0].name;
    const accountData = account.rows[0];
    
    console.log('Client:', clientName);
    console.log('Account:', accountData);

    // Get all unpaid credits for this client
    const unpaidCreditsResult = await query(
      `SELECT id, transaction_amount FROM transactions 
       WHERE client_name = $1 AND is_credit = true AND credit_paid = false`,
      [clientName]
    );

    console.log('Unpaid credits:', unpaidCreditsResult.rows);

    if (unpaidCreditsResult.rows.length === 0) {
      return res.status(400).json({ error: 'No unpaid credits to liquidate' });
    }

    // Calculate total amount to liquidate
    let totalAmount = 0;
    unpaidCreditsResult.rows.forEach(row => {
      totalAmount += parseFloat(row.transaction_amount);
    });

    console.log('Total amount to liquidate:', totalAmount);

    // Get pool from db
    const pool = (await import('../db.js')).default;
    const clientConn = await pool.connect();

    try {
      await clientConn.query('BEGIN');

      // Get fresh account balance inside transaction
      const freshAccount = await clientConn.query(
        'SELECT balance FROM accounts WHERE id = $1',
        [account_id]
      );
      
      const balanceBefore = parseFloat(freshAccount.rows[0].balance);
      const balanceAfter = balanceBefore + totalAmount;
      
      console.log('Balance before:', balanceBefore, 'after:', balanceAfter);

      // Mark all credits as paid
      await clientConn.query(
        `UPDATE transactions 
         SET credit_paid = true, updated_at = CURRENT_TIMESTAMP 
         WHERE client_name = $1 AND is_credit = true AND credit_paid = false`,
        [clientName]
      );

      // Update account balance
      await clientConn.query(
        'UPDATE accounts SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [balanceAfter, account_id]
      );

      // Record the transaction
      await clientConn.query(
        `INSERT INTO account_transactions (account_id, type, amount, balance_before, balance_after, description)
         VALUES ($1, 'credit', $2, $3, $4, $5)`,
        [account_id, totalAmount, balanceBefore, balanceAfter, `Liquidation payment from client ${clientName}`]
      );

      await clientConn.query('COMMIT');
      
      // Log activity
      await logActivity(pool, req.user.id, 'Liquidate Client', `Liquidated debt for client ${clientName}: $${totalAmount} added to account ${accountData.name}`, 'client', parseInt(id));

      console.log('Liquidation completed successfully');
    } catch (error) {
      await clientConn.query('ROLLBACK');
      console.error('Error in liquidation transaction:', error);
      throw error;
    } finally {
      clientConn.release();
    }

    res.json({ 
      success: true, 
      message: `Liquidated ${unpaidCreditsResult.rows.length} credit(s) for client ${clientName}. Total: $${totalAmount.toFixed(2)} added to account ${accountData.name}`,
      liquidated_count: unpaidCreditsResult.rows.length,
      amount_liquidated: totalAmount
    });
  } catch (error) {
    console.error('Error liquidating client:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete client (soft delete)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if client exists
    const existingClient = await query(
      'SELECT * FROM clients WHERE id = $1',
      [id]
    );

    if (existingClient.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const clientName = existingClient.rows[0].name;

    await query(
      'UPDATE clients SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    // Log activity
    await logActivity(pool, req.user.id, 'Delete Client', `Deactivated client: ${clientName}`, 'client', parseInt(id));

    res.json({ message: 'Client deactivated successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
