import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { PlusCircle, Heart, MessageCircle, Send, X, Megaphone, BookOpen, Bell, Users, Image, Loader } from 'lucide-react'

const CATEGORIES = [
  { value: 'announcement', label: 'Announcement', icon: Megaphone, color: '#3b82f6' },
  { value: 'academic', label: 'Academic', icon: BookOpen, color: '#8b5cf6' },
  { value: 'notice', label: 'Notice', icon: Bell, color: '#f59e0b' },
  { value: 'general', label: 'General', icon: Users, color: '#22c55e' },
]

export default function InsideBowen() {
  const { user, profile } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', category: 'announcement' })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [activePost, setActivePost] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [filter, setFilter] = useState('all')
  const [likedPosts, setLikedPosts] = useState([])
  const fileRef = useRef()

  useEffect(() => { fetchPosts() }, [filter])

  const fetchPosts = async () => {
    setLoading(true)
    let query = supabase.from('posts').select('*').order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('category', filter)
    const { data } = await query
    setPosts(data || [])
    if (user) {
      const { data: likes } = await supabase.from('post_likes').select('post_id').eq('user_id', user.id)
      setLikedPosts(likes?.map(l => l.post_id) || [])
    }
    setLoading(false)
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const submitPost = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    setSubmitting(true)

    let imageUrl = null

    // Upload image if selected
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, imageFile)

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName)
        imageUrl = urlData.publicUrl
      }
    }

    await supabase.from('posts').insert({
      author_id: user.id,
      author_name: profile.full_name,
      author_role: profile.role,
      title: form.title,
      content: form.content,
      category: form.category,
      image_url: imageUrl,
    })

    setForm({ title: '', content: '', category: 'announcement' })
    setImageFile(null)
    setImagePreview(null)
    setShowForm(false)
    fetchPosts()
    setSubmitting(false)
  }

  const toggleLike = async (post) => {
    const liked = likedPosts.includes(post.id)
    if (liked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id)
      await supabase.from('posts').update({ likes: post.likes - 1 }).eq('id', post.id)
      setLikedPosts(l => l.filter(id => id !== post.id))
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id })
      await supabase.from('posts').update({ likes: post.likes + 1 }).eq('id', post.id)
      setLikedPosts(l => [...l, post.id])
    }
    fetchPosts()
  }

  const openPost = async (post) => {
    setActivePost(post)
    const { data } = await supabase.from('comments').select('*').eq('post_id', post.id).order('created_at', { ascending: true })
    setComments(data || [])
  }

  const submitComment = async () => {
    if (!newComment.trim()) return
    await supabase.from('comments').insert({
      post_id: activePost.id,
      author_id: user.id,
      author_name: profile.full_name,
      content: newComment
    })
    setNewComment('')
    const { data } = await supabase.from('comments').select('*').eq('post_id', activePost.id).order('created_at', { ascending: true })
    setComments(data || [])
  }

  const getCat = (val) => CATEGORIES.find(c => c.value === val) || CATEGORIES[0]

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>Inside Bowen</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Official announcements and updates from Bowen University</p>
        </div>
        {profile?.role === 'authority' && (
          <button onClick={() => setShowForm(true)} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '0.7rem 1.2rem', background: '#22c55e',
            color: '#070d1a', border: 'none', borderRadius: '10px',
            fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem'
          }}>
            <PlusCircle size={18} /> New Post
          </button>
        )}
      </div>
      <div style={{color:'yellow', marginBottom:'1rem', fontSize:'0.8rem'}}>
  Debug: role = "{profile?.role}" | user = "{user?.email}"
</div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[{ value: 'all', label: 'All' }, ...CATEGORIES].map(cat => (
          <button key={cat.value} onClick={() => setFilter(cat.value)} style={{
            padding: '0.4rem 1rem', borderRadius: '999px', border: '1px solid',
            borderColor: filter === cat.value ? '#22c55e' : 'rgba(255,255,255,0.08)',
            background: filter === cat.value ? 'rgba(34,197,94,0.1)' : 'transparent',
            color: filter === cat.value ? '#22c55e' : '#64748b',
            fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer'
          }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* New Post Form */}
      {showForm && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700 }}>Create Post</h3>
            <button onClick={() => { setShowForm(false); setImageFile(null); setImagePreview(null) }}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Post title..."
              style={{ padding: '0.75rem 1rem', background: '#070d1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#f1f5f9', fontSize: '0.95rem', outline: 'none' }} />

            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Write your announcement..." rows={4}
              style={{ padding: '0.75rem 1rem', background: '#070d1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#f1f5f9', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }} />

            {/* Image upload */}
            <div>
              <input type="file" accept="image/*" ref={fileRef} onChange={handleImageSelect} style={{ display: 'none' }} />
              {imagePreview ? (
                <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden' }}>
                  <img src={imagePreview} alt="preview" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '10px' }} />
                  <button onClick={() => { setImageFile(null); setImagePreview(null) }}
                    style={{
                      position: 'absolute', top: '8px', right: '8px',
                      background: 'rgba(0,0,0,0.7)', border: 'none',
                      borderRadius: '999px', padding: '4px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', color: '#fff'
                    }}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current.click()} style={{
                  width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.02)',
                  border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '10px',
                  color: '#64748b', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: '8px',
                  fontSize: '0.88rem', fontWeight: 500
                }}>
                  <Image size={16} /> Add Image (optional)
                </button>
              )}
            </div>

            {/* Category selector */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button key={cat.value} onClick={() => setForm(f => ({ ...f, category: cat.value }))} style={{
                  padding: '0.4rem 0.9rem', borderRadius: '999px', border: '1px solid',
                  borderColor: form.category === cat.value ? cat.color : 'rgba(255,255,255,0.08)',
                  background: form.category === cat.value ? `${cat.color}20` : 'transparent',
                  color: form.category === cat.value ? cat.color : '#64748b',
                  fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500
                }}>
                  {cat.label}
                </button>
              ))}
            </div>

            <button onClick={submitPost} disabled={submitting} style={{
              padding: '0.8rem', background: '#22c55e', color: '#070d1a',
              border: 'none', borderRadius: '10px', fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}>
              {submitting ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Uploading...</> : 'Publish Post'}
            </button>
          </div>
        </div>
      )}

      {/* Posts */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>Loading posts...</div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>
          <Megaphone size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <div>No posts yet. Check back soon!</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {posts.map(post => {
            const cat = getCat(post.category)
            const CatIcon = cat.icon
            return (
              <div key={post.id} style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px', overflow: 'hidden', transition: 'border-color 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
              >
                {/* Post image */}
                {post.image_url && (
                  <img src={post.image_url} alt={post.title}
                    style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                    onClick={() => openPost(post)}
                  />
                )}

                <div style={{ padding: '1.2rem 1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      background: `${cat.color}18`, color: cat.color,
                      padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600
                    }}>
                      <CatIcon size={12} /> {cat.label}
                    </span>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      <span style={{ color: post.author_role === 'authority' ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>{post.author_name}</span>
                      {post.author_role === 'authority' && <span style={{ marginLeft: '5px', fontSize: '0.68rem', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', padding: '1px 6px', borderRadius: '4px' }}>Authority</span>}
                      <span style={{ marginLeft: '8px' }}>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem', cursor: 'pointer', color: '#f1f5f9' }} onClick={() => openPost(post)}>
                    {post.title}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.87rem', lineHeight: 1.6, marginBottom: '1rem', cursor: 'pointer' }} onClick={() => openPost(post)}>
                    {post.content.slice(0, 180)}{post.content.length > 180 ? '...' : ''}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.8rem' }}>
                    <button onClick={() => toggleLike(post)} style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      background: 'none', border: 'none',
                      color: likedPosts.includes(post.id) ? '#ef4444' : '#64748b',
                      cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, padding: 0
                    }}>
                      <Heart size={15} fill={likedPosts.includes(post.id) ? '#ef4444' : 'none'} />
                      {post.likes}
                    </button>
                    <button onClick={() => openPost(post)} style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      background: 'none', border: 'none', color: '#64748b',
                      cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, padding: 0
                    }}>
                      <MessageCircle size={15} /> Comment
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Post Modal */}
      {activePost && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
        }} onClick={e => e.target === e.currentTarget && setActivePost(null)}>
          <div style={{
            background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '18px', width: '100%', maxWidth: '580px',
            maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            {activePost.image_url && (
              <img src={activePost.image_url} alt={activePost.title}
                style={{ width: '100%', maxHeight: '220px', objectFit: 'cover' }} />
            )}
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', flex: 1, paddingRight: '1rem' }}>{activePost.title}</h3>
              <button onClick={() => setActivePost(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', flexShrink: 0 }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '1.2rem 1.5rem' }}>
              <p style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: '0.9rem', marginBottom: '1.5rem' }}>{activePost.content}</p>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                <h4 style={{ fontWeight: 600, fontSize: '0.8rem', color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.8rem' }}>
                  Comments ({comments.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '1rem' }}>
                  {comments.map(c => (
                    <div key={c.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#22c55e', marginBottom: '0.3rem' }}>{c.author_name}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.87rem', lineHeight: 1.6 }}>{c.content}</div>
                    </div>
                  ))}
                  {comments.length === 0 && <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No comments yet. Be the first!</div>}
                </div>

                {user ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input value={newComment} onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && submitComment()}
                      placeholder="Write a comment..."
                      style={{ flex: 1, padding: '0.65rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#f1f5f9', fontSize: '0.88rem', outline: 'none' }} />
                    <button onClick={submitComment} style={{
                      padding: '0.65rem 1rem', background: '#22c55e',
                      border: 'none', borderRadius: '8px', color: '#070d1a', cursor: 'pointer'
                    }}>
                      <Send size={16} />
                    </button>
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem' }}>
                    Sign in to leave a comment
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}