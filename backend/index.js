require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL pool setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // You can add more config here if needed
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running!' });
});

// Example: Attach pool to app for use in routes
app.set('db', pool);

const flightLogsRouter = require('./routes/flightLogs');
const inspectionsRouter = require('./routes/inspections');
app.use('/api/flight-logs', flightLogsRouter);
app.use('/api/inspections', inspectionsRouter);

// TODO: Add routes here

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 