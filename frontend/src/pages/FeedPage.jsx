import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const POSTER = 'https://image.tmdb.org/t/p/w92'

const s = {
  page: { maxWidth: '700px', margin: '0 auto', padding: '40px 24px' },
  title: { fontSize: '22px', fontWeight: 700, marginBottom: '24px' },
  card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px 20px', marginBottom: '12px', display: 'flex', gap: '14px', alignItems: 'flex-start' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', flexShrink: 0, color: '#fff' },
  action: { fontSize: '14px', color: 'var(--text)', lineHeight: 1.5 },
  time: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' },
  username: { color: 'var(--text)', fontWeight: 600 },
  target: { color: 'var(--accent)', fontWeight: 600 },
  empty: { textAlign: 'center', padding: '60px', color: 'var(--text-muted)' },
  welcome: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '32px', textAlign: 'center', marginBottom: '24px' },
  btn: { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 22px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'inline-block', marginTop: '16px' },
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

export default function FeedPage() {
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // On récupère les activités publiques récentes via l'endpoint users/me
    // Le fil d'actu réel nécessite un endpoint dédié (à implémenter par membre 2)
    // Pour l'instant on affiche un feed basé sur les activités globales
    setLoading(false)
  }, [])

  return (
    <div style={s.page}>
      <h1 style={s.title}>Fil d'actualité</h1>

      {/* Message de bienvenue */}
      <div style={s.welcome}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}></div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
          Bienvenue, {user?.username} !
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
          Explore des films, écris des critiques et suis d'autres cinéphiles pour voir leur activité ici.
        </p>
        <Link to="/search">
          <button style={s.btn}> Découvrir des films</button>
        </Link>
      </div>

      {/* Placeholder fil d'actu — sera alimenté quand le backend social sera branché */}
      <div style={{ ...s.empty, background: 'var(--bg2)', borderRadius: '10px', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Le fil d'actu s'animera quand tu suivras des membres.<br />
          <Link to="/search" style={{ color: 'var(--accent)' }}>Commence par explorer des films →</Link>
        </p>
      </div>
    </div>
  )
}