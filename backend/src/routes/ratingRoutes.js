const express = require('express');
const router = express.Router();
const { upsertRating, getRatingStats } = require('../controllers/ratingController');
const { authenticateToken } = require('../middlewares/auth');

// POST /api/ratings — noter un film (faut être connecté)
router.post('/', authenticateToken, upsertRating);

// GET /api/ratings/movie/:mediaId — moyenne d'un film (public)
router.get('/movie/:mediaId', getRatingStats);

module.exports = router;