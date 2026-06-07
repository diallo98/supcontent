import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f0f' },
  card: { background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '420px' },
  title: { fontSize: '26px', fontWeight: 700, marginBottom: '8px' },
  sub: { color: '#888', fontSize: '14px', marginBottom: '32px' },
  label: { fontSize: '13px', color: '#aaa', marginBottom: '6px', display: 'block' },
  field: { marginBottom: '18px' },
  btn: { width: '100%', background: '#e50914', color: '#fff', borderRadius: '8px', padding: '12px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', border: 'none', marginTop: '8px' },
  error: { background: '#2d1111', border: '1px solid #5c1111', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#ff6b6b', marginBottom: '16px' },
  success: { background: '#0d2d0d', border: '1px solid #1a5c1a', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#6bff6b', marginBottom: '16px' },
  footer: { textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#666' }
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/register', form)
      setSuccess('Compte créé ! Redirection vers la connexion…')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      const errs = err.response?.data?.errors
      setError(errs ? errs.map(e => e.msg).join(', ') : err.response?.data?.error || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Créer un compte </h1>
        <p style={s.sub}>Rejoins la communauté SupContent</p>

        {error && <div style={s.error}>{error}</div>}
        {success && <div style={s.success}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div style={s.field}>
            <label style={s.label}>Nom d'utilisateur</label>
            <input placeholder="cinephile42" value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input type="email" placeholder="ton@email.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Mot de passe</label>
            <input type="password" placeholder="6 caractères minimum" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p style={s.footer}>
          Déjà un compte ? <Link to="/login" style={{ color: '#e50914' }}>Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
