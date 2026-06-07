import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f0f' },
  card: { background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '420px' },
  title: { fontSize: '26px', fontWeight: 700, marginBottom: '8px' },
  sub: { color: '#888', fontSize: '14px', marginBottom: '32px' },
  label: { fontSize: '13px', color: '#aaa', marginBottom: '6px', display: 'block' },
  field: { marginBottom: '18px' },
  btn: { width: '100%', background: '#e50914', color: '#fff', borderRadius: '8px', padding: '12px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', border: 'none', marginTop: '8px' },
  googleBtn: { width: '100%', background: '#242424', color: '#fff', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: '1px solid #3e3e3e', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  divider: { display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0', color: '#555', fontSize: '13px' },
  line: { flex: 1, height: '1px', background: '#2e2e2e' },
  error: { background: '#2d1111', border: '1px solid #5c1111', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#ff6b6b', marginBottom: '16px' },
  footer: { textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#666' }
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      login(data.token, data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Connexion </h1>
        <p style={s.sub}>Content de te revoir sur SupContent</p>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input type="email" placeholder="ton@email.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Mot de passe</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div style={s.divider}><span style={s.line} /> ou <span style={s.line} /></div>

        <a href="/api/auth/google">
          <button style={s.googleBtn}>
            <span></span> Continuer avec Google
          </button>
        </a>

        <p style={s.footer}>
          Pas encore de compte ? <Link to="/register" style={{ color: '#e50914' }}>S'inscrire</Link>
        </p>
      </div>
    </div>
  )
}
