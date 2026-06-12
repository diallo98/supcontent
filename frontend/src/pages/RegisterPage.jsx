import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text)' },
  card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '420px', boxSizing: 'border-box' },
  title: { fontSize: '26px', fontWeight: 700, marginBottom: '8px', color: 'var(--text)' },
  sub: { color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' },
  label: { fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 500 },
  field: { marginBottom: '18px' },
  input: { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit' },
  btn: { width: '100%', background: 'var(--accent)', color: '#fff', borderRadius: '8px', padding: '12px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', border: 'none', marginTop: '8px', transition: 'opacity 0.2s' },
  error: { background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#ff6b6b', marginBottom: '16px' },
  success: { background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.4)', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#6bff6b', marginBottom: '16px' },
  footer: { textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }
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
      setError(errs ? errs.map(e => e.msg).join(', ') : err.response?.data?.error || "Erreur lors de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Créer un compte</h1>
        <p style={s.sub}>Rejoins la communauté SupContent</p>

        {error && <div style={s.error}>{error}</div>}
        {success && <div style={s.success}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div style={s.field}>
            <label style={s.label}>Nom d'utilisateur</label>
            <input 
              style={s.input}
              placeholder="cinephile42" 
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })} 
              required 
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input 
              style={s.input}
              type="email" 
              placeholder="ton@email.com" 
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} 
              required 
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Mot de passe</label>
            <input 
              style={s.input}
              type="password" 
              placeholder="6 caractères minimum" 
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} 
              required 
            />
          </div>
          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p style={s.footer}>
          Déjà un compte ? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Se connecter</Link>
        </p>
      </div>
    </div>
  )
}