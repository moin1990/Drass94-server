import express from 'express';
import { ObjectId } from 'mongodb';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET all ideas with search & filter
router.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { search, category, from, to, limit } = req.query;
    const query = {};

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (category && category !== 'All') {
      query.category = category;
    }
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const ideas = await db
      .collection('ideas')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit ? parseInt(limit) : 0)
      .toArray();

    res.json(ideas);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET trending ideas (limited)
router.get('/trending', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const ideas = await db
      .collection('ideas')
      .find({})
      .sort({ views: -1, createdAt: -1 })
      .limit(6)
      .toArray();
    res.json(ideas);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET single idea by ID
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });

    const idea = await db.collection('ideas').findOne({ _id: new ObjectId(id) });
    if (!idea) return res.status(404).json({ message: 'Idea not found' });

    // Increment view count
    await db.collection('ideas').updateOne(
      { _id: new ObjectId(id) },
      { $inc: { views: 1 } }
    );

    res.json(idea);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST create idea (private)
router.post('/', verifyToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const idea = {
      ...req.body,
      authorEmail: req.user.email,
      authorName: req.user.name,
      authorPhoto: req.user.photo || '',
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.collection('ideas').insertOne(idea);
    res.status(201).json({ insertedId: result.insertedId, message: 'Idea created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT update idea (private, owner only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });

    const existing = await db.collection('ideas').findOne({ _id: new ObjectId(id) });
    if (!existing) return res.status(404).json({ message: 'Idea not found' });
    if (existing.authorEmail !== req.user.email) {
      return res.status(403).json({ message: 'Forbidden: Not your idea' });
    }

    const updated = { ...req.body, updatedAt: new Date() };
    delete updated._id;

    await db.collection('ideas').updateOne(
      { _id: new ObjectId(id) },
      { $set: updated }
    );
    res.json({ message: 'Idea updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE idea (private, owner only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });

    const existing = await db.collection('ideas').findOne({ _id: new ObjectId(id) });
    if (!existing) return res.status(404).json({ message: 'Idea not found' });
    if (existing.authorEmail !== req.user.email) {
      return res.status(403).json({ message: 'Forbidden: Not your idea' });
    }

    await db.collection('ideas').deleteOne({ _id: new ObjectId(id) });
    // Also remove associated comments
    await db.collection('comments').deleteMany({ ideaId: id });
    res.json({ message: 'Idea deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET ideas by user email (private)
router.get('/user/:email', verifyToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { email } = req.params;
    if (req.user.email !== email) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const ideas = await db
      .collection('ideas')
      .find({ authorEmail: email })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(ideas);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
