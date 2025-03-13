const mysql = require('mysql2/promise');
require('dotenv').config();

// Sett opp MySQL-tilkobling
const pool = mysql.createPool({
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'backenduser',
    password: process.env.DATABASE_PASSWORD || 'yourpassword',
    database: process.env.DATABASE_NAME || 'inventory_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
