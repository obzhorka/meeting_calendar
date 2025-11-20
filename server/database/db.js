const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('connect', () => {
  console.log('✅ Połączono z bazą danych PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Nieoczekiwany błąd bazy danych:', err);
  process.exit(-1);
});

module.exports = pool;

