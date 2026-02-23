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

// Get dashboard summary
router.get('/summary', authenticate, async (req, res) => {
  try {
    let summary = {};
    
    if (req.user.role === 'admin') {
      // Total accounts balance by currency
      const accountBalances = await query(`
        SELECT currency, SUM(balance) as total_balance, COUNT(*) as account_count
        FROM accounts WHERE is_active = true
        GROUP BY currency
      `);
      
      // Today's transactions
      const todayTransactions = await query(`
        SELECT COUNT(*) as count, 
               SUM(CASE WHEN transaction_status = 'paid' THEN 1 ELSE 0 END) as completed,
               SUM(CASE WHEN transaction_status = 'pending' THEN 1 ELSE 0 END) as pending
        FROM transactions 
        WHERE DATE(created_at) = CURRENT_DATE
      `);
      
      // Total transactions
      const totalTransactions = await query(`
        SELECT COUNT(*) as count,
               SUM(CASE WHEN transaction_status = 'paid' THEN payment_amount ELSE 0 END) as total_volume
        FROM transactions
      `);
      
      // Pending credit
      const pendingCredit = await query(`
        SELECT SUM(transaction_amount) as total
        FROM transactions 
        WHERE is_credit = true AND credit_paid = false
      `);
      
      // Active users
      const activeUsers = await query(`
        SELECT COUNT(*) as count FROM users WHERE is_active = true
      `);
      
      // Pending payments count
      const pendingPayments = await query(`
        SELECT COUNT(*) as count FROM transactions WHERE payment_status = 'pending'
      `);
      
      summary = {
        accounts: accountBalances.rows,
        todayTransactions: todayTransactions.rows[0],
        totalTransactions: totalTransactions.rows[0],
        pendingCredit: pendingCredit.rows[0],
        activeUsers: activeUsers.rows[0],
        pendingPayments: pendingPayments.rows[0]
      };
    } else {
      // Cashier - only their accessible accounts
      const accountBalances = await query(`
        SELECT a.currency, SUM(a.balance) as total_balance, COUNT(*) as account_count
        FROM accounts a
        INNER JOIN account_access aa ON a.id = aa.account_id
        WHERE aa.user_id = $1 AND a.is_active = true
        GROUP BY a.currency
      `, [req.user.id]);
      
      // Today's transactions for this cashier
      const todayTransactions = await query(`
        SELECT COUNT(*) as count,
               SUM(CASE WHEN transaction_status = 'paid' THEN 1 ELSE 0 END) as completed,
               SUM(CASE WHEN transaction_status = 'pending' THEN 1 ELSE 0 END) as pending
        FROM transactions 
        WHERE DATE(created_at) = CURRENT_DATE AND created_by = $1
      `, [req.user.id]);
      
      // Pending payments for accessible accounts
      const pendingPayments = await query(`
        SELECT COUNT(*) as count
        FROM transactions t
        INNER JOIN account_access aa ON (t.sender_account_id = aa.account_id OR t.receiver_account_id = aa.account_id)
        WHERE aa.user_id = $1 AND t.payment_status = 'pending'
      `, [req.user.id]);
      
      summary = {
        accounts: accountBalances.rows,
        todayTransactions: todayTransactions.rows[0],
        pendingPayments: pendingPayments.rows[0]
      };
    }
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
