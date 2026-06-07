import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

const POSTER = 'https://image.tmdb.org/t/p/w300'
const POSTER_SMALL = 'https://image.tmdb.org/t/p/w92'

const s = {
  page: { maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' },
  title: { fontSize: '22px', fontWeight: 700, marginBottom: '24px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' },
  poster: { width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block', background: '#242424' },
  noPoster: { width: '100%', aspectRatio: '2/3', background: '#242424', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' },
  info: { padding: '10px' },
  movieTitle: { fontSize: '13px', fontWeight: 600, marginBottom: '4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
  year: { fontSize: '12px', color: '#888' },
  rating: { fontSize: '12px', color: '#ffd700' },
  empty: { textAlign: 'center', padding: '80px', color: '#666' },
  section: { marginBottom: '40px' },
  sectionTitle: { fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#ccc' },
  btn: { background: '#e50914', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  select: { background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: '8px', color: '#f1f1f1', padding: '10px 14px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' },
}

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 50 }, (_, i) => currentYear - i)

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [yearFilter, setYearFilter] = useState(searchParams.get('year') || '')
  const [genreFilter, setGenreFilter] = useState(searchParams.get('genre') || '')
  const [genres, setGenres] = useState([])
  const [results, setResults] = useState([])
  const [popular, setPopular] = useState([])
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestTimeout = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    api.get('/movies/popular').then(r => setPopular(r.data.results || []))
    api.get('/movies/genres').then(r => setGenres(r.data || []))
  }, [])

  // Écoute des paramètres d'URL (Permet le chargement sans requête de texte obligatoire)
  useEffect(() => {
    const q = searchParams.get('q') || ''
    const year = searchParams.get('year') || ''
    const genre = searchParams.get('genre') || ''
    setYearFilter(year)
    setGenreFilter(genre)
    setQuery(q)
    if (q || genre || year) doSearch(q, year, genre)
  }, [searchParams])

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Exécution de la recherche dynamique
  async function doSearch(q, year, genre) {
    if (!q && !genre && !year) return
    setLoading(true)
    try {
      const params = {}
      if (q) params.query = q
      if (year) params.year = year
      if (genre) params.genre = genre
      const { data } = await api.get('/movies/search', { params })
      setResults(data.results || [])
    } finally {
      setLoading(false)
    }
  }

  function handleQueryChange(e) {
    const val = e.target.value
    setQuery(val)

    clearTimeout(suggestTimeout.current)
    if (val.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    suggestTimeout.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/movies/search', { params: { query: val } })
        setSuggestions((data.results || []).slice(0, 6))
        setShowSuggestions(true)
      } catch {}
    }, 300)
  }

  function handleSelectSuggestion(movie) {
    setShowSuggestions(false)
    navigate(`/movie/${movie.id}`)
  }

  // Soumission du formulaire (Autorise la soumission avec filtres seuls)
  function handleSubmit(e) {
    e.preventDefault()
    setShowSuggestions(false)
    const params = {}
    if (query) params.q = query
    if (yearFilter) params.year = yearFilter
    if (genreFilter) params.genre = genreFilter
    if (Object.keys(params).length > 0) setSearchParams(params)
  }

  const hasSearchActive = searchParams.get('q') || searchParams.get('year') || searchParams.get('genre')

  return (
    <div style={s.page}>
      <h1 style={s.title}>Recherche de films</h1>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div ref={wrapperRef} style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '500px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px' }}>
            <input
              placeholder="Titre d'un film…"
              value={query}
              onChange={handleQueryChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: '8px', color: '#fff', padding: '10px 14px', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
            />
            <button style={s.btn} type="submit">Rechercher</button>
          </form>

          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '46px', left: 0, right: 0,
              background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px',
              zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.6)', overflow: 'hidden'
            }}>
              {suggestions.map(movie => (
                <div
                  key={movie.id}
                  onClick={() => handleSelectSuggestion(movie)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #2a2a2a' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#2a2a2a'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {movie.poster_path ? (
                    <img src={`${POSTER_SMALL}${movie.poster_path}`} alt="" style={{ width: '32px', height: '48px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '32px', height: '48px', background: '#333', borderRadius: '4px', flexShrink: 0 }} />
                  )}
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{movie.title}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{movie.release_date?.slice(0, 4) || '—'}</div>
                  </div>
                  {movie.vote_average > 0 && (
                    <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#ffd700' }}>★ {movie.vote_average.toFixed(1)}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filtres */}
        <select style={s.select} value={genreFilter} onChange={e => setGenreFilter(e.target.value)}>
          <option value="">Tous les genres</option>
          {genres.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>

        <select style={s.select} value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
          <option value="">Toutes les années</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading && <div style={s.empty}>Recherche en cours…</div>}

      {!loading && results.length > 0 && (
        <div style={s.section}>
          <p style={s.sectionTitle}>
            {searchParams.get('q') ? `Résultats pour « ${searchParams.get('q')} »` : 'Résultats de votre recherche'}
          </p>
          <MovieGrid movies={results} />
        </div>
      )}

      {!loading && results.length === 0 && hasSearchActive && (
        <div style={s.empty}>
          Aucun résultat pour cette recherche.
        </div>
      )}

      {!hasSearchActive && popular.length > 0 && (
        <div style={s.section}>
          <p style={s.sectionTitle}>Films populaires</p>
          <MovieGrid movies={popular} />
        </div>
      )}
    </div>
  )
}

function MovieGrid({ movies }) {
  return (
    <div style={s.grid}>
      {movies.map(movie => (
        <Link to={`/movie/${movie.id}`} key={movie.id} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div
            style={{ background: '#1a1a1a', borderRadius: '10px', overflow: 'hidden', border: '1px solid #2e2e2e', transition: 'transform 0.15s, border-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.borderColor = '#e50914' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = '#2e2e2e' }}
          >
            {movie.poster_path
              ? <img src={`${POSTER}${movie.poster_path}`} alt={movie.title} style={s.poster} />
              : <div style={s.noPoster}>?</div>}
            <div style={s.info}>
              <div style={s.movieTitle}>{movie.title}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={s.year}>{movie.release_date?.slice(0, 4) || '—'}</span>
                {movie.vote_average > 0 && <span style={s.rating}>★ {movie.vote_average.toFixed(1)}</span>}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}