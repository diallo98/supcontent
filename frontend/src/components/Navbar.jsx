import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useState, useEffect, useRef } from 'react'
import api from '../services/api'

const styles = {
  nav: {
    background: '#141414',
    borderBottom: '1px solid #2e2e2e',
    padding: '0 32px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: { color: '#e50914', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.5px', textDecoration: 'none' },
  links: { display: 'flex', alignItems: 'center', gap: '24px' },
  link: { color: '#ccc', fontSize: '14px', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' },
  searchBox: {
    display: 'flex', alignItems: 'center', background: '#242424',
    border: '1px solid #2e2e2e', borderRadius: '6px', padding: '6px 12px', gap: '8px'
  },
  searchInput: {
    background: 'transparent', border: 'none', color: '#f1f1f1',
    outline: 'none', fontSize: '14px', width: '180px'
  },
  avatar: {
    width: '34px', height: '34px', borderRadius: '50%',
    background: '#e50914', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: 700, fontSize: '14px', cursor: 'pointer'
  },
  btn: {
    background: '#e50914', color: '#fff', border: 'none', borderRadius: '6px',
    padding: '7px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
  },
  bellWrapper: { position: 'relative', cursor: 'pointer' },
  bellBtn: { background: 'transparent', border: 'none', color: '#ccc', fontSize: '20px', cursor: 'pointer', padding: '4px' },
  badge: {
    position: 'absolute', top: '-4px', right: '-4px',
    background: '#e50914', color: '#fff', borderRadius: '50%',
    width: '16px', height: '16px', fontSize: '10px', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  dropdown: {
    position: 'absolute', top: '40px', right: 0,
    background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: '10px',
    minWidth: '280px', zIndex: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    maxHeight: '360px', overflowY: 'auto'
  },
  notifItem: { padding: '12px 16px', borderBottom: '1px solid #2a2a2a', fontSize: '13px', color: '#ccc' },
  notifUnread: { background: '#1e1e1e', borderLeft: '3px solid #e50914' },
  notifTime: { fontSize: '11px', color: '#555', marginTop: '4px' },
  dropdownHeader: { padding: '12px 16px', borderBottom: '1px solid #2e2e2e', fontWeight: 700, fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  markRead: { fontSize: '12px', color: '#e50914', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 600 }
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
            <Link to="/library" style={styles.link}>Bibliotheque</Link>
            <Link to="/lists" style={styles.link}>Mes listes</Link>
            <Link to="/members" style={styles.link}>Membres</Link>
            <Link to="/messages" style={styles.link}>Messages</Link>
            {user.role === 'admin' && (
              <Link to="/admin" style={{ ...styles.link, color: '#e50914' }}>Admin</Link>
            )}

            <div style={styles.bellWrapper} ref={bellRef}>
              <button style={styles.bellBtn} onClick={handleBellClick}>
                &#128276;
              </button>
              {unreadCount > 0 && (
                <div style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</div>
              )}
              {showNotifs && (
                <div style={styles.dropdown}>
                  <div style={styles.dropdownHeader}>
                    <span>Notifications</span>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#555', fontSize: '13px' }}>
                      Aucune notification.
                    </div>
                  ) : notifications.map(n => (
                    <div key={n.id} style={{ ...styles.notifItem, ...(n.read ? {} : styles.notifUnread) }}>
                      <div>{n.message}</div>
                      <div style={styles.notifTime}>{timeAgo(n.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={toggle} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%',
                background: 'linear-gradient(90deg, #f1f1f1 50%, #111 50%)',
                border: '1px solid #555'
              }} />
            </button>

            <Link to="/me">
              <div style={styles.avatar}>
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  : user.username?.[0]?.toUpperCase() || 'U'}
              </div>
            </Link>
            <button style={{ ...styles.btn, background: '#333' }} onClick={() => { logout(); navigate('/login') }}>
              Deconnexion
            </button>
          </>
        ) : (
          <>
            <Link to="/search" style={styles.link}>Films</Link>
            <Link to="/login"><button style={styles.btn}>Connexion</button></Link>
            <Link to="/register"><button style={{ ...styles.btn, background: '#333' }}>Inscription</button></Link>
          </>
        )}
      </div>
    </nav>
  )
}