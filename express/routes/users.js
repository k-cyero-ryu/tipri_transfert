import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

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

// Get all users (admin only)
router.get('/', isAdmin, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, full_name, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT id, username, full_name, role, is_active, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new user (admin only)
router.post('/', isAdmin, async (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;

    if (!username || !password || !full_name || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['admin', 'cashier'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if username already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
      'INSERT INTO users (username, password, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, username, full_name, role, is_active, created_at',
      [username, hashedPassword, full_name, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, role, is_active, password } = req.body;

    // Check if user exists
    const existingUser = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    let updateQuery = 'UPDATE users SET full_name = $1, role = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP';
    let queryParams = [full_name, role, is_active];

    // If password is provided, hash and update it
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', password = $4';
      queryParams.push(hashedPassword);
    }

    updateQuery += ' WHERE id = $' + (queryParams.length + 1) + ' RETURNING id, username, full_name, role, is_active, created_at';
    queryParams.push(id);

    const result = await query(updateQuery, queryParams);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (soft delete - deactivate)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent self-deletion
    if (existingUser.rows[0].username === req.user.username) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
