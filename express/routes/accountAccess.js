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

// Get all account access entries (admin only)
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT aa.*, 
             u.username, u.full_name, u.role,
             a.name as account_name, a.type as account_type, a.currency
      FROM account_access aa
      INNER JOIN users u ON aa.user_id = u.id
      INNER JOIN accounts a ON aa.account_id = a.id
      ORDER BY aa.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching account access:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get account access for a specific user
router.get('/user/:userId', authenticate, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await query(`
      SELECT aa.*, a.name as account_name, a.type as account_type, a.currency
      FROM account_access aa
      INNER JOIN accounts a ON aa.account_id = a.id
      WHERE aa.user_id = $1
      ORDER BY a.name
    `, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user account access:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get account access for a specific account
router.get('/account/:accountId', authenticate, isAdmin, async (req, res) => {
  try {
    const { accountId } = req.params;
    const result = await query(`
      SELECT aa.*, u.username, u.full_name
      FROM account_access aa
      INNER JOIN users u ON aa.user_id = u.id
      WHERE aa.account_id = $1
      ORDER BY u.full_name
    `, [accountId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching account access:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create account access (admin only)
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { user_id, account_id, can_view, can_transact } = req.body;

    if (!user_id || !account_id) {
      return res.status(400).json({ error: 'User ID and Account ID are required' });
    }

    // Check if user exists
    const userCheck = await query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if account exists
    const accountCheck = await query('SELECT id FROM accounts WHERE id = $1', [account_id]);
    if (accountCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Check if access already exists
    const existingAccess = await query(
      'SELECT id FROM account_access WHERE user_id = $1 AND account_id = $2',
      [user_id, account_id]
    );

    if (existingAccess.rows.length > 0) {
      return res.status(400).json({ error: 'Access already exists for this user and account' });
    }

    const result = await query(
      'INSERT INTO account_access (user_id, account_id, can_view, can_transact) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, account_id, can_view !== false, can_transact || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating account access:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update account access
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { can_view, can_transact } = req.body;

    const existingAccess = await query(
      'SELECT * FROM account_access WHERE id = $1',
      [id]
    );

    if (existingAccess.rows.length === 0) {
      return res.status(404).json({ error: 'Account access not found' });
    }

    const result = await query(
      `UPDATE account_access 
       SET can_view = $1, can_transact = $2
       WHERE id = $3
       RETURNING *`,
      [can_view, can_transact, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating account access:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete account access
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const existingAccess = await query(
      'SELECT * FROM account_access WHERE id = $1',
      [id]
    );

    if (existingAccess.rows.length === 0) {
      return res.status(404).json({ error: 'Account access not found' });
    }

    await query('DELETE FROM account_access WHERE id = $1', [id]);

    res.json({ message: 'Account access removed successfully' });
  } catch (error) {
    console.error('Error deleting account access:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
