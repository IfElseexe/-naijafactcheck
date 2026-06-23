import { useState, useEffect } from 'react'
import axios from 'axios'
import { Search, Link, Zap, CheckCircle, XCircle, AlertTriangle, ExternalLink, Loader } from 'lucide-react'
import { useLanguage } from '../lib/LanguageContext'

import { API } from '../config'

export default function Detector() {
  const [mode, setMode] = useState('text')
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [deepResult, setDeepResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deepLoading, setDeepLoading] = useState(false)
  const [error, setError] = useState('')
  const { t, lang } = useLanguage()

  useEffect(() => {
  const saved = sessionStorage.getItem('detectText')
  if (saved) {
    sessionStorage.removeItem('detectText')
    setTimeout(() => setInput(saved), 0)
  }
}, [])

  const handleQuickCheck = async () => {
    if (!input.trim()) return
    setLoading(true); setResult(null); setDeepResult(null); setError('')
    try {
      const endpoint = mode === 'text' ? '/classify/text' : '/classify/url'
      const payload = mode === 'text' ? { text: input } : { url: input }
      const res = await axios.post(`${API}${endpoint}`, payload)
      setResult(res.data)
      const history = JSON.parse(localStorage.getItem('fnHistory') || '[]')
      history.unshift({ ...res.data, input, mode, date: new Date().toLocaleString() })
      localStorage.setItem('fnHistory', JSON.stringify(history.slice(0, 50)))
    } catch (e) { setError(e.response?.data?.detail || 'Something went wrong.') }
    setLoading(false)
  }

  const handleDeepVerify = async () => {
    if (!input.trim()) return
    setDeepLoading(true); setDeepResult(null); setResult(null); setError('')
    try {
      const res = await axios.post(`${API}/classify/verify`, { text: input, language: lang })
      setDeepResult(res.data)
      const history = JSON.parse(localStorage.getItem('fnHistory') || '[]')
      history.unshift({ label: res.data.verdict, confidence: null, input, mode: 'deep', date: new Date().toLocaleString() })
      localStorage.setItem('fnHistory', JSON.stringify(history.slice(0, 50)))
    } catch { setError('Deep verification failed. Try again.') }
    setDeepLoading(false)
  }

  const verdictColor = (v) => v === 'REAL' ? '#22c55e' : v === 'FAKE' ? '#ef4444' : '#f59e0b'
  const verdictBg = (v) => v === 'REAL' ? 'rgba(34,197,94,0.08)' : v === 'FAKE' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)'
  const VerdictIcon = (v) => v === 'REAL' ? CheckCircle : v === 'FAKE' ? XCircle : AlertTriangle

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

      {/* Page header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
          <div style={{ width: '36px', height: '36px', background: 'rgba(34,197,94,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Search size={18} color="#22c55e" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{t('factChecker')}</h1>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.9rem', paddingLeft: '46px' }}>
          {t('factCheckerDesc')}
        </p>
      </div>

      {/* Input card */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px', padding: '1.5rem', marginBottom: '1rem'
      }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', background: '#070d1a', borderRadius: '10px', padding: '4px', marginBottom: '1.2rem', width: 'fit-content' }}>
          {[
            { key: 'text', label: 'Text', icon: Search },
            { key: 'url', label: 'URL', icon: Link },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setMode(key); setInput(''); setResult(null); setDeepResult(null) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '0.5rem 1.2rem', borderRadius: '7px', border: 'none',
                background: mode === key ? '#22c55e' : 'transparent',
                color: mode === key ? '#070d1a' : '#64748b',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
              }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Input */}
        {mode === 'text' ? (
          <textarea value={input} onChange={e => setInput(e.target.value)}
            placeholder={t('textPlaceholder')}
            rows={5}
            style={{
              width: '100%', padding: '1rem', background: '#070d1a',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px',
              color: '#f1f5f9', fontSize: '0.95rem', resize: 'vertical', outline: 'none',
              lineHeight: 1.6, transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(34,197,94,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
          />
        ) : (
          <div style={{ position: 'relative' }}>
            <Link size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input value={input} onChange={e => setInput(e.target.value)}
              placeholder={t('urlPlaceholder')}
              style={{
                width: '100%', padding: '0.9rem 1rem 0.9rem 2.8rem',
                background: '#070d1a', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px', color: '#f1f5f9', fontSize: '0.95rem', outline: 'none'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(34,197,94,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
            />
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button onClick={handleDeepVerify} disabled={deepLoading || !input.trim()}
            style={{
              flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '0.85rem', background: deepLoading || !input.trim() ? 'rgba(59,130,246,0.3)' : '#3b82f6',
              color: '#fff', border: 'none', borderRadius: '12px',
              fontWeight: 700, fontSize: '0.95rem', cursor: deepLoading || !input.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}>
            {deepLoading ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> {t('searchingWeb')}</> : <><Search size={16} /> {t('deepVerify')}</>}
          </button>
          <button onClick={handleQuickCheck} disabled={loading || !input.trim()}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '0.85rem', background: 'transparent',
              color: input.trim() ? '#22c55e' : '#64748b',
              border: `1px solid ${input.trim() ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: '12px', fontWeight: 600, fontSize: '0.9rem',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
            }}>
            {loading ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={15} />}
            {loading ? 'Checking...' : t('quickCheck')}
          </button>
        </div>
      </div>

      {/* Deep loading state */}
      {deepLoading && (
        <div style={{
          background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: '14px', padding: '1.5rem', textAlign: 'center', marginBottom: '1rem'
        }}>
          <div style={{ color: '#3b82f6', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.95rem' }}>
  {t('searchingWeb')}
</div>
<div style={{ color: '#64748b', fontSize: '0.85rem' }}>
  {t('analysingSource')}
</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '12px', padding: '1rem', color: '#ef4444', fontSize: '0.9rem', marginBottom: '1rem'
        }}>
          <XCircle size={18} /> {error}
        </div>
      )}

      {/* Deep Verify Result */}
      {deepResult && (() => {
        const color = verdictColor(deepResult.verdict)
        const bg = verdictBg(deepResult.verdict)
        const Icon = VerdictIcon(deepResult.verdict)
        return (
          <div style={{ background: bg, border: `1px solid ${color}30`, borderRadius: '16px', overflow: 'hidden', marginBottom: '1rem' }}>
            {/* Verdict header */}
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: `1px solid ${color}20`, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={22} color={color} />
              </div>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color }}>{deepResult.verdict}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '1px' }}>
  Deep Verified · {deepResult.sources?.length > 0 ? `${deepResult.sources.length} web source${deepResult.sources.length > 1 ? 's' : ''} analysed` : 'No web sources found'}
</div>
              </div>
            </div>

            {/* Explanation */}
<div style={{ padding: '1.2rem 1.5rem' }}>
  <div style={{ color: '#cbd5e1', lineHeight: 1.9, fontSize: '0.92rem', whiteSpace: 'pre-wrap' }}>
    {deepResult.explanation.split('\n').map((line, i) => {
      if (line.startsWith('SUMMARY:')) {
        return <div key={i} style={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9', marginBottom: '0.8rem' }}>{line.replace('SUMMARY:', '').trim()}</div>
      }
      if (line.startsWith('KEY DETAILS:')) {
        return <div key={i} style={{ fontWeight: 700, fontSize: '0.78rem', color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '1rem', marginBottom: '0.4rem' }}>Key Details</div>
      }
      if (line.startsWith('WHY:')) {
        return <div key={i} style={{ fontWeight: 700, fontSize: '0.78rem', color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '1rem', marginBottom: '0.4rem' }}>Why</div>
      }
      if (line.trim().startsWith('-')) {
        return <div key={i} style={{ paddingLeft: '0.5rem', marginBottom: '0.2rem' }}>{line}</div>
      }
      return line.trim() ? <div key={i}>{line}</div> : null
    })}
  </div>
</div>

            {/* Sources */}
            {deepResult.sources?.length > 0 && (
              <div style={{ padding: '0 1.5rem 1.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                  {t('sourcesConsulted')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {deepResult.sources.filter(s => s.url).map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '0.6rem 0.9rem', background: 'rgba(0,0,0,0.2)',
                        borderRadius: '8px', color: '#94a3b8', fontSize: '0.82rem',
                        textDecoration: 'none', transition: 'color 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#f1f5f9'}
                      onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                    >
                      <ExternalLink size={13} style={{ flexShrink: 0 }} />
                      {s.title?.slice(0, 90)}{s.title?.length > 90 ? '...' : ''}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* Quick Check Result */}
      {result && (() => {
        const color = verdictColor(result.label)
        const bg = verdictBg(result.label)
        const Icon = VerdictIcon(result.label)
        return (
          <div style={{ background: bg, border: `1px solid ${color}30`, borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: `1px solid ${color}20`, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={22} color={color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color }}>{result.label}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Quick Check · Confidence: {result.confidence}%</div>
              </div>
            </div>
            <div style={{ padding: '1rem 1.5rem' }}>
              <div style={{ height: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '999px', marginBottom: '1rem', overflow: 'hidden' }}>
                <div style={{ width: `${result.confidence}%`, height: '100%', background: color, borderRadius: '999px', transition: 'width 0.8s ease' }} />
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{t('whyVerdict')}</div>
              <ul style={{ paddingLeft: '1rem', color: '#94a3b8' }}>
                {result.reasons.map((r, i) => <li key={i} style={{ fontSize: '0.88rem', lineHeight: 1.7 }}>{r}</li>)}
              </ul>
            </div>
          </div>
        )
      })()}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}