require('dotenv').config()
const axios = require('axios')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_API_KEY = process.env.TMDB_API_KEY

// Rechercher des films
const searchMovies = async (req, res) => {
  try {
    const { query } = req.query

    if (!query) {
      return res.status(400).json({ error: 'Paramètre query manquant' })
    }

    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: { api_key: TMDB_API_KEY, query, language: 'fr-FR' }
    })

    res.json(response.data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Voir la fiche détail d'un film
const getMovieById = async (req, res) => {
  try {
    const { id } = req.params

    const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}`, {
      params: { api_key: TMDB_API_KEY, language: 'fr-FR' }
    })

    const movie = response.data

    // On sauvegarde le film en BDD pour ne pas refaire l'appel à chaque fois
    await prisma.media.upsert({
      where: { tmdbId: movie.id },
      update: {},
      create: {
        tmdbId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
        overview: movie.overview,
        releaseDate: movie.release_date ? new Date(movie.release_date) : null
      }
    })

    res.json(movie)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Films populaires
const getPopularMovies = async (req, res) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      params: { api_key: TMDB_API_KEY, language: 'fr-FR' }
    })

    res.json(response.data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { searchMovies, getMovieById, getPopularMovies }