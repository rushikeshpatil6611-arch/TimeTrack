const mysql2 = require('mysql2/promise');
require('dotenv').config();

const pool = mysql2.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306'),
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASS     || '',
  database:           process.env.DB_NAME     || 'timetrack_db',
  charset:            'utf8mb4',
  waitForConnections: true,
  connectionLimit:    20,
  queueLimit:         0,
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0,
  timezone:           'local',
  dateStrings:        false,
});

// Test connection on startup
const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully to:', process.env.DB_NAME || 'timetrack_db');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('   → Make sure XAMPP MySQL is running and database exists');
    process.exit(1);
  }
};

module.exports = { pool, testConnection };
