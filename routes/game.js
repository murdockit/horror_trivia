const express = require('express');
const router = express.Router();

// Landing / Join page
router.get('/', (req, res) => {
  res.render('index');
});

// Host page
router.get('/host', (req, res) => {
  res.render('host');
});

module.exports = router;
