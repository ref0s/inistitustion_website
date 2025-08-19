require('dotenv').config();
const express = require('express');
const cors = require('cors');
const router = require('./router/router')
const pool = require('./config/db');
const app = express();
const port = process.env.PORT;

// Connect DB
pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL'))
  .catch(err => console.error('❌ DB error:', err));

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api',router)
// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on ${port}`);
});