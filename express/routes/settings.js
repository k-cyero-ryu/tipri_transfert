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

// Get all settings
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const result = await query('SELECT * FROM settings ORDER BY key');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single setting
router.get('/:key', authenticate, isAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const result = await query('SELECT * FROM settings WHERE key = $1', [key]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update setting
router.put('/:key', authenticate, isAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const result = await query(
      `UPDATE settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2 RETURNING *`,
      [value, key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create setting (if doesn't exist)
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }

    // Check if setting exists
    const existing = await query('SELECT * FROM settings WHERE key = $1', [key]);

    if (existing.rows.length > 0) {
      // Update existing
      const result = await query(
        'UPDATE settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2 RETURNING *',
        [value, key]
      );
      return res.json(result.rows[0]);
    }

    // Create new
    const result = await query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) RETURNING *',
      [key, value]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating setting:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
