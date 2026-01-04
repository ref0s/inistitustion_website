require('dotenv').config();
const express = require('express');
const cors = require('cors');
const adminRouter = require('./router/admin');
const publicRouter = require('./router/public');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', publicRouter);
app.use('/api/admin', adminRouter);

app.use(errorHandler);

module.exports = { app };
