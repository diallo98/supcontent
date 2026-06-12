import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function MemberSkeleton() {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg3)', flexShrink: 0, animation: 'pulse 1.5s infinite' }} />
      <div style={{ flex: 1 }}>
        <div style={{ width: '120px', height: '14px', background: 'var(--bg3)', borderRadius: '4px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ width: '80px', height: '11px', background: 'var(--bg3)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
      </div>
      <div style={{ width: '90px', height: '32px', background: 'var(--bg3)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
    </div>
  )
}

export default function MembersPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [followStatus, setFollowStatus] = useState({})
  const navigate = useNavigate()
  const debounceRef = useRef(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSearched(false)
      setHasMore(false)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doSearch(query, 0, false)
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  async function doSearch(q, skip, append) {
    if (append) setLoadingMore(true)
    else setLoading(true)

    try {
      const r = await api.get(`/users/search?q=${encodeURIComponent(q.trim())}&skip=${skip}`)
      const { users, hasMore: more } = r.data

      setResults(prev => append ? [...prev, ...users] : users)
      setSearched(true)
      setHasMore(more)

      const newStatus = {}
      users.forEach(u => { newStatus[u.id] = u.isFollowing })
      setFollowStatus(prev => ({ ...prev, ...newStatus }))
    } catch {
      if (!append) setResults([])
      setSearched(true)
      setHasMore(false)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  function loadMore() {
    doSearch(query, results.length, true)
  }

  async function handleFollow(userId) {
    try {
      await api.post(`/users/${userId}/follow`)
      setFollowStatus(prev => ({ ...prev, [userId]: true }))
    } catch {}
  }

  async function handleUnfollow(userId) {
    try {
      await api.delete(`/users/${userId}/follow`)
      setFollowStatus(prev => ({ ...prev, [userId]: false }))
    } catch {}
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px', color: 'var(--text)' }}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>

      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Membres</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>Trouve et suis d'autres cinéphiles.</p>

      <div style={{ position: 'relative', marginBottom: '32px' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher un membre par nom…"
          style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', padding: '12px 16px', fontSize: '14px', fontFamily: 'inherit' }}
        />
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[...Array(4)].map((_, i) => <MemberSkeleton key={i} />)}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '15px', textAlign: 'center', padding: '40px 0' }}>
          Aucun membre trouvé pour « {query} ».
        </div>
      )}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {results.map(member => {
            const isFollowing = followStatus[member.id]
            return (
              <div key={member.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>

                <div
                  onClick={() => navigate(`/profile/${member.id}`)}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', flexShrink: 0, cursor: 'pointer', overflow: 'hidden', color: '#fff' }}
                >
                  {member.avatarUrl
                    ? <img src={member.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : member.username?.[0]?.toUpperCase()}
                </div>

                <div style={{ flex: '1 1 150px', cursor: 'pointer', minWidth: 0 }} onClick={() => navigate(`/profile/${member.id}`)}>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>{member.username}</div>
                  {member.bio && <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.bio}</div>}
                  <div style={{ color: 'var(--text-muted)', opacity: 0.8, fontSize: '12px', marginTop: '4px' }}>
                    {member._count?.followers || 0} abonné{member._count?.followers !== 1 ? 's' : ''}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {isFollowing ? (
                    <button
                      onClick={() => handleUnfollow(member.id)}
                      onMouseEnter={e => e.target.textContent = 'Ne plus suivre'}
                      onMouseLeave={e => e.target.textContent = '✓ Suivi'}
                      style={{ background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', minWidth: '110px' }}
                    >
                      ✓ Suivi
                    </button>
                  ) : (
                    <button
                      onClick={() => handleFollow(member.id)}
                      style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', minWidth: '110px' }}
                    >
                      + Suivre
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {hasMore && !loading && (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px', padding: '10px 28px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            {loadingMore ? 'Chargement…' : 'Charger plus'}
          </button>
        </div>
      )}
    </div>
  )
}