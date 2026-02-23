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

// Get all transactions (admin sees all, cashier sees only accessible)
router.get('/', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, paymentStatus, transactionStatus, currency } = req.query;
    
    let result;
    
    if (req.user.role === 'admin') {
      let queryStr = `
        SELECT t.*, 
               sa.name as sender_account_name, sa.currency as sender_currency,
               ra.name as receiver_account_name, ra.currency as receiver_currency,
               u.full_name as created_by_name
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
      
      if (paymentStatus) {
        queryParams.push(paymentStatus);
        queryStr += ` AND t.payment_status = $${queryParams.length}`;
      }
      
      if (transactionStatus) {
        queryParams.push(transactionStatus);
        queryStr += ` AND t.transaction_status = $${queryParams.length}`;
      }
      
      if (currency) {
        queryStr += ` AND (sa.currency = $${queryParams.length + 1} OR ra.currency = $${queryParams.length + 1})`;
        queryParams.push(currency);
      }
      
      queryStr += ' ORDER BY t.created_at DESC';
      
      result = await query(queryStr, queryParams);
    } else {
      // Cashier sees all transactions (they can confirm payment and execute any transaction)
      let queryStr = `
        SELECT t.*, 
               sa.name as sender_account_name, sa.currency as sender_currency,
               ra.name as receiver_account_name, ra.currency as receiver_currency,
               u.full_name as created_by_name
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
      
      if (paymentStatus) {
        queryParams.push(paymentStatus);
        queryStr += ` AND t.payment_status = $${queryParams.length}`;
      }
      
      if (transactionStatus) {
        queryParams.push(transactionStatus);
        queryStr += ` AND t.transaction_status = $${queryParams.length}`;
      }
      
      queryStr += ' ORDER BY t.created_at DESC';
      
      result = await query(queryStr, queryParams);
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get transaction by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT t.*, 
             sa.name as sender_account_name, sa.detail as sender_detail,
             ra.name as receiver_account_name, ra.detail as receiver_detail,
             u.full_name as created_by_name
      FROM transactions t
      LEFT JOIN accounts sa ON t.sender_account_id = sa.id
      LEFT JOIN accounts ra ON t.receiver_account_id = ra.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new transaction
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      client_name,
      payment_method,
      payment_amount,
      transaction_amount,
      transaction_method,
      transaction_details,
      tax_rate,
      is_credit,
      credit_due_date,
      sender_account_id,
      receiver_account_id
    } = req.body;

    if (!client_name || !payment_method || !payment_amount || !transaction_amount || !transaction_method) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Get default tax rate from settings if not provided
    let finalTaxRate = tax_rate;
    if (!finalTaxRate) {
      const taxResult = await query("SELECT value FROM settings WHERE key = 'default_tax_rate'");
      finalTaxRate = taxResult.rows.length > 0 ? parseFloat(taxResult.rows[0].value) : 0;
    }

    const result = await query(`
      INSERT INTO transactions (
        client_name, payment_method, payment_amount, transaction_amount,
        transaction_method, transaction_details, tax_rate, is_credit,
        credit_due_date, sender_account_id, receiver_account_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      client_name, payment_method, payment_amount, transaction_amount,
      transaction_method, transaction_details || '', finalTaxRate, is_credit || false,
      credit_due_date || null, sender_account_id || null, receiver_account_id || null, req.user.id
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update transaction
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      client_name,
      payment_method,
      payment_amount,
      payment_status,
      transaction_amount,
      transaction_method,
      transaction_details,
      tax_rate,
      transaction_status,
      is_credit,
      credit_due_date,
      credit_paid,
      sender_account_id,
      receiver_account_id
    } = req.body;

    const existingTransaction = await query(
      'SELECT * FROM transactions WHERE id = $1',
      [id]
    );

    if (existingTransaction.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const result = await query(`
      UPDATE transactions SET
        client_name = $1, payment_method = $2, payment_amount = $3,
        payment_status = $4, transaction_amount = $5, transaction_method = $6,
        transaction_details = $7, tax_rate = $8, transaction_status = $9,
        is_credit = $10, credit_due_date = $11, credit_paid = $12,
        sender_account_id = $13, receiver_account_id = $14, updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *
    `, [
      client_name, payment_method, payment_amount, payment_status,
      transaction_amount, transaction_method, transaction_details,
      tax_rate, transaction_status, is_credit, credit_due_date, credit_paid,
      sender_account_id, receiver_account_id, id
    ]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Confirm payment - receiver account receives payment amount
router.put('/:id/confirm-payment', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const existingTransaction = await query(
      'SELECT * FROM transactions WHERE id = $1',
      [id]
    );

    if (existingTransaction.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = existingTransaction.rows[0];

    if (transaction.payment_status !== 'pending') {
      return res.status(400).json({ error: 'Payment is not in pending status' });
    }

    // Get receiver account
    const receiverAccount = transaction.receiver_account_id ?
      await query('SELECT * FROM accounts WHERE id = $1', [transaction.receiver_account_id]) : null;

    // Start transaction
    const client = await (await import('../db.js')).default.connect();
    try {
      await client.query('BEGIN');

      // Update receiver account (credit) with payment amount
      if (receiverAccount && receiverAccount.rows.length > 0) {
        const receiver = receiverAccount.rows[0];
        const newReceiverBalance = parseFloat(receiver.balance) + parseFloat(transaction.payment_amount);

        await client.query(
          'UPDATE accounts SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newReceiverBalance, receiver.id]
        );

        await client.query(`
          INSERT INTO account_transactions (account_id, transaction_id, type, amount, balance_before, balance_after, description)
          VALUES ($1, $2, 'credit', $3, $4, $5, $6)
        `, [receiver.id, id, transaction.payment_amount, receiver.balance, newReceiverBalance, `Payment received from ${transaction.client_name}`]);
      }

      // Update payment status
      await client.query(`
        UPDATE transactions SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id]);

      await client.query('COMMIT');

      // Fetch updated transaction
      const result = await query(`
        SELECT t.*, 
               sa.name as sender_account_name,
               ra.name as receiver_account_name,
               u.full_name as created_by_name
        FROM transactions t
        LEFT JOIN accounts sa ON t.sender_account_id = sa.id
        LEFT JOIN accounts ra ON t.receiver_account_id = ra.id
        LEFT JOIN users u ON t.created_by = u.id
        WHERE t.id = $1
      `, [id]);

      res.json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Execute transaction (after payment confirmed) - sender account is debited with currency conversion
router.put('/:id/execute', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const existingTransaction = await query(
      'SELECT t.*, sa.currency as sender_currency, ra.currency as receiver_currency ' +
      'FROM transactions t ' +
      'LEFT JOIN accounts sa ON t.sender_account_id = sa.id ' +
      'LEFT JOIN accounts ra ON t.receiver_account_id = ra.id ' +
      'WHERE t.id = $1',
      [id]
    );

    if (existingTransaction.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = existingTransaction.rows[0];
    const senderCurrency = transaction.sender_currency;
    const receiverCurrency = transaction.receiver_currency;

    if (transaction.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment must be confirmed before executing' });
    }

    if (transaction.transaction_status !== 'pending') {
      return res.status(400).json({ error: 'Transaction is not in pending status' });
    }

    // Get sender account
    const senderAccount = transaction.sender_account_id ? 
      await query('SELECT * FROM accounts WHERE id = $1', [transaction.sender_account_id]) : null;

    // Calculate the amount to debit based on currency
    let debitAmount = parseFloat(transaction.transaction_amount);
    
    if (senderAccount && senderAccount.rows.length > 0) {
      const sender = senderAccount.rows[0];
      
      // Apply currency conversion if currencies are different
      if (senderCurrency !== receiverCurrency && transaction.tax_rate) {
        const exchangeRate = parseFloat(transaction.tax_rate);
        
        if (senderCurrency === 'HTG' && receiverCurrency === 'USD') {
          // Sender is HTG, receiver is USD - multiply by exchange rate
          debitAmount = debitAmount * exchangeRate;
        } else if (senderCurrency === 'USD' && receiverCurrency === 'HTG') {
          // Sender is USD, receiver is HTG - divide by exchange rate
          debitAmount = debitAmount / exchangeRate;
        }
      }

      // Start transaction
      const client = await (await import('../db.js')).default.connect();
      try {
        await client.query('BEGIN');

        const newSenderBalance = parseFloat(sender.balance) - debitAmount;
        
        await client.query(
          'UPDATE accounts SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newSenderBalance, sender.id]
        );

        await client.query(`
          INSERT INTO account_transactions (account_id, transaction_id, type, amount, balance_before, balance_after, description)
          VALUES ($1, $2, 'debit', $3, $4, $5, $6)
        `, [sender.id, id, debitAmount, sender.balance, newSenderBalance, `Transfer to ${transaction.client_name}`]);

        // Update transaction status
        await client.query(`
          UPDATE transactions SET transaction_status = 'paid', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [id]);

        await client.query('COMMIT');

        // Fetch updated transaction
        const result = await query(`
          SELECT t.*, 
                 sa.name as sender_account_name,
                 ra.name as receiver_account_name,
                 u.full_name as created_by_name
          FROM transactions t
          LEFT JOIN accounts sa ON t.sender_account_id = sa.id
          LEFT JOIN accounts ra ON t.receiver_account_id = ra.id
          LEFT JOIN users u ON t.created_by = u.id
          WHERE t.id = $1
        `, [id]);

        res.json(result.rows[0]);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      // No sender account, just update transaction status
      await query(`
        UPDATE transactions SET transaction_status = 'paid', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id]);

      const result = await query(`
        SELECT t.*, 
               sa.name as sender_account_name,
               ra.name as receiver_account_name,
               u.full_name as created_by_name
        FROM transactions t
        LEFT JOIN accounts sa ON t.sender_account_id = sa.id
        LEFT JOIN accounts ra ON t.receiver_account_id = ra.id
        LEFT JOIN users u ON t.created_by = u.id
        WHERE t.id = $1
      `, [id]);

      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error executing transaction:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel transaction
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const existingTransaction = await query(
      'SELECT * FROM transactions WHERE id = $1',
      [id]
    );

    if (existingTransaction.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = existingTransaction.rows[0];

    if (transaction.transaction_status === 'paid') {
      return res.status(400).json({ error: 'Cannot cancel a completed transaction' });
    }

    const result = await query(`
      UPDATE transactions SET 
        payment_status = 'canceled', 
        transaction_status = 'canceled',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 RETURNING *
    `, [id]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error canceling transaction:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
