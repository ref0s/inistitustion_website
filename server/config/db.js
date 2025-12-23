require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbFile =
  process.env.SQLITE_FILE || path.join(__dirname, '..', 'data', 'app.db');

fs.mkdirSync(path.dirname(dbFile), { recursive: true });

const db = new sqlite3.Database(dbFile);
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON;');
});

const isSelectQuery = (sql) => /^\s*(select|with|pragma)/i.test(sql);

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    if (isSelectQuery(sql)) {
      db.all(sql, params, (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve({ rows });
      });
      return;
    }

    db.run(sql, params, function runCallback(err) {
      if (err) {
        return reject(err);
      }
      resolve({ rows: [], lastID: this.lastID, changes: this.changes });
    });
  });

module.exports = { query, dbFile };
