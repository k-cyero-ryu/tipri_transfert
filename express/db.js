import pg from 'pg';
import dotenv from 'dotenv';

// Load the appropriate .env file based on NODE_ENV
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config();
}

const { Pool } = pg;

// Check if we're using DATABASE_URL (production) or individual env vars (development)
const useDatabaseUrl = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';

// Parse DATABASE_URL for production
const parseDatabaseUrl = (url) => {
  try {
    // Match user:password@host:port/database?options
    const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)(\?.*)?$/);
    if (match) {
      const dbName = match[5].split('/').pop(); // Get the last part after any slashes
      const options = match[6] || ''; // Get the query string if present
      const sslmode = options.includes('sslmode=require') || options.includes('sslmode=verify-full') 
        ? { rejectUnauthorized: false }
        : options.includes('sslmode=disable')
          ? false
          : process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false;
      
      return {
        user: match[1],
        password: match[2],
        host: match[3],
        port: parseInt(match[4]),
        database: dbName,
        sslmode: sslmode
      };
    }
  } catch (e) {
    console.error('Error parsing DATABASE_URL:', e.message);
  }
  return null;
};

// Get pool config based on environment
const getPoolConfig = () => {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'tipri_transfert',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  };
  
  let parsedSSL = false;
  
  if (useDatabaseUrl) {
    const parsed = parseDatabaseUrl(process.env.DATABASE_URL);
    if (parsed) {
      config.host = parsed.host;
      config.port = parsed.port;
      config.database = parsed.database;
      config.user = parsed.user;
      config.password = parsed.password;
      if (parsed.sslmode) {
        config.ssl = parsed.sslmode;
        parsedSSL = true;
      }
    }
  }
  
  // Apply SSL settings if DATABASE_SSL is true and not already set from URL
  if (!parsedSSL && process.env.DATABASE_SSL === 'true') {
    config.ssl = { rejectUnauthorized: false };
  }
  
  return config;
};

// Get admin pool config (for creating database)
const getAdminPoolConfig = () => {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  };
  
  let parsedSSL = false;
  
  if (useDatabaseUrl) {
    const parsed = parseDatabaseUrl(process.env.DATABASE_URL);
    if (parsed) {
      config.host = parsed.host;
      config.port = parsed.port;
      config.user = parsed.user;
      config.password = parsed.password;
      if (parsed.sslmode) {
        config.ssl = parsed.sslmode;
        parsedSSL = true;
      }
    }
  }
  
  // Apply SSL settings if DATABASE_SSL is true and not already set from URL
  if (!parsedSSL && process.env.DATABASE_SSL === 'true') {
    config.ssl = { rejectUnauthorized: false };
  }
  
  return config;
};

// First try to create the database if it doesn't exist (only in development)
export const initDbName = async () => {
  // Skip database creation in production - database already exists
  if (useDatabaseUrl) {
    console.log('Production mode: Using existing database');
    return;
  }
  
  try {
    const adminPool = new Pool(getAdminPoolConfig());
    
    const result = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'tipri_transfert']
    );
    
    if (result.rows.length === 0) {
      await adminPool.query(
        'CREATE DATABASE ' + (process.env.DB_NAME || 'tipri_transfert')
      );
      console.log('Database created successfully');
    }
    
    await adminPool.end();
  } catch (error) {
    console.log('Database might already exist or error creating:', error.message);
  }
};

const pool = new Pool(getPoolConfig());

export const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

export const initDatabase = async () => {
  const client = await pool.connect();
  try {
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(200) NOT NULL,
        role VARCHAR(20) CHECK (role IN ('admin', 'cashier')) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        detail TEXT,
        currency VARCHAR(10) CHECK (currency IN ('USD', 'HTG')) NOT NULL,
        balance DECIMAL(15,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS account_access (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
        can_view BOOLEAN DEFAULT true,
        can_transact BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, account_id)
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        client_name VARCHAR(200) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        payment_amount DECIMAL(15,2) NOT NULL,
        payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'canceled')) DEFAULT 'pending',
        transaction_amount DECIMAL(15,2) NOT NULL,
        transaction_method VARCHAR(50) NOT NULL,
        transaction_details TEXT,
        tax_rate DECIMAL(5,2) DEFAULT 0,
        transaction_status VARCHAR(20) CHECK (transaction_status IN ('pending', 'paid', 'canceled')) DEFAULT 'pending',
        is_credit BOOLEAN DEFAULT false,
        credit_due_date DATE,
        credit_paid BOOLEAN DEFAULT false,
        sender_account_id INTEGER REFERENCES accounts(id),
        receiver_account_id INTEGER REFERENCES accounts(id),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS account_transactions (
        id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
        transaction_id INTEGER REFERENCES transactions(id),
        type VARCHAR(20) CHECK (type IN ('debit', 'credit')) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        balance_before DECIMAL(15,2) NOT NULL,
        balance_after DECIMAL(15,2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS credit_notifications (
        id SERIAL PRIMARY KEY,
        transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
        days_overdue INTEGER NOT NULL,
        notified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) UNIQUE NOT NULL,
        credit_limit DECIMAL(15,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        details TEXT,
        entity_type VARCHAR(50),
        entity_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
      CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

      CREATE TABLE IF NOT EXISTS account_transfer (
        id SERIAL PRIMARY KEY,
        from_account_id INTEGER REFERENCES accounts(id),
        to_account_id INTEGER REFERENCES accounts(id),
        from_currency VARCHAR(10) NOT NULL,
        to_currency VARCHAR(10) NOT NULL,
        send_amount DECIMAL(15,2) NOT NULL,
        receive_amount DECIMAL(15,2) NOT NULL,
        status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'canceled')) DEFAULT 'pending',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default settings if not exist
    await client.query(`
      INSERT INTO settings (key, value) VALUES 
        ('credit_notification_days', '7'),
        ('business_name', 'TIPRI Transfert'),
        ('default_tax_rate', '3')
      ON CONFLICT (key) DO NOTHING
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
