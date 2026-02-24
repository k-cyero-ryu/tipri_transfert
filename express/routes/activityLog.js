import express from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import pool from '../db.js';

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

// Get all activity logs (admin only)
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate, action, userId } = req.query;
    
    let queryStr = `
      SELECT al.*, u.username, u.full_name, u.role
      FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    if (startDate) {
      queryParams.push(startDate);
      queryStr += ` AND al.created_at >= $${queryParams.length}`;
    }
    
    if (endDate) {
      queryParams.push(endDate);
      queryStr += ` AND al.created_at <= $${queryParams.length}`;
    }
    
    if (action) {
      queryParams.push(action);
      queryStr += ` AND al.action = $${queryParams.length}`;
    }
    
    if (userId) {
      queryParams.push(userId);
      queryStr += ` AND al.user_id = $${queryParams.length}`;
    }
    
    queryStr += ' ORDER BY al.created_at DESC LIMIT 500';
    
    const result = await query(queryStr, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get available action types
router.get('/actions', authenticate, isAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT DISTINCT action FROM activity_log ORDER BY action
    `);
    res.json(result.rows.map(r => r.action));
  } catch (error) {
    console.error('Error fetching action types:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to log activity (to be called from other routes)
export const logActivity = async (pool, userId, action, details, entityType = null, entityId = null) => {
  try {
    await pool.query(
      `INSERT INTO activity_log (user_id, action, details, entity_type, entity_id) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, details, entityType, entityId]
    );
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

export default router;
