const express = require('express');
const router = express.Router();
const { getFeed } = require('../controllers/feedController');
const { authenticateToken } = require('../middlewares/auth');

// GET /api/feed — fil d'actu (faut être connecté)
router.get('/', authenticateToken, getFeed);

module.exports = router;