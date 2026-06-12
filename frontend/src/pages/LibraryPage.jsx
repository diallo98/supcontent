import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const POSTER = 'https://image.tmdb.org/t/p/w200'

const STATUS_LABELS = {
  a_voir: 'À voir',
  en_cours: 'En cours',
  termine: 'Terminé',
  abandonne: 'Abandonné',
}

const STATUS_COLORS = {
  a_voir: '#3b82f6',
  en_cours: '#f59e0b',
  termine: '#4caf50',
  abandonne: 'var(--text-muted)',
}

function formatTime(minutes) {
  if (!minutes) return '0h'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export default function LibraryPage() {
  const [library, setLibrary] = useState([])
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/watchstatus/me')
      .then(r => {
        setLibrary(r.data.items || [])
        setTotalMinutes(r.data.totalMinutes || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = activeFilter === 'all'
    ? library
    : library.filter(item => item.status === activeFilter)

  const counts = {
    all: library.length,
    a_voir: library.filter(i => i.status === 'a_voir').length,
    en_cours: library.filter(i => i.status === 'en_cours').length,
    termine: library.filter(i => i.status === 'termine').length,
    abandonne: library.filter(i => i.status === 'abandonne').length,
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px', color: 'var(--text)' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Ma bibliothèque</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>
        {library.length} film{library.length !== 1 ? 's' : ''} dans ta collection
      </p>

      {/* Tableau de bord */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: STATUS_COLORS[key] }}>{counts[key]}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent)' }}>{formatTime(totalMinutes)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Temps regardé</div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
        {[
          { key: 'all', label: 'Tous' },
          { key: 'a_voir', label: 'À voir' },
          { key: 'en_cours', label: 'En cours' },
          { key: 'termine', label: 'Terminé' },
          { key: 'abandonne', label: 'Abandonné' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setActiveFilter(key)}
            style={{
              background: activeFilter === key ? 'var(--accent)' : 'var(--bg2)',
              color: activeFilter === key ? '#fff' : 'var(--text)',
              border: `1px solid ${activeFilter === key ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '20px', padding: '8px 16px',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s, border-color 0.2s'
            }}>
            {label} <span style={{ opacity: 0.7 }}>({counts[key]})</span>
          </button>
        ))}
      </div>

      {/* Liste des films */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '60px 0' }}>
          Aucun film dans cette catégorie.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
          {filtered.map(item => (
            <div key={item.id} onClick={() => navigate(`/movie/${item.media.tmdbId}`)}
              style={{ cursor: 'pointer', position: 'relative' }}>
              {item.media.posterPath ? (
                <img src={`${POSTER}${item.media.posterPath}`} alt={item.media.title}
                  style={{ width: '100%', borderRadius: '8px', display: 'block', aspectRatio: '2/3', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  Pas d'affiche
                </div>
              )}
              <div style={{
                position: 'absolute', top: '6px', left: '6px',
                background: STATUS_COLORS[item.status],
                color: '#fff', fontSize: '10px', fontWeight: 700,
                padding: '2px 8px', borderRadius: '4px',
              }}>
                {STATUS_LABELS[item.status]}
              </div>
              {item.media.runtime && (
                <div style={{
                  position: 'absolute', bottom: '32px', right: '6px',
                  background: 'rgba(0,0,0,0.7)', color: '#ccc',
                  fontSize: '10px', padding: '2px 6px', borderRadius: '4px'
                }}>
                  {formatTime(item.media.runtime)}
                </div>
              )}
              <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>
                {item.media.title}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}