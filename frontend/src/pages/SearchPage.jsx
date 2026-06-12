import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

const POSTER = 'https://image.tmdb.org/t/p/w300'
const POSTER_SMALL = 'https://image.tmdb.org/t/p/w92'

const s = {
  page: { maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', color: 'var(--text)' },
  title: { fontSize: '22px', fontWeight: 700, marginBottom: '24px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' },
  poster: { width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block', background: 'var(--bg3)' },
  noPoster: { width: '100%', aspectRatio: '2/3', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', color: 'var(--text-muted)' },
  info: { padding: '10px' },
  movieTitle: { fontSize: '13px', fontWeight: 600, marginBottom: '4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', color: 'var(--text)' },
  year: { fontSize: '12px', color: 'var(--text-muted)' },
  rating: { fontSize: '12px', color: '#ffd700' },
  empty: { textAlign: 'center', padding: '80px', color: 'var(--text-muted)' },
  section: { marginBottom: '40px' },
  sectionTitle: { fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--text)' },
  input: { flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', padding: '10px 14px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  btn: { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  select: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', padding: '10px 14px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' },
  tabBtn: { color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
  suggestionBox: { position: 'absolute', top: '46px', left: 0, right: 0, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', overflow: 'hidden' },
  suggestionItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)' },
  listCard: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' },
  badge: { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', color: 'var(--text-muted)' },
  loadMoreBtn: { background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px', padding: '10px 28px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }
}

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 50 }, (_, i) => currentYear - i)

function PosterSkeleton() {
  return (
    <div style={{ background: 'var(--bg2)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--bg3)', animation: 'pulse 1.5s infinite' }} />
      <div style={{ padding: '10px' }}>
        <div style={{ width: '80%', height: '12px', background: 'var(--bg3)', borderRadius: '4px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ width: '40%', height: '10px', background: 'var(--bg3)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div style={s.listCard}>
      <div style={{ width: '160px', height: '16px', background: 'var(--bg3)', borderRadius: '4px', marginBottom: '10px', animation: 'pulse 1.5s infinite' }} />
      <div style={{ width: '220px', height: '12px', background: 'var(--bg3)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
    </div>
  )
}

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
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [popularPage, setPopularPage] = useState(1)
  const [popularTotalPages, setPopularTotalPages] = useState(1)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestTimeout = useRef(null)
  const wrapperRef = useRef(null)

  const [tab, setTab] = useState('movies')
  const [listQuery, setListQuery] = useState('')
  const [publicLists, setPublicLists] = useState([])
  const [listsLoading, setListsLoading] = useState(false)
  const [listsLoadingMore, setListsLoadingMore] = useState(false)
  const [listsHasMore, setListsHasMore] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get('/movies/popular', { params: { page: 1 } }).then(r => {
      setPopular(r.data.results || [])
      setPopularPage(1)
      setPopularTotalPages(r.data.total_pages || 1)
    }).finally(() => setLoading(false))
    api.get('/movies/genres').then(r => setGenres(r.data || []))
  }, [])

  useEffect(() => {
    const q = searchParams.get('q') || ''
    const year = searchParams.get('year') || ''
    const genre = searchParams.get('genre') || ''
    setYearFilter(year)
    setGenreFilter(genre)
    setQuery(q)
    if (q || genre || year) doSearch(q, year, genre, 1, false)
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

  async function searchLists(q, skip = 0, append = false) {
    if (append) setListsLoadingMore(true)
    else setListsLoading(true)
    try {
      const { data } = await api.get('/lists/public', { params: { q, skip } })
      setPublicLists(prev => append ? [...prev, ...data.lists] : data.lists)
      setListsHasMore(data.hasMore)
    } finally {
      setListsLoading(false)
      setListsLoadingMore(false)
    }
  }

  function loadMoreLists() {
    searchLists(listQuery, publicLists.length, true)
  }

  async function doSearch(q, year, genre, pageNum, append) {
    if (!q && !genre && !year) return
    if (append) setLoadingMore(true)
    else setLoading(true)
    try {
      const params = { page: pageNum }
      if (q) params.query = q
      if (year) params.year = year
      if (genre) params.genre = genre
      const { data } = await api.get('/movies/search', { params })
      setResults(prev => append ? [...prev, ...(data.results || [])] : (data.results || []))
      setPage(pageNum)
      setTotalPages(data.total_pages || 1)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  function loadMoreResults() {
    const q = searchParams.get('q') || ''
    const year = searchParams.get('year') || ''
    const genre = searchParams.get('genre') || ''
    doSearch(q, year, genre, page + 1, true)
  }

  async function loadMorePopular() {
    setLoadingMore(true)
    try {
      const nextPage = popularPage + 1
      const { data } = await api.get('/movies/popular', { params: { page: nextPage } })
      setPopular(prev => [...prev, ...(data.results || [])])
      setPopularPage(nextPage)
      setPopularTotalPages(data.total_pages || 1)
    } finally {
      setLoadingMore(false)
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
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>

      <h1 style={s.title}>Recherche</h1>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setTab('movies')}
          style={{ ...s.tabBtn, background: tab === 'movies' ? 'var(--accent)' : 'var(--bg2)', borderColor: tab === 'movies' ? 'var(--accent)' : 'var(--border)' }}
        >
          Films
        </button>
        <button
          onClick={() => { setTab('lists'); if (publicLists.length === 0) searchLists('') }}
          style={{ ...s.tabBtn, background: tab === 'lists' ? 'var(--accent)' : 'var(--bg2)', borderColor: tab === 'lists' ? 'var(--accent)' : 'var(--border)' }}
        >
          Listes publiques
        </button>
      </div>

      {tab === 'movies' && (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div ref={wrapperRef} style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '500px' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px' }}>
                <input
                  placeholder="Titre d'un film…"
                  value={query}
                  onChange={handleQueryChange}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  style={s.input}
                />
                <button style={s.btn} type="submit">Rechercher</button>
              </form>

              {showSuggestions && suggestions.length > 0 && (
                <div style={s.suggestionBox}>
                  {suggestions.map(movie => (
                    <div
                      key={movie.id}
                      onClick={() => handleSelectSuggestion(movie)}
                      style={s.suggestionItem}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {movie.poster_path ? (
                        <img src={`${POSTER_SMALL}${movie.poster_path}`} alt="" style={{ width: '32px', height: '48px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '32px', height: '48px', background: 'var(--bg3)', borderRadius: '4px', flexShrink: 0 }} />
                      )}
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{movie.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{movie.release_date?.slice(0, 4) || '—'}</div>
                      </div>
                      {movie.vote_average > 0 && (
                        <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#ffd700' }}>★ {movie.vote_average.toFixed(1)}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

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

          {loading && (
            <div style={s.grid}>
              {[...Array(10)].map((_, i) => <PosterSkeleton key={i} />)}
            </div>
          )}

          {!loading && results.length > 0 && (
            <div style={s.section}>
              <p style={s.sectionTitle}>
                {searchParams.get('q') ? `Résultats pour « ${searchParams.get('q')} »` : 'Résultats de votre recherche'}
              </p>
              <MovieGrid movies={results} />
              {page < totalPages && (
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <button style={s.loadMoreBtn} onClick={loadMoreResults} disabled={loadingMore}>
                    {loadingMore ? 'Chargement…' : 'Charger plus'}
                  </button>
                </div>
              )}
            </div>
          )}

          {!loading && results.length === 0 && hasSearchActive && (
            <div style={s.empty}>Aucun résultat pour cette recherche.</div>
          )}

          {!loading && !hasSearchActive && popular.length > 0 && (
            <div style={s.section}>
              <p style={s.sectionTitle}>Films populaires</p>
              <MovieGrid movies={popular} />
              {popularPage < popularTotalPages && (
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <button style={s.loadMoreBtn} onClick={loadMorePopular} disabled={loadingMore}>
                    {loadingMore ? 'Chargement…' : 'Charger plus'}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'lists' && (
        <div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <input
              placeholder="Rechercher une liste..."
              value={listQuery}
              onChange={e => setListQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchLists(listQuery)}
              style={{ ...s.input, maxWidth: '400px' }}
            />
            <button style={s.btn} onClick={() => searchLists(listQuery)}>Rechercher</button>
          </div>

          {listsLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[...Array(3)].map((_, i) => <ListSkeleton key={i} />)}
            </div>
          )}

          {!listsLoading && publicLists.length === 0 && (
            <div style={s.empty}>Aucune liste publique trouvée.</div>
          )}

          {!listsLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {publicLists.map(list => (
                <div key={list.id} style={s.listCard}>
                  <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '6px' }}>{list.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    Par {list.user?.username || 'Anonyme'} · {list.items.length} film{list.items.length !== 1 ? 's' : ''}
                  </div>
                  {list.items.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {list.items.slice(0, 5).map(item => (
                        <span key={item.id} style={s.badge}>
                          {item.media?.title || `Film #${item.mediaId}`}
                        </span>
                      ))}
                      {list.items.length > 5 && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '4px 0' }}>
                          +{list.items.length - 5} autres
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {listsHasMore && !listsLoading && (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button style={s.loadMoreBtn} onClick={loadMoreLists} disabled={listsLoadingMore}>
                {listsLoadingMore ? 'Chargement…' : 'Charger plus'}
              </button>
            </div>
          )}
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
            style={{ background: 'var(--bg2)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)', transition: 'transform 0.15s, border-color 0.15s', boxSizing: 'border-box' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'var(--border)' }}
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