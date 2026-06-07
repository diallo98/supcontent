import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import ReactMarkdown from 'react-markdown'

const POSTER = 'https://image.tmdb.org/t/p/w500'
const BACKDROP = 'https://image.tmdb.org/t/p/w1280'

function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={() => !readonly && onChange && onChange(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            fontSize: readonly ? '16px' : '24px',
            cursor: readonly ? 'default' : 'pointer',
            color: n <= (hovered || value) ? '#f5c518' : '#444',
            transition: 'color 0.15s',
            userSelect: 'none',
          }}
        >★</span>
      ))}
    </div>
  )
}

export default function MoviePage() {
  const { id } = useParams()
  const { user: me } = useAuth()
  const navigate = useNavigate()
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)

  // Rating
  const [myRating, setMyRating] = useState(0)
  const [ratingStats, setRatingStats] = useState({ average: null, count: 0 })
  const [ratingMsg, setRatingMsg] = useState('')

  // Reviews
  const [reviews, setReviews] = useState([])
  const [reviewText, setReviewText] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewMsg, setReviewMsg] = useState('')

  // Lists
  const [lists, setLists] = useState([])
  const [showListMenu, setShowListMenu] = useState(false)
  const [listMsg, setListMsg] = useState('')

  // Statut de visionnage
  const [watchStatus, setWatchStatus] = useState(null)

  // Commentaires (stockés par reviewId)
  const [comments, setComments] = useState({})
  const [commentText, setCommentText] = useState({})

  // Ajout du state des likes
  const [likes, setLikes] = useState({})

  // Ajout du state pour le signalement inséré ici :
  const [reportMsg, setReportMsg] = useState({})

  useEffect(() => {
    setLoading(true)
    api.get(`/movies/${id}`)
      .then(r => setMovie(r.data))
      .finally(() => setLoading(false))

    api.get(`/ratings/movie/${id}`)
      .then(r => setRatingStats(r.data))
      .catch(() => {})

    // Mise à jour du chargement des reviews pour inclure les likes
    api.get(`/reviews/movie/${id}`)
      .then(r => {
        setReviews(r.data)
        r.data.forEach(review => loadLikes(review.id))
      })
      .catch(() => {})

    if (me) {
      api.get('/lists/me')
        .then(r => setLists(r.data))
        .catch(() => {})

      api.get(`/watchstatus/movie/${id}`)
        .then(r => setWatchStatus(r.data.status))
        .catch(() => {})
    }
  }, [id, me])

  // Ajout des fonctions de gestion des likes
  async function loadLikes(reviewId) {
    try {
      const r = await api.get(`/likes/${reviewId}`)
      setLikes(prev => ({ ...prev, [reviewId]: r.data }))
    } catch {}
  }

  async function handleToggleLike(reviewId) {
    try {
      const r = await api.post(`/likes/${reviewId}`)
      setLikes(prev => ({
        ...prev,
        [reviewId]: {
          liked: r.data.liked,
          count: r.data.liked
            ? (prev[reviewId]?.count || 0) + 1
            : Math.max(0, (prev[reviewId]?.count || 1) - 1)
        }
      }))
    } catch {}
  }

  async function loadComments(reviewId) {
    try {
      const r = await api.get(`/comments/${reviewId}`)
      setComments(prev => ({ ...prev, [reviewId]: r.data }))
    } catch {}
  }

  async function handleSubmitComment(reviewId) {
    const text = commentText[reviewId]?.trim()
    if (!text) return
    try {
      const r = await api.post(`/comments/${reviewId}`, { content: text })
      setComments(prev => ({ ...prev, [reviewId]: [...(prev[reviewId] || []), r.data] }))
      setCommentText(prev => ({ ...prev, [reviewId]: '' }))
    } catch {}
  }

  async function handleDeleteComment(reviewId, commentId) {
    try {
      await api.delete(`/comments/${commentId}`)
      setComments(prev => ({ ...prev, [reviewId]: prev[reviewId].filter(c => c.id !== commentId) }))
    } catch {}
  }

  // Fonction handleReport insérée après handleDeleteComment :
  async function handleReport(reviewId) {
    const reason = prompt('Raison du signalement (spoiler, insulte, etc.) :')
    if (!reason?.trim()) return
    try {
      await api.post(`/moderation/reports/review/${reviewId}`, { reason })
      setReportMsg(prev => ({ ...prev, [reviewId]: 'Signalement envoyé.' }))
      setTimeout(() => setReportMsg(prev => ({ ...prev, [reviewId]: '' })), 3000)
    } catch (err) {
      const msg = err?.response?.data?.error || 'Erreur.'
      setReportMsg(prev => ({ ...prev, [reviewId]: msg }))
      setTimeout(() => setReportMsg(prev => ({ ...prev, [reviewId]: '' })), 3000)
    }
  }

  async function handleWatchStatus(status) {
    try {
      await api.post('/watchstatus', { 
        mediaId: parseInt(id), 
        status,
        runtime: movie?.runtime || 0,
        title: movie?.title,
        posterPath: movie?.poster_path,
      })
      setWatchStatus(status)
    } catch {}
  }

  async function handleRate(value) {
    setMyRating(value)
    try {
      await api.post('/ratings', { mediaId: parseInt(id), score: value * 2 })
      const r = await api.get(`/ratings/movie/${id}`)
      setRatingStats(r.data)
      setRatingMsg('Note enregistrée !')
      setTimeout(() => setRatingMsg(''), 2000)
    } catch {
      setRatingMsg('Erreur lors de la notation.')
    }
  }

  async function handleSubmitReview() {
    if (!reviewText.trim()) return
    setSubmittingReview(true)
    try {
      await api.post('/reviews', { mediaId: parseInt(id), content: reviewText })
      const r = await api.get(`/reviews/movie/${id}`)
      setReviews(r.data)
      setReviewText('')
      setReviewMsg('Critique publiée !')
      setTimeout(() => setReviewMsg(''), 2000)
    } catch (err) {
      const msg = err?.response?.data?.error || 'Erreur lors de la publication.'
      setReviewMsg(msg)
      setTimeout(() => setReviewMsg(''), 3000)
    } finally {
      setSubmittingReview(false)
    }
  }

  async function handleDeleteReview(reviewId) {
    try {
      await api.delete(`/reviews/${reviewId}`)
      setReviews(prev => prev.filter(r => r.id !== reviewId))
    } catch {}
  }

  async function handleAddToList(listId) {
    try {
      await api.post(`/lists/${listId}/movies`, { mediaId: parseInt(id) })
      setListMsg('Ajouté à la liste !')
      setShowListMenu(false)
      setTimeout(() => setListMsg(''), 2000)
    } catch {
      setListMsg('Déjà dans cette liste.')
      setTimeout(() => setListMsg(''), 2000)
    }
  }

  if (loading) return <div style={{ padding: '80px', textAlign: 'center', color: '#888' }}>Chargement…</div>
  if (!movie) return <div style={{ padding: '80px', textAlign: 'center', color: '#888' }}>Film non trouvé.</div>

  const genres = movie.genres?.map(g => g.name).join(', ')
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h${movie.runtime % 60}min` : null

  const director = movie.credits?.crew?.find(p => p.job === 'Director')?.name
  const casting = movie.credits?.cast?.slice(0, 5).map(a => a.name).join(', ')

  return (
    <div style={{ background: '#0f0f0f', minHeight: '100vh', color: '#fff' }}>
      {movie.backdrop_path && (
        <div style={{
          height: '380px',
          backgroundImage: `url(${BACKDROP}${movie.backdrop_path})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(15,15,15,0.1) 0%, #0f0f0f 100%)' }} />
        </div>
      )}

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px 80px', marginTop: movie.backdrop_path ? '-140px' : '32px', position: 'relative' }}>

        {/* Header */}
        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '40px' }}>
          {movie.poster_path && (
            <img src={`${POSTER}${movie.poster_path}`} alt={movie.title}
              style={{ width: '180px', borderRadius: '10px', boxShadow: '0 12px 40px rgba(0,0,0,0.8)', flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: '240px', paddingBottom: '8px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '10px', lineHeight: 1.2 }}>{movie.title}</h1>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '14px', color: '#888', fontSize: '14px' }}>
              {movie.release_date && <span>{movie.release_date.slice(0, 4)}</span>}
              {runtime && <span>{runtime}</span>}
              {movie.vote_average > 0 && <span style={{ color: '#f5c518' }}>★ {movie.vote_average.toFixed(1)} / 10</span>}
              {genres && <span>{genres}</span>}
            </div>

            {director && <div style={{ color: '#ccc', fontSize: '14px', marginTop: '8px' }}><strong>Réalisateur :</strong> {director}</div>}
            {casting && <div style={{ color: '#ccc', fontSize: '14px', marginTop: '4px' }}><strong>Casting :</strong> {casting}</div>}

            <div style={{ marginTop: '14px' }}>
              {movie.tagline && (
                <p style={{ color: '#e50914', fontStyle: 'italic', fontSize: '15px', marginBottom: '14px', marginTop: 0 }}>« {movie.tagline} »</p>
              )}
              {movie.overview && (
                <p style={{ color: '#ccc', lineHeight: 1.7, fontSize: '15px', maxWidth: '600px', margin: 0 }}>{movie.overview}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions — connecté ou pas */}
        {me ? (
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '40px', padding: '24px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #2e2e2e' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ma note</div>
              <StarRating value={myRating} onChange={handleRate} />
              {ratingMsg && <div style={{ fontSize: '12px', color: '#4caf50', marginTop: '4px' }}>{ratingMsg}</div>}
            </div>

            <div style={{ width: '1px', height: '40px', background: '#2e2e2e' }} />

            <div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Note communauté</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px', fontWeight: 700, color: '#f5c518' }}>
                  {ratingStats.average ? parseFloat(ratingStats.average).toFixed(1) : '—'}
                </span>
                <span style={{ fontSize: '13px', color: '#666' }}>{ratingStats.count} vote{ratingStats.count !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Section Bibliothèque */}
            <div style={{ width: '1px', height: '40px', background: '#2e2e2e' }} />
            <div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ma bibliothèque</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { key: 'a_voir', label: 'À voir' },
                  { key: 'en_cours', label: 'En cours' },
                  { key: 'termine', label: 'Terminé' },
                  { key: 'abandonne', label: 'Abandonné' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleWatchStatus(key)}
                    style={{
                      background: watchStatus === key ? '#e50914' : '#2a2a2a',
                      color: watchStatus === key ? '#fff' : '#aaa',
                      border: `1px solid ${watchStatus === key ? '#e50914' : '#444'}`,
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ width: '1px', height: '40px', background: '#2e2e2e' }} />

            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowListMenu(v => !v)}
                style={{ background: '#e50914', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                + Ajouter à une liste
              </button>
              {listMsg && <div style={{ fontSize: '12px', color: '#4caf50', marginTop: '4px' }}>{listMsg}</div>}
              {showListMenu && (
                <div style={{ position: 'absolute', top: '44px', left: 0, background: '#1e1e1e', border: '1px solid #333', borderRadius: '8px', minWidth: '200px', zIndex: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                  {lists.length === 0 ? (
                    <div style={{ padding: '14px 16px', color: '#888', fontSize: '13px' }}>Aucune liste. Crée-en une d'abord.</div>
                  ) : lists.map(list => (
                    <div key={list.id} onClick={() => handleAddToList(list.id)}
                      style={{ padding: '12px 16px', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #2a2a2a' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#2a2a2a'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      {list.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: '12px', padding: '20px', marginBottom: '40px', textAlign: 'center' }}>
            <span style={{ color: '#888', fontSize: '14px' }}>
              <span onClick={() => navigate('/login')} style={{ color: '#e50914', cursor: 'pointer', fontWeight: 600 }}>Connecte-toi</span>
              {' '}pour noter, critiquer et ajouter ce film à tes listes.
            </span>
          </div>
        )}

        {/* Écrire une critique — connecté seulement */}
        {me && (
          <div style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Écrire une critique</h3>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Partagez votre avis sur ce film…"
              rows={4}
              style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff', padding: '12px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            <div style={{ fontSize: '12px', color: '#555', marginTop: '6px' }}>
              Markdown supporté — **gras**, *italique*, # titre
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
              <button onClick={handleSubmitReview} disabled={submittingReview || !reviewText.trim()}
                style={{ background: '#e50914', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: reviewText.trim() ? 'pointer' : 'not-allowed', opacity: reviewText.trim() ? 1 : 0.5 }}>
                {submittingReview ? 'Publication…' : 'Publier'}
              </button>
              {reviewMsg && <span style={{ fontSize: '13px', color: reviewMsg.includes('Erreur') || reviewMsg.includes('déjà') ? '#e50914' : '#4caf50' }}>{reviewMsg}</span>}
            </div>
          </div>
        )}

        {/* Liste des critiques — visible par tous */}
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
            Critiques {reviews.length > 0 && <span style={{ color: '#666', fontWeight: 400, fontSize: '15px' }}>({reviews.length})</span>}
          </h3>
          {reviews.length === 0 ? (
            <div style={{ color: '#555', fontStyle: 'italic', fontSize: '14px' }}>Aucune critique pour ce film. Sois le premier !</div>
          ) : reviews.map(review => (
            <div key={review.id} style={{ background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e50914', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                    {review.user?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{review.user?.username || 'Utilisateur'}</div>
                    <div style={{ fontSize: '12px', color: '#555' }}>{new Date(review.createdAt).toLocaleDateString('fr-FR')}</div>
                  </div>
                </div>

                {/* Remplacement du bouton supprimer d'origine par le bloc de boutons conditionnels : */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {review.featured && (
                    <span style={{ background: '#e50914', color: '#fff', borderRadius: '6px', padding: '3px 10px', fontSize: '12px', fontWeight: 700 }}>
                      Coup de coeur
                    </span>
                  )}
                  {me && review.user?.id === me.id && (
                    <button onClick={() => handleDeleteReview(review.id)}
                      style={{ background: 'transparent', border: '1px solid #444', color: '#888', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>
                      Supprimer
                    </button>
                  )}
                  {me && review.user?.id !== me.id && (
                    <button onClick={() => handleReport(review.id)}
                      style={{ background: 'transparent', border: '1px solid #444', color: '#888', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>
                      Signaler
                    </button>
                  )}
                  {reportMsg[review.id] && (
                    <span style={{ fontSize: '12px', color: '#4caf50' }}>{reportMsg[review.id]}</span>
                  )}
                </div>
              </div>
              
              <div className="markdown-content">
                <ReactMarkdown>{review.content}</ReactMarkdown>
              </div>

              {/* Bloc de boutons Like */}
              {me && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => handleToggleLike(review.id)}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${likes[review.id]?.liked ? '#e50914' : '#444'}`,
                      color: likes[review.id]?.liked ? '#e50914' : '#888',
                      borderRadius: '6px',
                      padding: '4px 12px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontWeight: likes[review.id]?.liked ? 700 : 400
                    }}
                  >
                    J'aime {likes[review.id]?.count > 0 && `(${likes[review.id].count})`}
                  </button>
                </div>
              )}

              {/* Discussions */}
              <div style={{ marginTop: '16px', borderTop: '1px solid #2a2a2a', paddingTop: '12px' }}>
                <div
                  onClick={() => loadComments(review.id)}
                  style={{ fontSize: '13px', color: '#666', cursor: 'pointer', marginBottom: '10px' }}
                >
                  {comments[review.id] ? `${comments[review.id].length} commentaire(s)` : 'Voir les commentaires'}
                </div>
                {comments[review.id] && (
                  <>
                    {comments[review.id].map(c => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', padding: '8px 12px', background: '#111', borderRadius: '6px' }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '13px', color: '#ccc' }}>{c.user.username} </span>
                          <span style={{ fontSize: '13px', color: '#888' }}>{c.content}</span>
                        </div>
                        {me && c.user.id === me.id && (
                          <button onClick={() => handleDeleteComment(review.id, c.id)}
                            style={{ background: 'transparent', border: 'none', color: '#555', fontSize: '12px', cursor: 'pointer' }}>
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    {me && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <input
                          value={commentText[review.id] || ''}
                          onChange={e => setCommentText(prev => ({ ...prev, [review.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && handleSubmitComment(review.id)}
                          placeholder="Ajouter un commentaire…"
                          style={{ flex: 1, background: '#111', border: '1px solid #333', borderRadius: '6px', color: '#fff', padding: '8px 12px', fontSize: '13px', fontFamily: 'inherit' }}
                        />
                        <button onClick={() => handleSubmitComment(review.id)}
                          style={{ background: '#e50914', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                          Envoyer
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  )
}