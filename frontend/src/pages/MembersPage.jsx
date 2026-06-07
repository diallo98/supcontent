import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function MembersPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [followMsg, setFollowMsg] = useState({})
  const navigate = useNavigate()

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const r = await api.get(`/users/search?q=${encodeURIComponent(query.trim())}`)
      setResults(r.data)
      setSearched(true)
    } catch {
      setResults([])
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleFollow(userId) {
    try {
      await api.post(`/users/${userId}/follow`)
      setFollowMsg(prev => ({ ...prev, [userId]: 'Suivi !' }))
      setTimeout(() => setFollowMsg(prev => ({ ...prev, [userId]: '' })), 2000)
    } catch {
      setFollowMsg(prev => ({ ...prev, [userId]: 'Déjà suivi.' }))
      setTimeout(() => setFollowMsg(prev => ({ ...prev, [userId]: '' })), 2000)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px', color: '#fff' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Membres</h1>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '32px' }}>Trouve et suis d'autres cinéphiles.</p>

      {/* Barre de recherche */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher un membre par nom…"
          style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: '8px', color: '#fff', padding: '12px 16px', fontSize: '14px', fontFamily: 'inherit' }}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          style={{ background: '#e50914', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: query.trim() ? 'pointer' : 'not-allowed', opacity: query.trim() ? 1 : 0.5 }}
        >
          {loading ? 'Recherche…' : 'Rechercher'}
        </button>
      </form>

      {/* Résultats */}
      {searched && results.length === 0 && (
        <div style={{ color: '#555', fontStyle: 'italic', fontSize: '15px', textAlign: 'center', padding: '40px 0' }}>
          Aucun membre trouvé pour « {query} ».
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {results.map(member => (
          <div key={member.id} style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            {/* Avatar */}
            <div
              onClick={() => navigate(`/profile/${member.id}`)}
              style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e50914', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', flexShrink: 0, cursor: 'pointer', overflow: 'hidden' }}
            >
              {member.avatarUrl
                ? <img src={member.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : member.username?.[0]?.toUpperCase()}
            </div>

            {/* Infos */}
            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/profile/${member.id}`)}>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>{member.username}</div>
              {member.bio && <div style={{ color: '#666', fontSize: '13px', marginTop: '2px' }}>{member.bio}</div>}
              <div style={{ color: '#555', fontSize: '12px', marginTop: '4px' }}>
                {member._count?.followers || 0} abonné{member._count?.followers !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Bouton suivre */}
            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => handleFollow(member.id)}
                style={{ background: '#e50914', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                + Suivre
              </button>
              {followMsg[member.id] && (
                <div style={{ fontSize: '12px', color: '#4caf50', marginTop: '4px' }}>{followMsg[member.id]}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}