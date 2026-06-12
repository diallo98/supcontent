import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const s = {
  page: { maxWidth: '800px', margin: '0 auto', padding: '40px 24px', color: 'var(--text)' },
  title: { fontSize: '22px', fontWeight: 700, marginBottom: '24px' },
  card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px 20px', marginBottom: '10px', display: 'flex', gap: '14px', alignItems: 'center', cursor: 'pointer' },
  avatar: { width: '44px', height: '44px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', flexShrink: 0, color: '#fff' },
  username: { fontSize: '15px', fontWeight: 600, marginBottom: '4px' },
  preview: { fontSize: '13px', color: 'var(--text-muted)' },
  empty: { textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'var(--bg2)', borderRadius: '10px', border: '1px solid var(--border)' },
  chatBox: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0', marginTop: '16px', display: 'flex', flexDirection: 'column', height: '500px' },
  chatHeader: { padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '10px' },
  messages: { flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' },
  msgMe: { alignSelf: 'flex-end', background: 'var(--accent)', color: '#fff', borderRadius: '12px 12px 2px 12px', padding: '10px 14px', maxWidth: '65%', fontSize: '14px' },
  msgOther: { alignSelf: 'flex-start', background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '12px 12px 12px 2px', padding: '10px 14px', maxWidth: '65%', fontSize: '14px' },
  inputRow: { padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' },
  input: { flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--text)', fontSize: '14px', fontFamily: 'inherit' },
  btn: { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' },
  backBtn: { background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0 },
}

export default function MessagesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const location = useLocation()

  // Intercepter la conversation passée par l'état de navigation
  useEffect(() => {
    api.get('/messages')
      .then(r => {
        setConversations(r.data)
        if (location.state?.openConvId) {
          const conv = r.data.find(c => c.id === location.state.openConvId)
          if (conv) setActiveConv(conv)
        }
      })
      .finally(() => setLoading(false))
  }, [location.state])

  useEffect(() => {
    if (!activeConv) return
    const load = () => {
      api.get(`/messages/${activeConv.id}/messages`)
        .then(r => setMessages(r.data))
    }
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [activeConv])

  function getOtherUser(conv) {
    return conv.user1.id === user.id ? conv.user2 : conv.user1
  }

  async function openConversation(conv) {
    setActiveConv(conv)
    setMessages([])
  }

  async function handleSend() {
    if (!newMessage.trim() || sending) return
    setSending(true)
    try {
      const { data } = await api.post(`/messages/${activeConv.id}/messages`, { content: newMessage.trim() })
      setMessages(prev => [...prev, data])
      setNewMessage('')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading) return <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>Chargement...</div>

  if (activeConv) {
    const other = getOtherUser(activeConv)
    return (
      <div style={s.page}>
        <button style={s.backBtn} onClick={() => setActiveConv(null)}>← Retour aux conversations</button>
        <div style={s.chatBox}>
          <div style={s.chatHeader}>
            <div style={{ ...s.avatar, width: '32px', height: '32px', fontSize: '14px' }}>
              {other.avatarUrl
                ? <img src={other.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : other.username?.[0]?.toUpperCase()}
            </div>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${other.id}`)}>{other.username}</span>
          </div>
          <div style={s.messages}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', margin: 'auto' }}>
                Aucun message. Commencez la conversation !
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} style={msg.sender.id === user.id ? s.msgMe : s.msgOther}>
                {msg.content}
              </div>
            ))}
          </div>
          <div style={s.inputRow}>
            <input
              style={s.input}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrire un message..."
            />
            <button style={s.btn} onClick={handleSend} disabled={sending}>
              {sending ? '...' : 'Envoyer'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <h1 style={s.title}>Messages</h1>
      {conversations.length === 0 ? (
        <div style={s.empty}>
          <p style={{ fontSize: '14px' }}>Aucune conversation pour l'instant.</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', opacity: 0.8 }}>
            Rendez-vous sur le profil d'un membre que vous suivez mutuellement pour lui envoyer un message.
          </p>
        </div>
      ) : (
        conversations.map(conv => {
          const other = getOtherUser(conv)
          const lastMsg = conv.messages?.[0]
          return (
            <div key={conv.id} style={s.card} onClick={() => openConversation(conv)}>
              <div style={s.avatar}>
                {other.avatarUrl
                  ? <img src={other.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  : other.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={s.username}>{other.username}</div>
                <div style={s.preview}>{lastMsg ? lastMsg.content : 'Aucun message'}</div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}