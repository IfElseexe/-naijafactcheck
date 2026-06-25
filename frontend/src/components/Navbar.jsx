import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { Shield, Newspaper, Search, History, BookOpen, LogOut, LogIn, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '../lib/LanguageContext'
import { languages } from '../lib/translations'
import { Globe } from 'lucide-react'


export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const { lang, changeLang, t } = useLanguage()
  const [langOpen, setLangOpen] = useState(false)

 const links = [
  { path: '/', label: t('home'), icon: Shield },
  { path: '/detect', label: t('detect'), icon: Search },
  { path: '/feed', label: t('newsFeed'), icon: Newspaper },
  { path: '/inside-bowen', label: t('insideBowen'), icon: BookOpen },
  { path: '/history', label: t('history'), icon: History },
]

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setMenuOpen(false)
  }

  const active = (path) => location.pathname === path

  return (
    <nav style={{
      background: 'rgba(7,13,26,0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '0 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '64px',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '36px', height: '36px', background: 'rgba(34,197,94,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
  <Shield size={20} color="#22c55e" />
</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f1f5f9', lineHeight: 1.1 }}>NaijaFactCheck</div>
<div style={{ fontSize: '0.65rem', color: '#22c55e', fontWeight: 500 }}>AI Fact-Checking Companion</div>
        </div>
      </Link>

      {/* Desktop Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }} className="desktop-nav">
        {links.map(({ path, label, icon: Icon }) => (
          <Link key={path} to={path} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '0.45rem 0.85rem', borderRadius: '8px',
            color: active(path) ? '#22c55e' : '#94a3b8',
            background: active(path) ? 'rgba(34,197,94,0.1)' : 'transparent',
            fontSize: '0.85rem', fontWeight: active(path) ? 600 : 400,
            transition: 'all 0.2s',
          }}>
            <Icon size={15} />
            {label}
          </Link>
        ))}
      </div>

      {/* Auth */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        {/* Language Switcher */}
<div style={{ position: 'relative' }}>
  <button onClick={() => setLangOpen(!langOpen)} style={{
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '0.45rem 0.7rem', borderRadius: '8px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    color: '#94a3b8', cursor: 'pointer', fontSize: '0.82rem'
  }}>
    <Globe size={14} />
    {languages.find(l => l.code === lang)?.flag}
  </button>
  {langOpen && (
    <div style={{
      position: 'absolute', top: '110%', right: 0,
      background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '10px', padding: '6px', minWidth: '140px',
      zIndex: 1001, boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
    }}>
      {languages.map(l => (
        <button key={l.code} onClick={() => { changeLang(l.code); setLangOpen(false) }} style={{
          display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
          padding: '0.5rem 0.7rem', borderRadius: '6px', border: 'none',
          background: lang === l.code ? 'rgba(34,197,94,0.1)' : 'transparent',
          color: lang === l.code ? '#22c55e' : '#94a3b8',
          cursor: 'pointer', fontSize: '0.85rem', textAlign: 'left'
        }}>
          {l.flag} {l.label}
        </button>
      ))}
    </div>
  )}
</div>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ textAlign: 'right', display: 'none' }} className="user-info">
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f1f5f9' }}>{profile?.full_name}</div>
              <div style={{ fontSize: '0.7rem', color: profile?.role === 'authority' ? '#f59e0b' : '#22c55e', textTransform: 'capitalize' }}>{profile?.role}</div>
            </div>
            <button onClick={handleSignOut} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '0.45rem 0.85rem', borderRadius: '8px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#ef4444', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500
            }}>
              <LogOut size={14} /> {t('signOut')}
            </button>
          </div>
        ) : (
          <Link to="/auth" style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '0.45rem 1rem', borderRadius: '8px',
            background: '#22c55e', color: '#070d1a',
            fontSize: '0.85rem', fontWeight: 600
          }}>
            <LogIn size={14} /> {t('signIn')}
          </Link>
        )}

        {/* Mobile menu toggle */}
        <button onClick={() => setMenuOpen(!menuOpen)} style={{
          background: 'none', border: 'none', color: '#94a3b8',
          cursor: 'pointer', display: 'none', padding: '4px'
        }} className="mobile-menu-btn">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: '64px', left: 0, right: 0,
          background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
          zIndex: 999
        }}>
          {links.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} onClick={() => setMenuOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '0.75rem 1rem', borderRadius: '10px',
              color: active(path) ? '#22c55e' : '#94a3b8',
              background: active(path) ? 'rgba(34,197,94,0.1)' : 'transparent',
              fontSize: '0.95rem', fontWeight: active(path) ? 600 : 400,
            }}>
              <Icon size={18} /> {label}
            </Link>
          ))}
          {user && (
            <button onClick={handleSignOut} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '0.75rem 1rem', borderRadius: '10px',
              background: 'rgba(239,68,68,0.1)', border: 'none',
              color: '#ef4444', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500
            }}>
              <LogOut size={18} /> Sign Out
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .user-info { display: block !important; }
        }
      `}</style>
    </nav>
  )
}