const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { authenticateToken, JWT_SECRET } = require('../middleware/authMiddleware');

/**
 * POST /api/auth/signup
 * Create a new devotee account
 */
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, state } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are all required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.'
      });
    }

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this sacred email already exists. Please Sign In.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, state, avatar)
      VALUES (?, ?, ?, ?, ?)
    `).run(cleanName, cleanEmail, passwordHash, state || 'All India', '🪔');

    const newUserId = result.lastInsertRowid;
    const userPayload = {
      id: newUserId,
      name: cleanName,
      email: cleanEmail,
      state: state || 'All India',
      avatar: '🪔'
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to TempleVerse.',
      token,
      user: userPayload
    });
  } catch (err) {
    console.error('[Auth API] Signup error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while creating account. Please try again.'
    });
  }
});

/**
 * POST /api/auth/signin
 * Authenticate devotee with email and password
 */
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Both email and password are required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No account found with this email.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please re-check.'
      });
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      state: user.state,
      avatar: user.avatar || '🕉️'
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Signed in successfully! Welcome back to TempleVerse.',
      token,
      user: userPayload
    });
  } catch (err) {
    console.error('[Auth API] Signin error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during sign in. Please try again.'
    });
  }
});

/**
 * GET /api/auth/me
 * Retrieve currently authenticated devotee profile and stats
 */
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, state, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Devotee profile not found.' });
    }

    // Get favorite count and prarthana count
    const favCount = db.prepare('SELECT COUNT(*) as c FROM favorites WHERE user_id = ?').get(user.id);
    const prarthanaCount = db.prepare('SELECT COUNT(*) as c FROM prarthanas WHERE user_id = ?').get(user.id);

    res.json({
      success: true,
      user: {
        ...user,
        stats: {
          savedTemples: favCount ? favCount.c : 0,
          offeredPrayers: prarthanaCount ? prarthanaCount.c : 0
        }
      }
    });
  } catch (err) {
    console.error('[Auth API] Profile fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving profile.' });
  }
});

/**
 * PUT /api/auth/profile
 * Update devotee name, state, or avatar
 */
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { name, state, avatar } = req.body;
    const userId = req.user.id;

    const updates = [];
    const values = [];

    if (name && name.trim()) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (state && state.trim()) {
      updates.push('state = ?');
      values.push(state.trim());
    }
    if (avatar && avatar.trim()) {
      updates.push('avatar = ?');
      values.push(avatar.trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No profile fields to update.' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updatedUser = db.prepare('SELECT id, name, email, state, avatar FROM users WHERE id = ?').get(userId);

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (err) {
    console.error('[Auth API] Profile update error:', err);
    res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
});

module.exports = router;
