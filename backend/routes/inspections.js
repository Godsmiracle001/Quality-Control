const express = require('express');
const router = express.Router();

// GET all inspections
router.get('/', async (req, res) => {
  const pool = req.app.get('db');
  try {
    const result = await pool.query('SELECT * FROM inspections');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new inspection
router.post('/', async (req, res) => {
  const pool = req.app.get('db');
  const { date, inspector, result, notes } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO inspections (date, inspector, result, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [date, inspector, result, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ... Add PUT and DELETE as needed

module.exports = router; 