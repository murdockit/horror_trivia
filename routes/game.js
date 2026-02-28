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

// Instructions page
router.get('/instructions', (req, res) => {
  res.render('instructions');
});

module.exports = router;
