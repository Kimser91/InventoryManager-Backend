const mysql = require('mysql2/promise');
require('dotenv').config();

// Sett opp MySQL-tilkobling
const pool = mysql.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
