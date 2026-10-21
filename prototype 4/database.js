const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'templeverse.db');
const db = new Database(DB_PATH);

// Enable WAL mode for high-performance concurrent reads & writes
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  // 1. Devotee Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      state TEXT DEFAULT 'All India',
      avatar TEXT DEFAULT '🕉️',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Devotee Favorite Shrines Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      temple_id TEXT NOT NULL,
      temple_name TEXT NOT NULL,
      state_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, temple_id)
    );
  `);

  // 3. Sacred Prarthanas (Devotee Prayer Vows & Intentions)
  db.exec(`
    CREATE TABLE IF NOT EXISTS prarthanas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      temple_id TEXT,
      temple_name TEXT,
      devotee_name TEXT,
      prayer_text TEXT NOT NULL,
      vow_category TEXT DEFAULT 'Divine Grace & Protection',
      status TEXT DEFAULT 'Sacred Intention Registered',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 4. Shrines & Pilgrimage Data Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS temples (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      full_name TEXT,
      state_id TEXT NOT NULL,
      deity TEXT,
      district TEXT,
      city TEXT,
      architecture TEXT,
      history TEXT,
      ritual TEXT,
      timings TEXT,
      dress_code TEXT,
      circuit_tags TEXT,
      image_url TEXT,
      lat REAL,
      lng REAL,
      problem_theme TEXT,
      specific_diseases TEXT,
      keywords TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_temples_state ON temples(state_id);
    CREATE INDEX IF NOT EXISTS idx_temples_deity ON temples(deity);
  `);

  seedDefaultDevotee();
  seedTemplesIfEmpty();
}

/**
 * Seeds default sample devotee account if no users exist
 */
function seedDefaultDevotee() {
  const existing = db.prepare('SELECT id FROM users LIMIT 1').get();
  if (!existing) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('temple108', salt);
    db.prepare(`
      INSERT INTO users (name, email, password_hash, state, avatar)
      VALUES (?, ?, ?, ?, ?)
    `).run('Devotee Pilgrim', 'pilgrim@templeverse.com', passwordHash, 'All India', '🪔');
    console.log('[TempleVerse DB] Seeded default devotee: pilgrim@templeverse.com');
  }
}

/**
 * Seeds temples table from allIndiaTemplesData.js if empty
 */
function seedTemplesIfEmpty() {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM temples').get();
  if (countRow && countRow.count > 0) {
    return;
  }

  try {
    const { ALL_INDIA_TEMPLES_BY_STATE } = require('./allIndiaTemplesData.js');
    const templesByState = ALL_INDIA_TEMPLES_BY_STATE || {};

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO temples (
        id, name, full_name, state_id, deity, district, city,
        architecture, history, ritual, timings, dress_code, circuit_tags, image_url, lat, lng,
        problem_theme, specific_diseases, keywords
      ) VALUES (
        @id, @name, @full_name, @state_id, @deity, @district, @city,
        @architecture, @history, @ritual, @timings, @dress_code, @circuit_tags, @image_url, @lat, @lng,
        @problem_theme, @specific_diseases, @keywords
      )
    `);

    const insertMany = db.transaction((templesList) => {
      for (const t of templesList) {
        insertStmt.run(t);
      }
    });

    const records = [];
    for (const [stateId, shrines] of Object.entries(templesByState)) {
      if (!Array.isArray(shrines)) continue;
      for (const shrine of shrines) {
        const id = shrine.id || `shrine-${stateId}-${shrine.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        records.push({
          id,
          name: shrine.name || '',
          full_name: shrine.fullName || shrine.name || '',
          state_id: stateId,
          deity: shrine.deity || '',
          district: shrine.district || '',
          city: shrine.city || '',
          architecture: shrine.architecture || '',
          history: shrine.history || '',
          ritual: shrine.ritual || '',
          timings: shrine.timings || '',
          dress_code: shrine.dressCode || '',
          circuit_tags: Array.isArray(shrine.speciality) ? shrine.speciality.join(', ') : '',
          image_url: shrine.image || '',
          lat: shrine.lat || 0,
          lng: shrine.lng || 0,
          problem_theme: shrine.problemTheme || '',
          specific_diseases: JSON.stringify(shrine.specificDiseases || []),
          keywords: JSON.stringify(shrine.keywords || [])
        });
      }
    }

    if (records.length > 0) {
      insertMany(records);
      console.log(`[TempleVerse DB] Seeded ${records.length} sacred shrines into SQLite database.`);
    }
  } catch (err) {
    console.warn('[TempleVerse DB] Warning during initial temple seeding:', err.message);
  }
}

// Initialize tables immediately on load
initDatabase();

module.exports = db;
