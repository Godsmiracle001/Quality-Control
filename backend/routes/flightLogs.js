const express = require('express');
const router = express.Router();

// GET all flight logs
router.get('/', async (req, res) => {
  const pool = req.app.get('db');
  try {
    const result = await pool.query('SELECT * FROM flight_logs');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk import endpoint (moved before /:id routes to avoid conflict)
router.post('/bulk-import', async (req, res) => {
  const pool = req.app.get('db');
  const logs = req.body.logs;
  if (!Array.isArray(logs) || logs.length === 0) {
    return res.status(400).json({ error: 'No logs provided' });
  }
  const results = [];
  try {
    for (const log of logs) {
      // Map fields to DB columns, using the same logic as the POST endpoint
      const mapped = {
        drone_model: log.drone_model,
        mission_date: log.mission_date,
        mission_objective: log.mission_objective,
        flight_id: log.flight_id,
        takeoff_time: log.takeoff_time,
        landing_time: log.landing_time,
        total_flight_time: log.total_flight_time,
        engine_time_hours: log.engine_time_hours,
        fuel_level_before_flight: log.fuel_level_before_flight,
        fuel_level_after_flight: log.fuel_level_after_flight,
        fuel_used: log.fuel_used,
        battery1_takeoff_voltage: log.battery1_takeoff_voltage,
        battery1_landing_voltage: log.battery1_landing_voltage,
        battery1_voltage_used: log.battery1_voltage_used,
        battery2_takeoff_voltage: log.battery2_takeoff_voltage,
        battery2_landing_voltage: log.battery2_landing_voltage,
        battery2_voltage_used: log.battery2_voltage_used,
        comment: log.comment,
      };
      const result = await pool.query(
        `INSERT INTO flight_logs (
          drone_model, mission_date, mission_objective, flight_id,
          takeoff_time, landing_time, total_flight_time, engine_time_hours,
          fuel_level_before_flight, fuel_level_after_flight, fuel_used,
          battery1_takeoff_voltage, battery1_landing_voltage, battery1_voltage_used,
          battery2_takeoff_voltage, battery2_landing_voltage, battery2_voltage_used,
          comment
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        ) RETURNING *`,
        [
          mapped.drone_model, mapped.mission_date, mapped.mission_objective, mapped.flight_id,
          mapped.takeoff_time, mapped.landing_time, mapped.total_flight_time, mapped.engine_time_hours,
          mapped.fuel_level_before_flight, mapped.fuel_level_after_flight, mapped.fuel_used,
          mapped.battery1_takeoff_voltage, mapped.battery1_landing_voltage, mapped.battery1_voltage_used,
          mapped.battery2_takeoff_voltage, mapped.battery2_landing_voltage, mapped.battery2_voltage_used,
          mapped.comment
        ]
      );
      results.push(result.rows[0]);
    }
    res.json({ success: true, inserted: results.length, logs: results });
  } catch (err) {
    console.error('Bulk import error:', err);
    res.status(500).json({ error: err.message });
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
    engine_time_hours: toNullIfEmpty(body['ENGINE TIME (HOURS)']),
    fuel_level_before_flight: toNullIfEmpty(body['FUEL LEVEL BEFORE FLIGHT']),
    fuel_level_after_flight: toNullIfEmpty(body['FUEL LEVEL AFTER FLIGHT']),
    fuel_used: toNullIfEmpty(body['FUEL USED']),
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
        takeoff_time, landing_time, total_flight_time, engine_time_hours,
        fuel_level_before_flight, fuel_level_after_flight, fuel_used,
        battery1_takeoff_voltage, battery1_landing_voltage, battery1_voltage_used,
        battery2_takeoff_voltage, battery2_landing_voltage, battery2_voltage_used,
        comment
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      ) RETURNING *`,
      [
        mapped.drone_model, mapped.mission_date, mapped.mission_objective, mapped.flight_id,
        mapped.takeoff_time, mapped.landing_time, mapped.total_flight_time, mapped.engine_time_hours,
        mapped.fuel_level_before_flight, mapped.fuel_level_after_flight, mapped.fuel_used,
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
    engine_time_hours: toNullIfEmpty(body['ENGINE TIME (HOURS)']),
    fuel_level_before_flight: toNullIfEmpty(body['FUEL LEVEL BEFORE FLIGHT']),
    fuel_level_after_flight: toNullIfEmpty(body['FUEL LEVEL AFTER FLIGHT']),
    fuel_used: toNullIfEmpty(body['FUEL USED']),
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
        takeoff_time=$5, landing_time=$6, total_flight_time=$7, engine_time_hours=$8,
        fuel_level_before_flight=$9, fuel_level_after_flight=$10, fuel_used=$11,
        battery1_takeoff_voltage=$12, battery1_landing_voltage=$13, battery1_voltage_used=$14,
        battery2_takeoff_voltage=$15, battery2_landing_voltage=$16, battery2_voltage_used=$17,
        comment=$18
      WHERE id=$19 RETURNING *`,
      [
        mapped.drone_model, mapped.mission_date, mapped.mission_objective, mapped.flight_id,
        mapped.takeoff_time, mapped.landing_time, mapped.total_flight_time, mapped.engine_time_hours,
        mapped.fuel_level_before_flight, mapped.fuel_level_after_flight, mapped.fuel_used,
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