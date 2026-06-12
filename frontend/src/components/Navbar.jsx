import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useState, useEffect, useRef } from 'react'
import api from '../services/api'

const styles = {
  nav: {
    background: 'var(--bg2)',
    borderBottom: '1px solid var(--border)',
    padding: '0 32px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: { color: 'var(--accent)', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.5px', textDecoration: 'none' },
  links: { display: 'flex', alignItems: 'center', gap: '24px' },
  link: { color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' },
  searchBox: {
    display: 'flex', alignItems: 'center', background: 'var(--bg3)',
    border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px', gap: '8px'
  },
  searchInput: {
    background: 'transparent', border: 'none', color: 'var(--text)',
    outline: 'none', fontSize: '14px', width: '180px'
  },
  avatar: {
    width: '34px', height: '34px', borderRadius: '50%',
    background: 'var(--accent)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
    overflow: 'hidden'
  },
  btn: {
    background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px',
    padding: '7px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
  },
  bellWrapper: { position: 'relative', cursor: 'pointer' },
  bellBtn: { background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer', padding: '4px' },
  badge: {
    position: 'absolute', top: '-4px', right: '-4px',
    background: 'var(--accent)', color: '#fff', borderRadius: '50%',
    width: '16px', height: '16px', fontSize: '10px', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  dropdown: {
    position: 'absolute', top: '40px', right: 0,
    background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px',
    minWidth: '280px', zIndex: 200, boxShadow: 'var(--shadow)',
    maxHeight: '360px', overflowY: 'auto'
  },
  notifItem: { padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-muted)' },
  notifUnread: { background: 'var(--bg3)', borderLeft: '3px solid var(--accent)' },
  notifTime: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' },
  dropdownHeader: { padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '14px', color: 'var(--text)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  markRead: { fontSize: '12px', color: 'var(--accent)', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 600 }
}

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60) return 'À l\'instant'
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`
  return `Il y a ${Math.floor(diff / 86400)} j`
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const bellRef = useRef(null)

  useEffect(() => {
    if (!user) return
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 15000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    function handleClickOutside(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function fetchUnreadCount() {
    try {
      const { data } = await api.get('/notifications/unread-count')
      setUnreadCount(data.count)
    } catch {}
  }

  async function handleBellClick() {
    if (!showNotifs) {
      try {
        const { data } = await api.get('/notifications')
        setNotifications(data)
        setShowNotifs(true)
        await api.put('/notifications/mark-read')
        setUnreadCount(0)
      } catch {}
    } else {
      setShowNotifs(false)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
      setQuery('')
    }
  }

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>SupContent</Link>

      {user && (
        <form onSubmit={handleSearch} style={styles.searchBox}>
          <input
            style={styles.searchInput}
            placeholder="Rechercher un film..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </form>
      )}

      <div style={styles.links}>
        {user ? (
          <>
            <Link to="/" style={styles.link}>Fil d'actu</Link>
            <Link to="/search" style={styles.link}>Films</Link>
            <Link to="/library" style={styles.link}>Bibliothèque</Link>
            <Link to="/lists" style={styles.link}>Mes listes</Link>
            <Link to="/members" style={styles.link}>Membres</Link>
            <Link to="/messages" style={styles.link}>Messages</Link>
            {user.role === 'admin' && (
              <Link to="/admin" style={{ ...styles.link, color: 'var(--accent)' }}>Admin</Link>
            )}

            <div style={styles.bellWrapper} ref={bellRef}>
              <button style={styles.bellBtn} onClick={handleBellClick}>&#128276;</button>
              {unreadCount > 0 && (
                <div style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</div>
              )}
              {showNotifs && (
                <div style={styles.dropdown}>
                  <div style={styles.dropdownHeader}>
                    <span>Notifications</span>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      Aucune notification.
                    </div>
                  ) : notifications.map(n => (
                    <div key={n.id} style={{ ...styles.notifItem, ...(n.read ? {} : styles.notifUnread) }}>
                      <div style={{ color: 'var(--text)' }}>{n.message}</div>
                      <div style={styles.notifTime}>{timeAgo(n.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ancien sélecteur de thème classique (Rond Noir et Blanc) */}
            <button 
              className="theme-toggle-btn" 
              onClick={toggle} 
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            />

            <Link to="/me">
              <div style={styles.avatar}>
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : user.username?.[0]?.toUpperCase() || 'U'}
              </div>
            </Link>

            <button style={{ ...styles.btn, background: 'var(--bg3)', color: 'var(--text-muted)' }}
              onClick={() => { logout(); navigate('/login') }}>
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link to="/search" style={styles.link}>Films</Link>
            <Link to="/login"><button style={styles.btn}>Connexion</button></Link>
            <Link to="/register"><button style={{ ...styles.btn, background: 'var(--bg3)', color: 'var(--text)' }}>Inscription</button></Link>
          </>
        )}
      </div>
    </nav>
  )
}