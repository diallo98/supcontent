import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div style={{
      maxWidth: '500px', margin: '0 auto', padding: '100px 24px',
      textAlign: 'center', color: 'var(--text)'
    }}>
      <div style={{ fontSize: '72px', fontWeight: 800, color: 'var(--accent)', marginBottom: '8px' }}>404</div>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>Page introuvable</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '28px' }}>
        Cette page n'existe pas ou a été déplacée.
      </p>
      <Link to="/">
        <button style={{
          background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px',
          padding: '10px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
        }}>
          Retour à l'accueil
        </button>
      </Link>
    </div>
  )
}