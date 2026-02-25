-- TIPRI Transfer Database Schema
-- Run this script to create the full database

-- Create database (run as postgres admin)
-- CREATE DATABASE tipri_transfert;

-- Connect to the database
-- \c tipri_transfert

-- Users table
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

-- Accounts table
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

-- Account access table (links users to accounts)
CREATE TABLE IF NOT EXISTS account_access (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    can_view BOOLEAN DEFAULT true,
    can_transact BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, account_id)
);

-- Transactions table
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

-- Account transactions table (tracks balance changes)
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

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Credit notifications table
CREATE TABLE IF NOT EXISTS credit_notifications (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
    days_overdue INTEGER NOT NULL,
    notified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) UNIQUE NOT NULL,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Account transfer table
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

-- Indexes for activity_log
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

-- Insert default settings
INSERT INTO settings (key, value) VALUES 
    ('credit_notification_days', '7'),
    ('business_name', 'TIPRI Transfert'),
    ('default_tax_rate', '3')
ON CONFLICT (key) DO NOTHING;

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password, full_name, role, is_active) 
VALUES ('admin', '$2a$10$N/yOGeP7T61z7YU1/H2rjOpIRoDaUrqtcJ8/9NBw5QHMIlXIv9K/q', 'Administrator', 'admin', true)
ON CONFLICT (username) DO NOTHING;
