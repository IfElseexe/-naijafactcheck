import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const API = 'http://127.0.0.1:8000'

export default function Feed() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    axios.get(`${API}/news/feed`).then(res => {
      setArticles(res.data.articles)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const checkArticle = (title) => {
    sessionStorage.setItem('detectText', title)
    navigate('/detect')
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ fontWeight: 700, fontSize: '1.8rem', marginBottom: '0.5rem' }}>Nigerian News Feed</h2>
      <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Latest headlines. Click any story to read it or hit "Check This" to verify instantly.</p>

      {loading && (
        <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: '3rem', fontSize: '1.1rem' }}>
          Loading news feed...
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        {articles.map((article, i) => (
          <div key={i} style={{
            background: '#1e293b',
            borderRadius: '14px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s',
            cursor: 'pointer',
            border: '1px solid #334155',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {/* Image */}
            <div style={{ width: '100%', height: '180px', overflow: 'hidden', background: '#0f172a', position: 'relative' }}>
              {article.urlToImage ? (
                <img
                  src={article.urlToImage}
                  alt={article.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => {
                    e.target.style.display = 'none'
                    e.target.parentNode.style.background = '#1e3a5f'
                    e.target.parentNode.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:2.5rem;">📰</div>'
                  }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '2.5rem', background: '#1e3a5f' }}>
                  📰
                </div>
              )}
              {/* Source badge */}
              <div style={{
                position: 'absolute', top: '10px', left: '10px',
                background: 'rgba(0,0,0,0.7)', color: '#22c55e',
                padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600
              }}>
                {article.source}
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {article.publishedAt?.slice(0, 10)}
              </div>
              <div
                style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.4, color: '#f1f5f9' }}
                onClick={() => article.url && window.open(article.url, '_blank')}
              >
                {article.title}
              </div>
              {article.description && (
                <div style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5 }}>
                  {article.description?.slice(0, 100)}...
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.8rem' }}>
                {article.url && (
                  <button
                    onClick={() => window.open(article.url, '_blank')}
                    style={{
                      flex: 1, padding: '0.5rem', background: 'transparent',
                      border: '1px solid #334155', borderRadius: '6px',
                      color: '#94a3b8', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600
                    }}>
                    Read Full Story
                  </button>
                )}
                <button
                  onClick={() => checkArticle(article.title)}
                  style={{
                    flex: 1, padding: '0.5rem', background: '#22c55e',
                    border: 'none', borderRadius: '6px',
                    color: '#0f172a', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700
                  }}>
                  ✓ Check This
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}