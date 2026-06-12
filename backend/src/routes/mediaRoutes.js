const express = require('express')
const router = express.Router()
const { searchMovies, getMovieById, getPopularMovies, getGenres, getMovieVideos } = require('../controllers/mediaController')

router.get('/search', searchMovies)
router.get('/popular', getPopularMovies)
router.get('/genres', getGenres)
router.get('/:id/videos', getMovieVideos)
router.get('/:id', getMovieById)

module.exports = router