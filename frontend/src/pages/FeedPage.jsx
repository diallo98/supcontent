import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const POSTER = 'https://image.tmdb.org/t/p/w92'

const s = {
  page: { maxWidth: '700px', margin: '0 auto', padding: '40px 24px' },
  title: { fontSize: '22px', fontWeight: 700, marginBottom: '24px' },
  card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px 20px', marginBottom: '12px', display: 'flex', gap: '14px', alignItems: 'flex-start' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', flexShrink: 0, color: '#fff', overflow: 'hidden' },
  action: { fontSize: '14px', color: 'var(--text)', lineHeight: 1.5 },
  time: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' },
  username: { color: 'var(--text)', fontWeight: 600 },
  target: { color: 'var(--accent)', fontWeight: 600 },
  empty: { textAlign: 'center', padding: '60px', color: 'var(--text-muted)' },
  welcome: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '32px', textAlign: 'center', marginBottom: '24px' },
  btn: { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 22px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'inline-block', marginTop: '16px' },
  poster: { width: '36px', height: '54px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 },
  loadMoreBtn: { background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px', padding: '10px 28px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }
}

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60) return 'À l\'instant'
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`
  return `Il y a ${Math.floor(diff / 86400)} j`
}

function actionLabel(actionType, targetType) {
  if (actionType === 'followed' && targetType === 'user') return 'a commencé à suivre'
  if (actionType === 'reviewed' && targetType === 'media') return 'a écrit une critique sur'
  if (actionType === 'rated' && targetType === 'media') return 'a noté'
  if (actionType === 'listed' && targetType === 'media') return 'a ajouté à sa liste'
  return actionType
}

function ActivitySkeleton() {
  return (
    <div style={s.card}>
      <div style={{ ...s.avatar, background: 'var(--bg3)', animation: 'pulse 1.5s infinite' }} />
      <div style={{ flex: 1 }}>
        <div style={{ width: '70%', height: '14px', background: 'var(--bg3)', borderRadius: '4px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ width: '40%', height: '11px', background: 'var(--bg3)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
      </div>
    </div>
  )
}

export default function FeedPage() {
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    loadFeed(0, false)
  }, [])

  async function loadFeed(skip, append) {
    if (append) setLoadingMore(true)
    else setLoading(true)
    try {
      const { data } = await api.get('/feed', { params: { skip } })
      setActivities(prev => append ? [...prev, ...data.activities] : data.activities)
      setHasMore(data.hasMore)
    } catch {
      if (!append) setActivities([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  function loadMore() {
    loadFeed(activities.length, true)
  }

  function renderTarget(activity) {
    if (activity.targetType === 'media' && activity.media) {
      return (
        <Link to={`/movie/${activity.media.tmdbId}`} style={s.target}>
          {activity.media.title}
        </Link>
      )
    }
    if (activity.targetType === 'user' && activity.targetUser) {
      return (
        <Link to={`/profile/${activity.targetUser.id}`} style={s.target}>
          {activity.targetUser.username}
        </Link>
      )
    }
    return null
  }

  return (
    <div style={s.page}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>

      <h1 style={s.title}>Fil d'actualité</h1>

      <div style={s.welcome}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
          Bienvenue, {user?.username} !
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
          Explore des films, écris des critiques et suis d'autres cinéphiles pour voir leur activité ici.
        </p>
        <Link to="/search">
          <button style={s.btn}>Découvrir des films</button>
        </Link>
      </div>

      {loading && (
        <div>
          {[...Array(4)].map((_, i) => <ActivitySkeleton key={i} />)}
        </div>
      )}

      {!loading && activities.length === 0 && (
        <div style={{ ...s.empty, background: 'var(--bg2)', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Le fil d'actu s'animera quand tu suivras des membres.<br />
            <Link to="/members" style={{ color: 'var(--accent)' }}>Trouver des membres à suivre →</Link>
          </p>
        </div>
      )}

      {!loading && activities.length > 0 && (
        <>
          {activities.map(a => (
            <div key={a.id} style={s.card}>
              <Link to={`/profile/${a.user.id}`}>
                <div style={s.avatar}>
                  {a.user.avatarUrl
                    ? <img src={a.user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : a.user.username?.[0]?.toUpperCase()}
                </div>
              </Link>

              {a.media?.posterPath && (
                <Link to={`/movie/${a.media.tmdbId}`}>
                  <img src={`${POSTER}${a.media.posterPath}`} alt="" style={s.poster} />
                </Link>
              )}

              <div style={{ flex: 1 }}>
                <div style={s.action}>
                  <Link to={`/profile/${a.user.id}`} style={s.username}>{a.user.username}</Link>
                  {' '}{actionLabel(a.actionType, a.targetType)}{' '}
                  {renderTarget(a)}
                </div>
                <div style={s.time}>{timeAgo(a.createdAt)}</div>
              </div>
            </div>
          ))}

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button style={s.loadMoreBtn} onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Chargement…' : 'Charger plus'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}