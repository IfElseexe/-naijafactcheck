import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Detector from './pages/Detector'
import Feed from './pages/Feed'
import History from './pages/History'
import Auth from './pages/Auth'
import InsideBowen from './pages/InsideBowen'
import { Toaster } from 'react-hot-toast'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#22c55e' }}>Loading...</div>
  return user ? children : <Navigate to="/auth" />
}

function AppRoutes() {
  return (
    <>
       <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1e293b',
          color: '#f1f5f9',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          fontSize: '0.88rem',
        },
        success: { iconTheme: { primary: '#22c55e', secondary: '#070d1a' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#070d1a' } },
      }} />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/detect" element={<Detector />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/inside-bowen" element={<ProtectedRoute><InsideBowen /></ProtectedRoute>} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}