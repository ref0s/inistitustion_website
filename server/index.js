require('dotenv').config();
const { app } = require('./app');
const dbConfig = require('./config/db');

const port = process.env.PORT || 5050;

dbConfig
  .query('SELECT 1')
  .then(() => console.log(`✅ Connected to SQLite: ${dbConfig.dbFile}`))
  .catch((err) => console.error('❌ DB error:', err));

app.listen(port, () => {
  console.log(`🚀 Server running on ${port}`);
});
