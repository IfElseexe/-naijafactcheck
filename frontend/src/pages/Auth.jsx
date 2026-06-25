import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', fullName: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(form.email, form.password)
        toast.success('Welcome back!')
        navigate('/')
      } else {
        if (!form.fullName.trim()) throw new Error('Please enter your full name')
        if (form.password.length < 6) throw new Error('Password must be at least 6 characters')
        await signUp(form.email, form.password, form.fullName, 'student', '')
        toast.success('Account created! You can now sign in.')
        setMode('login')
      }
    } catch (e) {
      toast.error(e.message)
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '1.5rem',
      background: 'radial-gradient(ellipse at top, #0d2137 0%, #070d1a 60%)'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px', height: '56px', background: 'rgba(34,197,94,0.15)',
            borderRadius: '16px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 1rem'
          }}>
            <Shield size={28} color="#22c55e" />
          </div>
          <div style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            AI Fact-Checking Companion
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9' }}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            {mode === 'login' ? 'Sign in to NaijaFactCheck' : 'Create your free account'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '2rem'
        }}>
          {/* Mode tabs */}
          <div style={{ display: 'flex', background: '#0f172a', borderRadius: '10px', padding: '4px', marginBottom: '1.5rem' }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }} style={{
                flex: 1, padding: '0.55rem', borderRadius: '7px', border: 'none',
                background: mode === m ? '#22c55e' : 'transparent',
                color: mode === m ? '#070d1a' : '#64748b',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
              }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mode === 'signup' && (
              <Field icon={<User size={16} />} placeholder="Full Name" value={form.fullName} onChange={v => update('fullName', v)} />
            )}
            <Field icon={<Mail size={16} />} placeholder="Email address" type="email" value={form.email} onChange={v => update('email', v)} />
            <div style={{ position: 'relative' }}>
              <Field icon={<Lock size={16} />} placeholder="Password" type={showPass ? 'text' : 'password'} value={form.password} onChange={v => update('password', v)} />
              <button onClick={() => setShowPass(!showPass)} style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#64748b', cursor: 'pointer'
              }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.75rem', color: '#ef4444', fontSize: '0.85rem' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading} style={{
              width: '100%', padding: '0.85rem', background: '#22c55e',
              color: '#070d1a', border: 'none', borderRadius: '10px',
              fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, marginTop: '0.5rem', transition: 'opacity 0.2s'
            }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ icon, placeholder, type = 'text', value, onChange }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
        {icon}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px', color: '#f1f5f9', fontSize: '0.9rem', outline: 'none',
          transition: 'border-color 0.2s'
        }}
        onFocus={e => e.target.style.borderColor = '#22c55e'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
      />
    </div>
  )
}