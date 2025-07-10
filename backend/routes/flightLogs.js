const express = require('express');
const router = express.Router();

// GET all flight logs
router.get('/', async (req, res) => {
  const pool = req.app.get('db');
  try {
    const result = await pool.query('SELECT * FROM flight_logs');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching all flight logs:', err); // Enhanced error logging
    res.status(500).json({ error: err.message || 'Unknown error' });
  }
});

// GET a single flight log by id
router.get('/:id', async (req, res) => {
  const pool = req.app.get('db');
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM flight_logs WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flight log not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching flight log:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST a new flight log (updated to match frontend fields)
router.post('/', async (req, res) => {
  const pool = req.app.get('db');
  // Map frontend keys to backend keys
  const body = req.body;
  function toNullIfEmpty(val) {
    return val === '' ? null : val;
  }
  const mapped = {
    drone_model: body['DRONE MODEL'],
    mission_date: body['MISSION DATE'],
    mission_objective: body['MISSION OBJECTIVE'],
    flight_id: body['FLIGHT ID'],
    takeoff_time: body['TAKE-OFF TIME'],
    landing_time: body['LANDING TIME'],
    total_flight_time: body['TOTAL FLIGHT TIME'],
    battery1_takeoff_voltage: toNullIfEmpty(body['BATTERY 1 (S) TAKE-OFF VOLTAGE']),
    battery1_landing_voltage: toNullIfEmpty(body['BATTERY 1 (S) LANDING VOLTAGE']),
    battery1_voltage_used: toNullIfEmpty(body['BATTERY 1 (S) VOLTAGE USED']),
    battery2_takeoff_voltage: toNullIfEmpty(body['BATTERY 2 (S) TAKE-OFF VOLTAGE']),
    battery2_landing_voltage: toNullIfEmpty(body['BATTERY 2 (S) LANDING VOLTAGE']),
    battery2_voltage_used: toNullIfEmpty(body['BATTERY 2 (S) VOLTAGE USED']),
    comment: body['COMMENT'],
  };
  console.log('Mapped flight log:', mapped);
  try {
    const result = await pool.query(
      `INSERT INTO flight_logs (
        drone_model, mission_date, mission_objective, flight_id,
        takeoff_time, landing_time, total_flight_time,
        battery1_takeoff_voltage, battery1_landing_voltage, battery1_voltage_used,
        battery2_takeoff_voltage, battery2_landing_voltage, battery2_voltage_used,
        comment
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
      ) RETURNING *`,
      [
        mapped.drone_model, mapped.mission_date, mapped.mission_objective, mapped.flight_id,
        mapped.takeoff_time, mapped.landing_time, mapped.total_flight_time,
        mapped.battery1_takeoff_voltage, mapped.battery1_landing_voltage, mapped.battery1_voltage_used,
        mapped.battery2_takeoff_voltage, mapped.battery2_landing_voltage, mapped.battery2_voltage_used,
        mapped.comment
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error saving flight log:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT (update) a flight log by id
router.put('/:id', async (req, res) => {
  const pool = req.app.get('db');
  const { id } = req.params;
  const body = req.body;
  function toNullIfEmpty(val) { return val === '' ? null : val; }
  const mapped = {
    drone_model: body['DRONE MODEL'],
    mission_date: body['MISSION DATE'],
    mission_objective: body['MISSION OBJECTIVE'],
    flight_id: body['FLIGHT ID'],
    takeoff_time: body['TAKE-OFF TIME'],
    landing_time: body['LANDING TIME'],
    total_flight_time: body['TOTAL FLIGHT TIME'],
    battery1_takeoff_voltage: toNullIfEmpty(body['BATTERY 1 (S) TAKE-OFF VOLTAGE']),
    battery1_landing_voltage: toNullIfEmpty(body['BATTERY 1 (S) LANDING VOLTAGE']),
    battery1_voltage_used: toNullIfEmpty(body['BATTERY 1 (S) VOLTAGE USED']),
    battery2_takeoff_voltage: toNullIfEmpty(body['BATTERY 2 (S) TAKE-OFF VOLTAGE']),
    battery2_landing_voltage: toNullIfEmpty(body['BATTERY 2 (S) LANDING VOLTAGE']),
    battery2_voltage_used: toNullIfEmpty(body['BATTERY 2 (S) VOLTAGE USED']),
    comment: body['COMMENT'],
  };
  try {
    const result = await pool.query(
      `UPDATE flight_logs SET
        drone_model=$1, mission_date=$2, mission_objective=$3, flight_id=$4,
        takeoff_time=$5, landing_time=$6, total_flight_time=$7,
        battery1_takeoff_voltage=$8, battery1_landing_voltage=$9, battery1_voltage_used=$10,
        battery2_takeoff_voltage=$11, battery2_landing_voltage=$12, battery2_voltage_used=$13,
        comment=$14
      WHERE id=$15 RETURNING *`,
      [
        mapped.drone_model, mapped.mission_date, mapped.mission_objective, mapped.flight_id,
        mapped.takeoff_time, mapped.landing_time, mapped.total_flight_time,
        mapped.battery1_takeoff_voltage, mapped.battery1_landing_voltage, mapped.battery1_voltage_used,
        mapped.battery2_takeoff_voltage, mapped.battery2_landing_voltage, mapped.battery2_voltage_used,
        mapped.comment, id
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating flight log:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE a flight log by id
router.delete('/:id', async (req, res) => {
  const pool = req.app.get('db');
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM flight_logs WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting flight log:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 