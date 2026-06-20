import { useState, useEffect } from 'react'

export default function History() {
  const [history, setHistory] = useState([])

  useEffect(() => {
    const h = JSON.parse(localStorage.getItem('fnHistory') || '[]')
    setHistory(h)
  }, [])

  const clear = () => {
    localStorage.removeItem('fnHistory')
    setHistory([])
  }

  const labelColor = (label) => label === 'REAL' ? '#22c55e' : label === 'FAKE' ? '#ef4444' : '#f59e0b'
  const labelIcon = (label) => label === 'REAL' ? '✅' : label === 'FAKE' ? '❌' : '⚠️'

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1.8rem', marginBottom: '0.3rem' }}>Check History</h2>
          <p style={{ color: '#94a3b8' }}>Your recent fake news checks</p>
        </div>
        {history.length > 0 && (
          <button onClick={clear} style={{ background: '#450a0a', color: '#ef4444', border: '1px solid #ef4444', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 && (
        <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '4rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <div>No checks yet. Go detect some news!</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {history.map((item, i) => (
          <div key={i} style={{ background: '#1e293b', borderRadius: '12px', padding: '1.2rem 1.5rem', borderLeft: `4px solid ${labelColor(item.label)}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700, color: labelColor(item.label) }}>{labelIcon(item.label)} {item.label}</span>
              <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{item.date}</span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{item.input?.slice(0, 150)}{item.input?.length > 150 ? '...' : ''}</div>
            <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.3rem' }}>Confidence: {item.confidence}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}