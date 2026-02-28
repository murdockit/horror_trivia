const express = require('express');
const QRCode = require('qrcode');
const { getDb } = require('../db/init');
const router = express.Router();

// Landing / Join page
router.get('/', (req, res) => {
  res.render('index');
});

// Host page
router.get('/host', (req, res) => {
  res.render('host');
});

// API: Get categories (for host setup)
router.get('/api/categories', (req, res) => {
  const db = getDb();
  const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
  db.close();
  res.json(categories);
});

// API: Generate QR code SVG for a URL
router.get('/api/qr', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('Missing url parameter');
  try {
    const svg = await QRCode.toString(url, {
      type: 'svg',
      margin: 1,
      color: { dark: '#e8e0d0', light: '#00000000' },
    });
    res.type('image/svg+xml').send(svg);
  } catch (e) {
    res.status(500).send('QR generation failed');
  }
});

// Instructions page
router.get('/instructions', (req, res) => {
  res.render('instructions');
});

module.exports = router;
