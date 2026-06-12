import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

// Constantes pour DiceBear avatars
const DICEBEAR_STYLES = ['avataaars', 'bottts', 'fun-emoji', 'lorelei', 'micah', 'notionists', 'open-peeps', 'personas', 'pixel-art']
const PRESET_SEEDS = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu']
const PRESET_STYLE = 'avataaars'

const presetAvatars = PRESET_SEEDS.map(seed =>
  `https://api.dicebear.com/7.x/${PRESET_STYLE}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
)

const s = {
  page: { maxWidth: '800px', margin: '0 auto', padding: '40px 24px' },
  header: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', marginBottom: '24px' },
  avatar: { width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 700, flexShrink: 0 },
  username: { fontSize: '24px', fontWeight: 700, marginBottom: '6px' },
  bio: { color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' },
  stats: { display: 'flex', gap: '24px' },
  stat: { textAlign: 'center' },
  statNum: { fontSize: '20px', fontWeight: 700, display: 'block' },
  statLabel: { fontSize: '12px', color: 'var(--text-muted)' },
  btn: { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  btnOutline: { background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '8px', padding: '9px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  btnGray: { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '8px', padding: '9px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  editCard: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '24px' },
  label: { fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' },
  field: { marginBottom: '14px' },
}

export default function ProfilePage() {
  const { id } = useParams()
  const { user: me, fetchMe } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ username: '', bio: '' })
  const [saving, setSaving] = useState(false)
  const [following, setFollowing] = useState(false)
  const [followers, setFollowers] = useState([])
  const [followingList, setFollowingList] = useState([])
  const [activeTab, setActiveTab] = useState(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)

  const isMe = !id || id === 'me' || (me && parseInt(id) === me.id)

  useEffect(() => {
    setLoading(true)
    const req = isMe ? api.get('/users/me') : api.get(`/users/${id}`)
    req.then(async r => {
      setProfile(r.data)
      setForm({ username: r.data.username || '', bio: r.data.bio || '' })
      if (!isMe && me) {
        const { data } = await api.get(`/users/${id}/followers`)
        setFollowing(data.some(f => f.id === me.id))
      }
    }).finally(() => setLoading(false))
  }, [id, isMe])

  const handleExport = async (format) => {
    const token = localStorage.getItem('token')
    const res = await fetch(`/api/export?format=${format}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `supcontent-export.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const { data } = await api.patch('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (data.avatarUrl) {
        setProfile(prev => ({ ...prev, avatarUrl: data.avatarUrl }))
        await fetchMe()
      }
    } catch (err) {
      console.error('Avatar upload error:', err.response?.data || err)
    } finally {
      setAvatarUploading(false)
      setShowAvatarModal(false)
    }
  }

  const handleSelectPreset = async (url) => {
    setAvatarUploading(true)
    try {
      const { data } = await api.put('/users/me', { ...form, avatarUrl: url })
      setProfile(prev => ({ ...prev, avatarUrl: url }))
      await fetchMe()
      setShowAvatarModal(false)
    } catch (err) {
      console.error(err)
    } finally {
      setAvatarUploading(false)
    }
  }

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

  if (loading) return (
    <div style={s.page}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      <div style={s.header}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg3)', flexShrink: 0, animation: 'pulse 1.5s infinite' }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: '200px', height: '24px', background: 'var(--bg3)', borderRadius: '6px', marginBottom: '12px', animation: 'pulse 1.5s infinite' }} />
            <div style={{ display: 'flex', gap: '24px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ width: '60px', height: '36px', background: 'var(--bg3)', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
  if (!profile) return <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>Utilisateur non trouvé.</div>

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Avatar avec bouton upload si c'est mon profil */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ ...s.avatar, background: profile.avatarUrl ? 'transparent' : 'var(--accent)', overflow: 'hidden' }}>
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : profile.username?.[0]?.toUpperCase()}
            </div>
            {isMe && (
              <div
                onClick={() => setShowAvatarModal(true)}
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: '26px', height: '26px', borderRadius: '50%',
                  background: 'var(--bg3)', border: '2px solid var(--bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: '13px', color: 'var(--text)'
                }}
              >
                {avatarUploading ? '...' : '+'}
              </div>
            )}
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
                <span style={s.statLabel}>Abonnés</span>
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

      {/* Modale choix avatar */}
      {showAvatarModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setShowAvatarModal(false)}>
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px',
            padding: '28px', width: '480px', maxWidth: '95vw'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Choisir un avatar</h3>

            {/* Grille avatars DiceBear */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
              {presetAvatars.map((url, i) => (
                <div key={i} onClick={() => handleSelectPreset(url)} style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  border: profile.avatarUrl === url ? '3px solid var(--accent)' : '3px solid transparent',
                  cursor: 'pointer', overflow: 'hidden', background: 'var(--bg3)',
                  transition: 'border 0.2s'
                }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>

            {/* Séparateur */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Ou uploader une photo</span>
              <label style={{ ...s.btnOutline, cursor: 'pointer' }}>
                Choisir un fichier
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </label>
            </div>
          </div>
        </div>
      )}

      {activeTab && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>
            {activeTab === 'followers' ? 'Abonnés' : 'Abonnements'}
          </h3>
          {(activeTab === 'followers' ? followers : followingList).length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Aucun utilisateur.</div>
          ) : (activeTab === 'followers' ? followers : followingList).map(u => (
            <div key={u.id} onClick={() => navigate(`/profile/${u.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0, overflow: 'hidden', color: '#fff' }}>
                {u.avatarUrl
                  ? <img src={u.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : u.username?.[0]?.toUpperCase()}
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
          <button style={s.btn} onClick={saveProfile} disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>

          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <div style={s.label}>Mes données (RGPD)</div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button style={s.btnOutline} onClick={() => handleExport('json')}>Exporter en JSON</button>
              <button style={s.btnOutline} onClick={() => handleExport('csv')}>Exporter en CSV</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}