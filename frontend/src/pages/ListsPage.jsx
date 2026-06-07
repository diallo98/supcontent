import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function ListsPage() {
  const [lists, setLists] = useState([])
  const [newName, setNewName] = useState('')
  const [newIsPublic, setNewIsPublic] = useState(true)
  const [creating, setCreating] = useState(false)
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchLists()
  }, [])

  async function fetchLists() {
    try {
      const r = await api.get('/lists/me')
      setLists(r.data)
    } catch {}
  }

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await api.post('/lists', { name: newName.trim(), isPublic: newIsPublic })
      setNewName('')
      setNewIsPublic(true)
      setMsg('Liste créée !')
      setTimeout(() => setMsg(''), 2000)
      fetchLists()
    } catch {
      setMsg('Erreur lors de la création.')
      setTimeout(() => setMsg(''), 2000)
    } finally {
      setCreating(false)
    }
  }

  async function handleTogglePublic(list) {
    try {
      await api.put(`/lists/${list.id}`, { isPublic: !list.isPublic })
      setLists(prev => prev.map(l => l.id === list.id ? { ...l, isPublic: !l.isPublic } : l))
    } catch {}
  }

  async function handleDelete(listId) {
    if (!confirm('Supprimer cette liste ?')) return
    try {
      await api.delete(`/lists/${listId}`)
      setLists(prev => prev.filter(l => l.id !== listId))
    } catch {}
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px', color: '#fff' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '32px' }}>Mes listes</h1>

      {/* Créer une liste */}
      <div style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Créer une nouvelle liste</h3>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Nom de la liste (ex: Films d'horreur préférés)"
            style={{ flex: 1, background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff', padding: '10px 14px', fontSize: '14px', fontFamily: 'inherit' }}
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            style={{ background: '#e50914', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: newName.trim() ? 'pointer' : 'not-allowed', opacity: newName.trim() ? 1 : 0.5, whiteSpace: 'nowrap' }}
          >
            {creating ? 'Création…' : '+ Créer'}
          </button>
        </div>

        {/* Toggle public/privé à la création */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setNewIsPublic(v => !v)}
            style={{
              background: newIsPublic ? '#4caf50' : '#444',
              color: '#fff', border: 'none', borderRadius: '20px',
              padding: '4px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            {newIsPublic ? 'Publique' : 'Privée'}
          </button>
          <span style={{ fontSize: '12px', color: '#666' }}>
            {newIsPublic ? 'Visible par tous sur ton profil' : 'Visible uniquement par toi'}
          </span>
        </div>

        {msg && <div style={{ fontSize: '13px', color: msg.includes('Erreur') ? '#e50914' : '#4caf50', marginTop: '8px' }}>{msg}</div>}
      </div>

      {/* Liste des listes */}
      {lists.length === 0 ? (
        <div style={{ color: '#555', fontStyle: 'italic', fontSize: '15px', textAlign: 'center', padding: '60px 0' }}>
          Aucune liste pour l'instant. Crée-en une !
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {lists.map(list => (
            <div key={list.id} style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: list.items?.length > 0 ? '16px' : '0' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '16px' }}>{list.name}</span>
                    <button
                      onClick={() => handleTogglePublic(list)}
                      style={{
                        background: list.isPublic ? '#4caf5022' : '#44444422',
                        color: list.isPublic ? '#4caf50' : '#888',
                        border: `1px solid ${list.isPublic ? '#4caf50' : '#444'}`,
                        borderRadius: '20px', padding: '2px 10px',
                        fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      {list.isPublic ? 'Publique' : 'Privée'}
                    </button>
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    {list.items?.length || 0} film{list.items?.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(list.id)}
                  style={{ background: 'transparent', border: '1px solid #444', color: '#888', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}
                >
                  Supprimer
                </button>
              </div>

              {/* Films dans la liste */}
              {list.items?.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {list.items.map(item => (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/movie/${item.media?.tmdbId}`)}
                      style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '6px 12px', fontSize: '13px', color: '#aaa', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={e => e.currentTarget.style.color = '#aaa'}
                    >
                      {item.media?.title || `Film #${item.mediaId}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}