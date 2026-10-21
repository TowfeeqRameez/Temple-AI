// Quick tool to inspect all tables and records in templeverse.db
const db = require('./database');

console.log('\n================================================================');
console.log('🕉️   TEMPLEVERSE DATABASE OVERVIEW');
console.log('================================================================\n');

// 1. Table Counts
const tables = [
  { name: 'temples', desc: 'Verified Shrines & Pilgrimages' },
  { name: 'users', desc: 'Registered Devotee Accounts' },
  { name: 'favorites', desc: 'Devotee Bookmarked Shrines' },
  { name: 'prarthanas', desc: 'Sacred Prayers & Mannats' }
];

console.log('📊 RECORD COUNTS:');
console.log('----------------------------------------------------------------');
tables.forEach(t => {
  const count = db.prepare(`SELECT COUNT(*) as c FROM ${t.name}`).get().c;
  console.log(` • ${t.name.padEnd(12)} : ${String(count).padStart(3)} records (${t.desc})`);
});

// 2. Devotee Users
console.log('\n👤 DEVOTEES IN DATABASE:');
console.log('----------------------------------------------------------------');
const users = db.prepare('SELECT id, name, email, state, created_at FROM users').all();
console.table(users);

// 3. Devotee Favorites
console.log('\n⭐ DEVOTEES BOOKMARKED TEMPLES (FAVORITES):');
console.log('----------------------------------------------------------------');
const favorites = db.prepare(`
  SELECT f.id, u.name as devotee, f.temple_name, f.state_id, f.created_at
  FROM favorites f
  JOIN users u ON u.id = f.user_id
`).all();
if (favorites.length === 0) {
  console.log('No favorites bookmarked yet.');
} else {
  console.table(favorites);
}

// 4. Sacred Prayers
console.log('\n🙏 SACRED PRARTHANAS (PRAYERS & MANNATS):');
console.log('----------------------------------------------------------------');
const prarthanas = db.prepare(`
  SELECT id, devotee_name, temple_name, vow_category, prayer_text, status, created_at
  FROM prarthanas
`).all();
if (prarthanas.length === 0) {
  console.log('No prarthanas submitted yet.');
} else {
  console.table(prarthanas);
}

// 5. Sample Temples (First 5)
console.log('\n🏛️ SAMPLE VERIFIED SHRINES (Showing 5 out of 200):');
console.log('----------------------------------------------------------------');
const sampleTemples = db.prepare(`
  SELECT id, name, state_id, lat, lng
  FROM temples
  LIMIT 5
`).all();
console.table(sampleTemples);

console.log('================================================================');
console.log('Tip: You can also visit http://localhost:5001/api/health in browser!\n');
