import express from 'express';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/users/jwt - generate JWT on login
router.post('/jwt', async (req, res) => {
  try {
    const { email, name, photo } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const payload = { email, name: name || '', photo: photo || '' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/users/profile - update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, photo } = req.body;
    await db.collection('users').updateOne(
      { email: req.user.email },
      { $set: { name, photo, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/users/profile - get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const user = await db.collection('users').findOne({ email: req.user.email });
    res.json(user || { email: req.user.email });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
