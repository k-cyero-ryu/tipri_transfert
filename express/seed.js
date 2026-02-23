import bcrypt from 'bcryptjs';
import { query, initDatabase } from './db.js';

const seed = async () => {
  try {
    await initDatabase();
    
    // Check if admin already exists
    const existingAdmin = await query(
      "SELECT id FROM users WHERE username = 'admin'"
    );
    
    if (existingAdmin.rows.length === 0) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await query(
        'INSERT INTO users (username, password, full_name, role) VALUES ($1, $2, $3, $4)',
        ['admin', hashedPassword, 'Administrator', 'admin']
      );
      
      console.log('Admin user created successfully!');
      console.log('Username: admin');
      console.log('Password: admin123');
    } else {
      console.log('Admin user already exists');
    }
    
    // Create sample accounts
    const existingAccounts = await query('SELECT id FROM accounts');
    
    if (existingAccounts.rows.length === 0) {
      await query(`
        INSERT INTO accounts (name, type, detail, currency, balance) VALUES 
        ('Cash USD', 'Cash', 'Main cash drawer', 'USD', 10000),
        ('Cash HTG', 'Cash', 'Main cash drawer', 'HTG', 50000),
        ('Zelle Account', 'Zelle', 'tiprizelle@gmail.com', 'USD', 5000),
        ('PayPal Account', 'PayPal', 'tipripaypal@gmail.com', 'USD', 2000),
        ('Bank Transfer USD', 'Bank', 'Account: 1234567890', 'USD', 15000),
        ('Bank Transfer HTG', 'Bank', 'Account: 0987654321', 'HTG', 75000),
        ('MoonCash', 'MoonCash', 'Phone: +509XXXXXXXX', 'USD', 1000),
        ('NatCash', 'NatCash', 'Phone: +509XXXXXXXX', 'HTG', 5000)
      `);
      
      console.log('Sample accounts created!');
    } else {
      console.log('Accounts already exist');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
