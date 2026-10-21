const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/authMiddleware');

// All devotee routes require valid authentication
router.use(authenticateToken);

/**
 * GET /api/devotee/favorites
 * List all saved shrines of the authenticated devotee
 */
router.get('/favorites', (req, res) => {
  try {
    const favorites = db.prepare(`
      SELECT f.id as favorite_id, f.temple_id, f.temple_name, f.state_id, f.created_at,
             t.deity, t.city, t.image_url, t.circuit_tags
      FROM favorites f
      LEFT JOIN temples t ON f.temple_id = t.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(req.user.id);

    res.json({
      success: true,
      count: favorites.length,
      data: favorites
    });
  } catch (err) {
    console.error('[Devotee API] Favorites fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving favorites.' });
  }
});

/**
 * POST /api/devotee/favorites
 * Save a temple to favorites
 */
router.post('/favorites', (req, res) => {
  try {
    const { templeId, templeName, stateId } = req.body;

    if (!templeId || !templeName) {
      return res.status(400).json({
        success: false,
        message: 'templeId and templeName are required.'
      });
    }

    // Insert or ignore if already favorited
    db.prepare(`
      INSERT OR IGNORE INTO favorites (user_id, temple_id, temple_name, state_id)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, templeId, templeName, stateId || '');

    res.status(201).json({
      success: true,
      message: `Shrine "${templeName}" added to your sacred favorites.`
    });
  } catch (err) {
    console.error('[Devotee API] Save favorite error:', err);
    res.status(500).json({ success: false, message: 'Server error saving favorite.' });
  }
});

/**
 * DELETE /api/devotee/favorites/:templeId
 * Remove a temple from favorites
 */
router.delete('/favorites/:templeId', (req, res) => {
  try {
    const { templeId } = req.params;

    db.prepare('DELETE FROM favorites WHERE user_id = ? AND temple_id = ?')
      .run(req.user.id, templeId);

    res.json({
      success: true,
      message: 'Shrine removed from your sacred favorites.'
    });
  } catch (err) {
    console.error('[Devotee API] Remove favorite error:', err);
    res.status(500).json({ success: false, message: 'Server error removing favorite.' });
  }
});

/**
 * GET /api/devotee/prarthana
 * Retrieve all prayer intentions and vows offered by the devotee
 */
router.get('/prarthana', (req, res) => {
  try {
    const prayers = db.prepare(`
      SELECT id, temple_id, temple_name, devotee_name, prayer_text, vow_category, status, created_at
      FROM prarthanas
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    res.json({
      success: true,
      count: prayers.length,
      data: prayers
    });
  } catch (err) {
    console.error('[Devotee API] Prarthana fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving prayers.' });
  }
});

/**
 * POST /api/devotee/prarthana
 * Submit a sacred prayer intention (Mannat/Sankalpa)
 */
router.post('/prarthana', (req, res) => {
  try {
    const { templeId, templeName, prayerText, vowCategory } = req.body;

    if (!prayerText || !prayerText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Prayer intention text is required.'
      });
    }

    const result = db.prepare(`
      INSERT INTO prarthanas (user_id, temple_id, temple_name, devotee_name, prayer_text, vow_category)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      templeId || '',
      templeName || 'Sacred Sanctum',
      req.user.name,
      prayerText.trim(),
      vowCategory || 'Divine Grace & Protection'
    );

    res.status(201).json({
      success: true,
      message: 'Your sacred Prarthana has been received and offered to the deity.',
      prayerId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('[Devotee API] Submit prarthana error:', err);
    res.status(500).json({ success: false, message: 'Server error submitting prayer.' });
  }
});

module.exports = router;
