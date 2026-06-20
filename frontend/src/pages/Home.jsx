import { useNavigate } from 'react-router-dom'
import { Search, Newspaper, BookOpen, Shield, Zap, Globe } from 'lucide-react'
import logo from '../bowenlogo.png'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '90vh' }}>
      {/* Hero */}
      <div style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.12) 0%, transparent 60%)',
        padding: '5rem 1.5rem 4rem', textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <img src={logo} alt="Bowen" style={{ height: '48px' }} />
          <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Bowen University</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#22c55e' }}>NaijaFactCheck</div>
          </div>
        </div>

        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, lineHeight: 1.15, marginBottom: '1.2rem', maxWidth: '700px', margin: '0 auto 1.2rem' }}>
          Nigeria's Most Trusted<br />
          <span style={{ color: '#22c55e' }}>AI Fact-Checker</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '520px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          Powered by AI and trained on Nigerian news data. Verify any news claim in seconds with deep web analysis.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/detect')} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '0.85rem 1.8rem', background: '#22c55e',
            color: '#070d1a', border: 'none', borderRadius: '12px',
            fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer'
          }}>
            <Search size={18} /> Check a News Story
          </button>
          <button onClick={() => navigate('/feed')} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '0.85rem 1.8rem', background: 'transparent',
            color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer'
          }}>
            <Newspaper size={18} /> Browse News Feed
          </button>
        </div>
      </div>

      {/* Feature cards */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {[
            { icon: Zap, color: '#f59e0b', title: 'Deep Verify', desc: 'AI searches the web in real-time and gives a full fact-check report with sources', action: () => navigate('/detect') },
            { icon: Globe, color: '#3b82f6', title: 'Live News Feed', desc: 'Browse latest Nigerian headlines and instantly check any story for credibility', action: () => navigate('/feed') },
            { icon: BookOpen, color: '#8b5cf6', title: 'Inside Bowen', desc: 'Official announcements and updates from Bowen University authorities', action: () => navigate('/inside-bowen') },
            { icon: Shield, color: '#22c55e', title: 'Nigeria-Trained AI', desc: 'Our model is trained specifically on Nigerian news data and misinformation patterns', action: null },
          ].map(({ icon: Icon, color, title, desc, action }) => (
            <div key={title} onClick={action} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px', padding: '1.5rem', cursor: action ? 'pointer' : 'default',
              transition: 'all 0.2s'
            }}
              onMouseEnter={e => { if (action) { e.currentTarget.style.borderColor = color + '50'; e.currentTarget.style.background = `${color}08` } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Icon size={20} color={color} />
              </div>
              <div style={{ fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.95rem' }}>{title}</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}