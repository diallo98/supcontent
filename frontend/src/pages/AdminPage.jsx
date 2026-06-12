import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const s = {
  page: { maxWidth: '900px', margin: '0 auto', padding: '40px 24px' },
  title: { fontSize: '22px', fontWeight: 700, marginBottom: '8px' },
  subtitle: { fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px' },
  card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', marginBottom: '12px' },
  badge: { background: 'var(--accent)', color: '#fff', borderRadius: '6px', padding: '3px 10px', fontSize: '12px', fontWeight: 700 },
  reason: { fontSize: '13px', color: 'var(--text)', marginTop: '6px' },
  meta: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' },
  actions: { display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' },
  btn: { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },
  btnGray: { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },
  btnDark: { background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },
  empty: { textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'var(--bg2)', borderRadius: '10px', border: '1px solid var(--border)' },
  reviewContent: { fontSize: '14px', color: 'var(--text)', marginTop: '10px', padding: '10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '6px', lineHeight: 1.6 },
}

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [msgs, setMsgs] = useState({})

  useEffect(() => {
    if (!user) return
    if (user.role !== 'admin') {
      navigate('/')
      return
    }
    api.get('/moderation/reports')
      .then(r => setReports(r.data))
      .finally(() => setLoading(false))
  }, [user])

  function setMsg(id, text) {
    setMsgs(prev => ({ ...prev, [id]: text }))
    setTimeout(() => setMsgs(prev => ({ ...prev, [id]: '' })), 3000)
  }

  async function handleDeleteReview(report) {
    try {
      await api.delete(`/moderation/reviews/${report.reviewId}`)
      setReports(prev => prev.filter(r => r.reviewId !== report.reviewId))
      setMsg(report.id, 'Critique supprimée.')
    } catch (err) {
      setMsg(report.id, err?.response?.data?.error || 'Erreur.')
    }
  }

  async function handleDismiss(report) {
    try {
      await api.delete(`/moderation/reports/${report.id}`)
      setReports(prev => prev.filter(r => r.id !== report.id))
    } catch (err) {
      setMsg(report.id, err?.response?.data?.error || 'Erreur.')
    }
  }

  async function handleBan(report) {
    if (!window.confirm(`Bannir ${report.review.user.username} ?`)) return
    try {
      await api.put(`/moderation/users/${report.review.user.id}/ban`)
      setMsg(report.id, `${report.review.user.username} est banni.`)
    } catch (err) {
      setMsg(report.id, err?.response?.data?.error || 'Erreur.')
    }
  }

  async function handleFeature(report) {
    try {
      await api.put(`/moderation/reviews/${report.reviewId}/feature`)
      setMsg(report.id, 'Critique mise en avant.')
    } catch (err) {
      setMsg(report.id, err?.response?.data?.error || 'Erreur.')
    }
  }

  if (loading) return <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>Chargement...</div>

  return (
    <div style={s.page}>
      <h1 style={s.title}>Panel de modération</h1>
      <p style={s.subtitle}>{reports.length} signalement(s) en attente</p>

      {reports.length === 0 ? (
        <div style={s.empty}>
          <p style={{ fontSize: '14px' }}>Aucun signalement en attente.</p>
        </div>
      ) : reports.map(report => (
        <div key={report.id} style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={s.badge}>Signalement</span>
              <div style={s.reason}>Raison : {report.reason}</div>
              <div style={s.meta}>
                Signalé par <strong>{report.reporter.username}</strong> — critique de <strong>{report.review.user.username}</strong> sur <strong>{report.review.media.title}</strong>
              </div>
            </div>
          </div>

          <div style={s.reviewContent}>
            {report.review.content.length > 300
              ? report.review.content.slice(0, 300) + '...'
              : report.review.content}
          </div>

          <div style={s.actions}>
            <button style={s.btn} onClick={() => handleDeleteReview(report)}>
              Supprimer la critique
            </button>
            <button style={s.btnDark} onClick={() => handleBan(report)}>
              Bannir l'auteur
            </button>
            <button style={s.btnGray} onClick={() => handleFeature(report)}>
              Coup de coeur
            </button>
            <button style={s.btnGray} onClick={() => handleDismiss(report)}>
              Ignorer
            </button>
            {msgs[report.id] && (
              <span style={{ fontSize: '13px', color: '#4caf50', alignSelf: 'center' }}>{msgs[report.id]}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}