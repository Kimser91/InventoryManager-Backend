const db = require('./src/config/db');

async function testConnection() {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    console.log('Database connected! Test query result:', rows[0].result);
  } catch (err) {
    console.error('Database connection error:', err);
  }
}

testConnection();
