const express = require('express');
const router = express.Router();
const db = require('../database');

/**
 * GET /api/temples
 * Retrieve temples with optional filters: state, deity, circuit, search, pagination
 */
router.get('/', (req, res) => {
  try {
    const { state, deity, circuit, q, limit = 200, offset = 0 } = req.query;

    let query = 'SELECT * FROM temples WHERE 1=1';
    const params = [];

    if (state) {
      query += ' AND state_id = ?';
      params.push(state.trim());
    }

    if (deity) {
      query += ' AND deity LIKE ?';
      params.push(`%${deity.trim()}%`);
    }

    if (circuit) {
      query += ' AND (circuit_tags LIKE ? OR name LIKE ? OR full_name LIKE ?)';
      params.push(`%${circuit.trim()}%`, `%${circuit.trim()}%`, `%${circuit.trim()}%`);
    }

    if (q) {
      const keyword = `%${q.trim()}%`;
      query += ' AND (name LIKE ? OR full_name LIKE ? OR deity LIKE ? OR city LIKE ? OR district LIKE ? OR architecture LIKE ? OR problem_theme LIKE ? OR specific_diseases LIKE ? OR keywords LIKE ?)';
      params.push(keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword);
    }

    query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const temples = db.prepare(query).all(...params);

    res.json({
      success: true,
      count: temples.length,
      data: temples
    });
  } catch (err) {
    console.error('[Temples API] Fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving temples.' });
  }
});

/**
 * GET /api/temples/summary
 * Returns count of temples grouped by state
 */
router.get('/summary', (req, res) => {
  try {
    const summary = db.prepare(`
      SELECT state_id, COUNT(*) as count
      FROM temples
      GROUP BY state_id
      ORDER BY count DESC
    `).all();

    const total = db.prepare('SELECT COUNT(*) as total FROM temples').get();

    res.json({
      success: true,
      totalTemples: total ? total.total : 0,
      byState: summary
    });
  } catch (err) {
    console.error('[Temples API] Summary error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving temple summary.' });
  }
});

/**
 * GET /api/temples/circuits/:circuitKey
 * Returns verified shrines for popular pilgrimage circuits
 */
router.get('/circuits/:circuitKey', (req, res) => {
  try {
    const { circuitKey } = req.params;
    let shrines = [];

    if (circuitKey === 'jyotirlinga') {
      shrines = db.prepare(`
        SELECT * FROM temples
        WHERE name LIKE '%Somnath%' OR name LIKE '%Mallikarjuna%' OR name LIKE '%Mahakaleshwar%'
           OR name LIKE '%Omkareshwar%' OR name LIKE '%Kedarnath%' OR name LIKE '%Bhimashankar%'
           OR name LIKE '%Kashi Vishwanath%' OR name LIKE '%Trimbakeshwar%' OR name LIKE '%Vaidyanath%'
           OR name LIKE '%Nageshvara%' OR name LIKE '%Ramanathaswamy%' OR name LIKE '%Grishneshwar%'
        ORDER BY name ASC
      `).all();
    } else if (circuitKey === 'chardham') {
      // Strictly the 4 Himalayan Char Dham shrines requested by devotee
      shrines = db.prepare(`
        SELECT * FROM temples
        WHERE name LIKE '%Yamunotri%' OR name LIKE '%Gangotri%' OR name LIKE '%Badrinath%' OR name LIKE '%Kedarnath%'
        ORDER BY name ASC
      `).all();
    } else if (circuitKey === 'panchabhoota') {
      shrines = db.prepare(`
        SELECT * FROM temples
        WHERE name LIKE '%Jambukeswarar%' OR name LIKE '%Arunachaleswarar%' OR name LIKE '%Kalahasteeswara%'
           OR name LIKE '%Ekambareswarar%' OR name LIKE '%Thillai Nataraja%'
        ORDER BY name ASC
      `).all();
    } else if (circuitKey === 'visa') {
      shrines = db.prepare(`
        SELECT * FROM temples
        WHERE name LIKE '%Chilkur%' OR name LIKE '%Visa%' OR circuit_tags LIKE '%Visa%' OR history LIKE '%Visa%'
        ORDER BY name ASC
      `).all();
    } else {
      shrines = db.prepare(`
        SELECT * FROM temples
        WHERE circuit_tags LIKE ? OR name LIKE ?
        ORDER BY name ASC
      `).all(`%${circuitKey}%`, `%${circuitKey}%`);
    }

    res.json({
      success: true,
      circuit: circuitKey,
      count: shrines.length,
      data: shrines
    });
  } catch (err) {
    console.error('[Temples API] Circuit error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving circuit shrines.' });
  }
});

/**
 * GET /api/temples/:id
 * Retrieve full details of a specific sacred shrine
 */
router.get('/:id', (req, res) => {
  try {
    const temple = db.prepare('SELECT * FROM temples WHERE id = ?').get(req.params.id);

    if (!temple) {
      return res.status(404).json({
        success: false,
        message: 'Shrine not found.'
      });
    }

    res.json({
      success: true,
      data: temple
    });
  } catch (err) {
    console.error('[Temples API] Detail fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving shrine details.' });
  }
});

module.exports = router;
