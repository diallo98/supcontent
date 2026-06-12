import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' },
  card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '420px' },
  title: { fontSize: '26px', fontWeight: 700, marginBottom: '8px', color: 'var(--text)' },
  sub: { color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' },
  label: { fontSize: '13px', color: 'var(--text)', marginBottom: '6px', display: 'block' },
  field: { marginBottom: '18px' },
  input: { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', padding: '10px 14px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' },
  btn: { width: '100%', background: 'var(--accent)', color: '#fff', borderRadius: '8px', padding: '12px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', border: 'none', marginTop: '8px' },
  googleBtn: { width: '100%', background: 'var(--bg3)', color: 'var(--text)', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: '1px solid var(--border)', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  divider: { display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0', color: 'var(--text-muted)', fontSize: '13px' },
  line: { flex: 1, height: '1px', background: 'var(--border)' },
  error: { background: '#2d1111', border: '1px solid #5c1111', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#ff6b6b', marginBottom: '16px' },
  footer: { textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' }
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
        <h1 style={s.title}>Connexion</h1>
        <p style={s.sub}>Content de te revoir sur SupContent</p>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input 
              type="email" 
              placeholder="ton@email.com" 
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} 
              required 
              style={s.input}
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Mot de passe</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} 
              required 
              style={s.input}
            />
          </div>
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div style={s.divider}><span style={s.line} /> ou <span style={s.line} /></div>

        <a href="/api/auth/google" style={{ textDecoration: 'none' }}>
          <button style={s.googleBtn}>
            Continuer avec Google
          </button>
        </a>

        <p style={s.footer}>
          Pas encore de compte ? <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>S'inscrire</Link>
        </p>
      </div>
    </div>
  )
}