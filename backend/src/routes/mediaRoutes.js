const express = require('express')
const router = express.Router()
const { searchMovies, getMovieById, getPopularMovies } = require('../controllers/mediaController')

router.get('/search', searchMovies)
router.get('/popular', getPopularMovies)
router.get('/:id', getMovieById)

module.exports = router