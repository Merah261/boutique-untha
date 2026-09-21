const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS time');

    res.json({
      ok: true,
      database: true,
      time: result.rows[0].time,
    });
  } catch (error) {
    console.error('Database error:', error.message);

    res.status(500).json({
      ok: false,
      database: false,
      message: 'Database connection failed',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Boutique UNTHA API running on http://localhost:${PORT}`);
});
