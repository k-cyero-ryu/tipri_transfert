import express from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

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

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get all accounts (admin sees all, cashier sees only accessible)
router.get('/', authenticate, async (req, res) => {
  try {
    let result;
    
    if (req.user.role === 'admin') {
      result = await query(
        'SELECT * FROM accounts WHERE is_active = true ORDER BY created_at DESC'
      );
    } else {
      // Cashier sees only accounts they have access to
      result = await query(
        `SELECT a.* FROM accounts a
         INNER JOIN account_access aa ON a.id = aa.account_id
         WHERE aa.user_id = $1 AND a.is_active = true
         ORDER BY a.created_at DESC`,
        [req.user.id]
      );
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get account by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check access for cashier
    if (req.user.role !== 'admin') {
      const accessCheck = await query(
        `SELECT * FROM account_access WHERE user_id = $1 AND account_id = $2`,
        [req.user.id, id]
      );
      
      if (accessCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    const result = await query(
      'SELECT * FROM accounts WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new account (admin only)
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { name, type, detail, currency, balance } = req.body;

    if (!name || !type || !currency) {
      return res.status(400).json({ error: 'Name, type, and currency are required' });
    }

    if (!['USD', 'HTG'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }

    const result = await query(
      'INSERT INTO accounts (name, type, detail, currency, balance) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, type, detail || '', currency, balance || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update account
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, detail, currency, is_active, balance } = req.body;

    const existingAccount = await query(
      'SELECT * FROM accounts WHERE id = $1',
      [id]
    );

    if (existingAccount.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const result = await query(
      `UPDATE accounts 
       SET name = $1, type = $2, detail = $3, currency = $4, is_active = $5, balance = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, type, detail, currency, is_active, balance, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete account (soft delete)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const existingAccount = await query(
      'SELECT * FROM accounts WHERE id = $1',
      [id]
    );

    if (existingAccount.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await query(
      'UPDATE accounts SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get transactions for an account
router.get('/:id/transactions', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, status } = req.query;
    
    // Check access for cashier
    if (req.user.role !== 'admin') {
      const accessCheck = await query(
        `SELECT * FROM account_access WHERE user_id = $1 AND account_id = $2`,
        [req.user.id, id]
      );
      
      if (accessCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    let queryStr = `
      SELECT t.*, 
             sa.name as sender_account_name, 
             ra.name as receiver_account_name,
             u.full_name as created_by_name
      FROM transactions t
      LEFT JOIN accounts sa ON t.sender_account_id = sa.id
      LEFT JOIN accounts ra ON t.receiver_account_id = ra.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE (t.sender_account_id = $1 OR t.receiver_account_id = $1)
    `;
    
    const queryParams = [id];
    
    if (startDate) {
      queryParams.push(startDate);
      queryStr += ` AND t.created_at >= $${queryParams.length}`;
    }
    
    if (endDate) {
      queryParams.push(endDate);
      queryStr += ` AND t.created_at <= $${queryParams.length}`;
    }
    
    if (status) {
      queryParams.push(status);
      queryStr += ` AND t.transaction_status = $${queryParams.length}`;
    }
    
    queryStr += ' ORDER BY t.created_at DESC';
    
    const result = await query(queryStr, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching account transactions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
