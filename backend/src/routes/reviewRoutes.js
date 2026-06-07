const express = require('express');
const router = express.Router();
const { createReview, getReviewsByMovie, deleteReview } = require('../controllers/reviewController');
const { authenticateToken } = require('../middlewares/auth');

// POST /api/reviews — écrire une review (faut être connecté)
router.post('/', authenticateToken, createReview);

// GET /api/reviews/movie/:mediaId — reviews d'un film (public)
router.get('/movie/:mediaId', getReviewsByMovie);

// DELETE /api/reviews/:id — supprimer sa review (faut être connecté)
router.delete('/:id', authenticateToken, deleteReview);

module.exports = router;