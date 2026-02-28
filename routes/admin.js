const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/init');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Login page
router.get('/login', (req, res) => {
  if (req.session && req.session.admin) return res.redirect('/admin/dashboard');
  res.render('admin-login', { error: null });
});

// Login handler
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDb();
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  db.close();

  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.render('admin-login', { error: 'Invalid credentials.' });
  }

  req.session.admin = { id: admin.id, username: admin.username };
  res.redirect('/admin/dashboard');
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// Dashboard
router.get('/dashboard', requireAdmin, (req, res) => {
  const db = getDb();
  const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
  const questions = db
    .prepare(
      `SELECT q.*, c.name as category_name
       FROM questions q
       JOIN categories c ON q.category_id = c.id
       ORDER BY q.created_at DESC`
    )
    .all();
  db.close();
  res.render('admin-dashboard', { categories, questions, admin: req.session.admin });
});

// API: Add question
router.post('/api/questions', requireAdmin, (req, res) => {
  const { category_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty } = req.body;

  if (!category_id || !question_text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(category_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty || 'medium');
  db.close();

  res.json({ success: true, id: result.lastInsertRowid });
});

// API: Update question
router.put('/api/questions/:id', requireAdmin, (req, res) => {
  const { category_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty } = req.body;

  const db = getDb();
  db.prepare(
    `UPDATE questions
     SET category_id = ?, question_text = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_option = ?, difficulty = ?
     WHERE id = ?`
  ).run(category_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, req.params.id);
  db.close();

  res.json({ success: true });
});

// API: Delete question
router.delete('/api/questions/:id', requireAdmin, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
  db.close();
  res.json({ success: true });
});

// API: Add category
router.post('/api/categories', requireAdmin, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required.' });

  const db = getDb();
  try {
    const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
    db.close();
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (e) {
    db.close();
    res.status(400).json({ error: 'Category already exists.' });
  }
});

module.exports = router;
