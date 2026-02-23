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

// Get total money received (by currency, date range)
router.get('/received', authenticate, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate, currency } = req.query;
    
    let queryStr = `
      SELECT 
        ra.currency,
        SUM(t.transaction_amount) as total_received,
        COUNT(*) as transaction_count
      FROM transactions t
      INNER JOIN accounts ra ON t.receiver_account_id = ra.id
      WHERE t.transaction_status = 'paid'
    `;
    
    const queryParams = [];
    
    if (startDate) {
      queryParams.push(startDate);
      queryStr += ` AND t.created_at >= $${queryParams.length}`;
    }
    
    if (endDate) {
      queryParams.push(endDate);
      queryStr += ` AND t.created_at <= $${queryParams.length}`;
    }
    
    if (currency) {
      queryParams.push(currency);
      queryStr += ` AND ra.currency = $${queryParams.length}`;
    }
    
    queryStr += ` GROUP BY ra.currency ORDER BY ra.currency`;
    
    const result = await query(queryStr, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching received report:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get total money transferred (by currency, date range)
router.get('/transferred', authenticate, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate, currency } = req.query;
    
    let queryStr = `
      SELECT 
        sa.currency,
        SUM(t.payment_amount) as total_transferred,
        COUNT(*) as transaction_count
      FROM transactions t
      INNER JOIN accounts sa ON t.sender_account_id = sa.id
      WHERE t.transaction_status = 'paid'
    `;
    
    const queryParams = [];
    
    if (startDate) {
      queryParams.push(startDate);
      queryStr += ` AND t.created_at >= $${queryParams.length}`;
    }
    
    if (endDate) {
      queryParams.push(endDate);
      queryStr += ` AND t.created_at <= $${queryParams.length}`;
    }
    
    if (currency) {
      queryParams.push(currency);
      queryStr += ` AND sa.currency = $${queryParams.length}`;
    }
    
    queryStr += ` GROUP BY sa.currency ORDER BY sa.currency`;
    
    const result = await query(queryStr, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transferred report:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get total unpaid credit (by currency)
router.get('/credit', authenticate, isAdmin, async (req, res) => {
  try {
    const { currency } = req.query;
    
    let queryStr = `
      SELECT 
        ra.currency,
        SUM(t.transaction_amount) as total_unpaid_credit,
        COUNT(*) as credit_count
      FROM transactions t
      INNER JOIN accounts ra ON t.receiver_account_id = ra.id
      WHERE t.is_credit = true AND t.credit_paid = false
    `;
    
    const queryParams = [];
    
    if (currency) {
      queryParams.push(currency);
      queryStr += ` AND ra.currency = $${queryParams.length}`;
    }
    
    queryStr += ` GROUP BY ra.currency ORDER BY ra.currency`;
    
    const result = await query(queryStr, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching credit report:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get total profit (tax collected)
router.get('/profit', authenticate, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let queryStr = `
      SELECT 
        SUM(t.payment_amount * t.tax_rate / 100) as total_profit,
        SUM(t.payment_amount) as total_volume,
        SUM(t.tax_rate) as total_tax_rate
      FROM transactions t
      WHERE t.transaction_status = 'paid' AND t.tax_rate > 0
    `;
    
    const queryParams = [];
    
    if (startDate) {
      queryParams.push(startDate);
      queryStr += ` AND t.created_at >= $${queryParams.length}`;
    }
    
    if (endDate) {
      queryParams.push(endDate);
      queryStr += ` AND t.created_at <= $${queryParams.length}`;
    }
    
    const result = await query(queryStr, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching profit report:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get detailed transactions for reports
router.get('/transactions', authenticate, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    let queryStr = `
      SELECT 
        t.id,
        t.client_name,
        t.payment_method,
        t.payment_amount,
        t.payment_status,
        t.transaction_amount,
        t.transaction_method,
        t.tax_rate,
        t.transaction_status,
        t.is_credit,
        t.credit_paid,
        t.created_at,
        sa.name as sender_account,
        sa.currency as sender_currency,
        ra.name as receiver_account,
        ra.currency as receiver_currency,
        u.full_name as created_by
      FROM transactions t
      LEFT JOIN accounts sa ON t.sender_account_id = sa.id
      LEFT JOIN accounts ra ON t.receiver_account_id = ra.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    if (startDate) {
      queryParams.push(startDate);
      queryStr += ` AND t.created_at >= $${queryParams.length}`;
    }
    
    if (endDate) {
      queryParams.push(endDate);
      queryStr += ` AND t.created_at <= $${queryParams.length}`;
    }
    
    if (type === 'received') {
      queryStr += ` AND t.transaction_status = 'paid' AND t.receiver_account_id IS NOT NULL`;
    } else if (type === 'transferred') {
      queryStr += ` AND t.transaction_status = 'paid' AND t.sender_account_id IS NOT NULL`;
    } else if (type === 'credit') {
      queryStr += ` AND t.is_credit = true AND t.credit_paid = false`;
    }
    
    queryStr += ' ORDER BY t.created_at DESC';
    
    const result = await query(queryStr, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transactions for report:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
