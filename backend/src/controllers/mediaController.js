require('dotenv').config()
const axios = require('axios')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_API_KEY = process.env.TMDB_API_KEY

// Rechercher des films (Bascule dynamique entre Search et Discover selon les filtres)
const searchMovies = async (req, res) => {
  try {
    const { query, year, genre } = req.query
    let endpoint, params

    if (genre && !query) {
      // Discover par genre sans recherche textuelle
      endpoint = `${TMDB_BASE_URL}/discover/movie`
      params = {
        api_key: TMDB_API_KEY,
        language: 'fr-FR',
        with_genres: genre,
        primary_release_year: year || undefined,
        sort_by: 'popularity.desc',
      }
    } else {
      // Recherche textuelle classique (avec ou sans année)
      if (!query) {
        return res.status(400).json({ error: 'Paramètre query manquant' })
      }
      endpoint = `${TMDB_BASE_URL}/search/movie`
      params = {
        api_key: TMDB_API_KEY,
        language: 'fr-FR',
        query,
        year: year || undefined,
      }
    }

    const response = await axios.get(endpoint, { params })
    res.json(response.data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Voir la fiche détail d'un film (Avec crédits append et synchronisation du runtime)
const getMovieById = async (req, res) => {
  try {
    const { id } = req.params

    // Modification ici : Ajout de append_to_response pour inclure les crédits (réalisateur/acteurs)
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}`, {
      params: { 
        api_key: TMDB_API_KEY, 
        language: 'fr-FR', 
        append_to_response: 'credits' 
      }
    })

    const movie = response.data

    // On sauvegarde le film en BDD (Inclusion du runtime pour rester synchro !)
    await prisma.media.upsert({
      where: { tmdbId: movie.id },
      update: { runtime: movie.runtime || undefined },
      create: {
        tmdbId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
        overview: movie.overview,
        releaseDate: movie.release_date ? new Date(movie.release_date) : null,
        runtime: movie.runtime || null // Ajout du runtime à la création en BDD
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

// Récupérer la liste des genres depuis TMDB
const getGenres = async (req, res) => {
  try {
    const { data } = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
      params: { api_key: TMDB_API_KEY, language: 'fr-FR' }
    })
    return res.json(data.genres)
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
const getMovieVideos = async (req, res) => {
  try {
    const { id } = req.params
    const { data } = await axios.get(`${TMDB_BASE_URL}/movie/${id}/videos`, {
      params: { api_key: TMDB_API_KEY, language: 'fr-FR' }
    })
    let results = data.results || []
    if (results.length === 0) {
      const fallback = await axios.get(`${TMDB_BASE_URL}/movie/${id}/videos`, {
        params: { api_key: TMDB_API_KEY, language: 'en-US' }
      })
      results = fallback.data.results || []
    }
    return res.json(results)
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

module.exports = { searchMovies, getMovieById, getPopularMovies, getGenres, getMovieVideos }