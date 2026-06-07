import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const s = {
  page: { maxWidth: '800px', margin: '0 auto', padding: '40px 24px' },
  header: { background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: '12px', padding: '32px', marginBottom: '24px' },
  avatar: { width: '80px', height: '80px', borderRadius: '50%', background: '#e50914', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 700, flexShrink: 0 },
  username: { fontSize: '24px', fontWeight: 700, marginBottom: '6px' },
  bio: { color: '#888', fontSize: '14px', marginBottom: '16px' },
  stats: { display: 'flex', gap: '24px' },
  stat: { textAlign: 'center' },
  statNum: { fontSize: '20px', fontWeight: 700, display: 'block' },
  statLabel: { fontSize: '12px', color: '#888' },
  btn: { background: '#e50914', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  btnOutline: { background: 'transparent', color: '#e50914', border: '1px solid #e50914', borderRadius: '8px', padding: '9px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  btnGray: { background: 'transparent', color: '#aaa', border: '1px solid #333', borderRadius: '8px', padding: '9px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  editCard: { background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: '12px', padding: '24px', marginBottom: '24px' },
  label: { fontSize: '13px', color: '#aaa', marginBottom: '6px', display: 'block' },
  field: { marginBottom: '14px' },
}

export default function ProfilePage() {
  const { id } = useParams()
  const { user: me, fetchMe } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ username: '', bio: '', avatarUrl: '' })
  const [saving, setSaving] = useState(false)
  const [following, setFollowing] = useState(false)
  const [followers, setFollowers] = useState([])
  const [followingList, setFollowingList] = useState([])
  const [activeTab, setActiveTab] = useState(null)

  const isMe = !id || id === 'me' || (me && parseInt(id) === me.id)

  useEffect(() => {
    setLoading(true)
    const req = isMe ? api.get('/users/me') : api.get(`/users/${id}`)
    req.then(r => {
      setProfile(r.data)
      setForm({ username: r.data.username || '', bio: r.data.bio || '', avatarUrl: r.data.avatarUrl || '' })
    }).finally(() => setLoading(false))
  }, [id, isMe])

  async function saveProfile() {
    setSaving(true)
    try {
      const { data } = await api.put('/users/me', form)
      setProfile(prev => ({ ...prev, ...data }))
      await fetchMe()
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleFollow() {
    try {
      await api.post(`/users/${id}/follow`)
      setFollowing(true)
      setProfile(prev => ({ ...prev, _count: { ...prev._count, followers: (prev._count?.followers || 0) + 1 } }))
    } catch {}
  }

  async function handleUnfollow() {
    try {
      await api.delete(`/users/${id}/follow`)
      setFollowing(false)
      setProfile(prev => ({ ...prev, _count: { ...prev._count, followers: Math.max(0, (prev._count?.followers || 1) - 1) } }))
    } catch {}
  }

  async function loadFollowers() {
    const userId = isMe ? me.id : id
    const [f1, f2] = await Promise.all([
      api.get(`/users/${userId}/followers`),
      api.get(`/users/${userId}/following`)
    ])
    setFollowers(f1.data)
    setFollowingList(f2.data)
  }

  async function handleSendMessage() {
    try {
      const { data } = await api.get(`/messages/with/${id}`)
      navigate('/messages', { state: { openConvId: data.id } })
    } catch (err) {
      if (err.response?.status === 403) {
        alert('Vous devez vous suivre mutuellement pour envoyer un message.')
      }
    }
  }

  if (loading) return <div style={{ padding: '80px', textAlign: 'center', color: '#888' }}>Chargement...</div>
  if (!profile) return <div style={{ padding: '80px', textAlign: 'center', color: '#888' }}>Utilisateur non trouve.</div>

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={s.avatar}>
            {profile.avatarUrl
              ? <img src={profile.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : profile.username?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={s.username}>{profile.username}</div>
            {profile.bio && <div style={s.bio}>{profile.bio}</div>}
            <div style={s.stats}>
              <div style={{ ...s.stat, cursor: 'pointer' }} onClick={() => { setActiveTab(activeTab === 'following' ? null : 'following'); loadFollowers() }}>
                <span style={s.statNum}>{profile._count?.following || 0}</span>
                <span style={s.statLabel}>Abonnements</span>
              </div>
              <div style={{ ...s.stat, cursor: 'pointer' }} onClick={() => { setActiveTab(activeTab === 'followers' ? null : 'followers'); loadFollowers() }}>
                <span style={s.statNum}>{profile._count?.followers || 0}</span>
                <span style={s.statLabel}>Abonnes</span>
              </div>
              <div style={s.stat}>
                <span style={s.statNum}>{profile._count?.reviews || 0}</span>
                <span style={s.statLabel}>Critiques</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {isMe ? (
              <button style={s.btnOutline} onClick={() => setEditing(e => !e)}>
                {editing ? 'Annuler' : 'Modifier'}
              </button>
            ) : (
              <>
                {following
                  ? <button style={s.btnOutline} onClick={handleUnfollow}>Ne plus suivre</button>
                  : <button style={s.btn} onClick={handleFollow}>+ Suivre</button>
                }
                <button style={s.btnGray} onClick={handleSendMessage}>Message</button>
              </>
            )}
          </div>
        </div>
      </div>

      {activeTab && (
        <div style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>
            {activeTab === 'followers' ? 'Abonnes' : 'Abonnements'}
          </h3>
          {(activeTab === 'followers' ? followers : followingList).length === 0 ? (
            <div style={{ color: '#555', fontSize: '14px' }}>Aucun utilisateur.</div>
          ) : (activeTab === 'followers' ? followers : followingList).map(u => (
            <div key={u.id} onClick={() => navigate(`/profile/${u.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #2a2a2a', cursor: 'pointer' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e50914', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                {u.avatarUrl ? <img src={u.avatarUrl} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : u.username?.[0]?.toUpperCase()}
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{u.username}</span>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div style={s.editCard}>
          <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>Modifier mon profil</h3>
          <div style={s.field}>
            <label style={s.label}>Nom d'utilisateur</label>
            <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
          </div>
          <div style={s.field}>
            <label style={s.label}>Bio</label>
            <textarea rows={3} style={{ resize: 'vertical' }} value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Parle un peu de toi..." />
          </div>
          <div style={s.field}>
            <label style={s.label}>URL Avatar</label>
            <input value={form.avatarUrl} onChange={e => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://..." />
          </div>
          <button style={s.btn} onClick={saveProfile} disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      )}
    </div>
  )
}