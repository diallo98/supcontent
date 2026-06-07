const express = require('express')
const router = express.Router()
const { searchMovies, getMovieById, getPopularMovies, getGenres } = require('../controllers/mediaController')

router.get('/search', searchMovies)
router.get('/popular', getPopularMovies)
router.get('/genres', getGenres) // Placé avant /:id pour éviter les conflits de routes
router.get('/:id', getMovieById)

module.exports = router