import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

interface User {
  id: number; name: string; email: string; tier: string; account_type: string;
  is_admin: boolean; created_at: string; transaction_count?: number
}
interface Stats {
  users: { total: number; free: number; basic: number; premium: number; new_this_month: number }
  transactions: { total: number; this_month: number }
}

const TIER_COLORS: Record<string, { bg: string; darkBg: string; text: string; label: string }> = {
  free:    { bg: '#f3f4f6', darkBg: '#374151', text: '#6b7280', label: 'Free' },
  basic:   { bg: '#dbeafe', darkBg: '#1e3a8a', text: '#2563eb', label: 'Basic' },
  premium: { bg: '#ede9fe', darkBg: '#2e1065', text: '#7c3aed', label: 'Premium' },
}

export default function AdminDashboard() {
  const { isDark } = useTheme()
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [dataloading, setDataLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1, has_next: false, has_prev: false })
  const [updatingUser, setUpdatingUser] = useState<number | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!user.is_admin) return <Navigate to="/dashboard" replace />

  const C = {
    bg: isDark ? '#111827' : '#f8f7f4',
    card: isDark ? '#1f2937' : '#ffffff',
    border: isDark ? '#374151' : '#ebebeb',
    borderLight: isDark ? '#374151' : '#f3f3f3',
    text: isDark ? '#f9fafb' : '#1a1a1a',
    muted: isDark ? '#9ca3af' : '#888888',
    subtle: isDark ? '#6b7280' : '#aaaaaa',
    rowHover: isDark ? '#263347' : '#fafafa',
    headerBg: isDark ? '#111827' : '#fafafa',
    inputBg: isDark ? '#111827' : '#fff',
    inputBorder: isDark ? '#374151' : '#e5e5e5',
    font: "'Inter', sans-serif",
  }

  useEffect(() => { fetchStats() }, [])
  useEffect(() => { fetchUsers() }, [search, tierFilter, page])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats'); const data = res.data
      setStats({ users: { total: data.total_users || data.users?.total || 0, free: data.free_users || data.users?.free || 0, basic: data.basic_users || data.users?.basic || 0, premium: data.premium_users || data.users?.premium || 0, new_this_month: data.new_users || data.users?.new_this_month || 0 }, transactions: { total: data.total_transactions || data.transactions?.total || 0, this_month: data.transactions_this_month || data.transactions?.this_month || 0 } })
    } catch (err) { console.error(err) }
  }

  const fetchUsers = async () => {
    setDataLoading(true)
    try {
      const params: Record<string, string> = { page: String(page), per_page: '15' }
      if (search) params.search = search
      if (tierFilter !== 'all') params.tier = tierFilter
      const res = await api.get('/admin/users', { params })
      setUsers(Array.isArray(res.data) ? res.data : res.data.users || [])
      setPagination(res.data.pagination || { total: Array.isArray(res.data) ? res.data.length : 0, pages: 1, has_next: false, has_prev: false })
    } catch (err) { console.error(err) } finally { setDataLoading(false) }
  }

  const updateTier = async (userId: number, tier: string) => {
    setUpdatingUser(userId)
    try { await api.post('/admin/set-tier', { user_id: userId, tier }); showToast(`Tier updated to ${tier}`); fetchUsers(); fetchStats() }
    catch (err: any) { showToast(err.response?.data?.error || 'Failed', 'error') }
    finally { setUpdatingUser(null) }
  }

  const toggleAdmin = async (userId: number, isAdmin: boolean) => {
    setUpdatingUser(userId)
    try { await api.post('/admin/set-admin', { user_id: userId, is_admin: isAdmin }); showToast(`Admin ${isAdmin ? 'granted' : 'revoked'}`); fetchUsers() }
    catch (err: any) { showToast(err.response?.data?.error || 'Failed', 'error') }
    finally { setUpdatingUser(null) }
  }

  const safeStats = { users: { total: stats?.users?.total || 0, free: stats?.users?.free || 0, basic: stats?.users?.basic || 0, premium: stats?.users?.premium || 0, new_this_month: stats?.users?.new_this_month || 0 }, transactions: { total: stats?.transactions?.total || 0, this_month: stats?.transactions?.this_month || 0 } }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, transition: 'background 0.3s, color 0.3s' }}>
      <Navbar />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Users', value: safeStats.users.total },
            { label: 'Free Users', value: safeStats.users.free },
            { label: 'Basic', value: safeStats.users.basic },
            { label: 'Premium', value: safeStats.users.premium },
            { label: 'Transactions', value: safeStats.transactions.total },
          ].map(s => (
            <div key={s.label} style={{ background: C.card, padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.04)', transition: 'all 0.15s ease' }}>
              <p style={{ margin: 0, fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</p>
              <h2 style={{ margin: '6px 0 0', fontSize: 20, fontWeight: 700, color: C.text }}>{s.value}</h2>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div style={{ background: C.card, borderRadius: 16, border: `1.5px solid ${C.border}`, overflow: 'hidden', boxShadow: isDark ? 'none' : '0 4px 12px rgba(0,0,0,0.04)' }}>
          {/* Filters */}
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.borderLight}`, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text, marginRight: 8 }}>Users</h2>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.muted, fontSize: 13 }}>🔍</span>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search by name or email..."
                style={{ width: '100%', padding: '7px 10px 7px 32px', border: `1.5px solid ${C.inputBorder}`, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: C.inputBg, color: C.text }} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'free', 'basic', 'premium'].map(f => (
                <button key={f} onClick={() => { setTierFilter(f); setPage(1) }}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.12s', borderColor: tierFilter === f ? (isDark ? '#3b82f6' : '#1a1a1a') : C.inputBorder, background: tierFilter === f ? (isDark ? '#3b82f6' : '#1a1a1a') : C.inputBg, color: tierFilter === f ? '#fff' : C.muted }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {dataloading ? (
            <div style={{ padding: 20 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ height: 40, background: isDark ? '#374151' : '#f3f3f3', borderRadius: 8, marginBottom: 10, animation: 'pulse 1.2s infinite' }} />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.muted, fontSize: 13 }}>No users found</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 110px 110px 160px', gap: 0, padding: '8px 20px', background: C.headerBg, borderBottom: `1px solid ${C.borderLight}`, position: 'sticky', top: 0, zIndex: 5 }}>
                {['User', 'Joined', 'Account', 'Tier', 'Actions'].map(h => (
                  <p key={h} style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</p>
                ))}
              </div>

              {users.map((u, i) => {
                const tierStyle = TIER_COLORS[u.tier] ?? TIER_COLORS.free
                return (
                  <div key={u.id}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 140px 110px 110px 160px', gap: 0, padding: '12px 20px', alignItems: 'center', borderBottom: i < users.length - 1 ? `1px solid ${C.borderLight}` : 'none', transition: 'all 0.15s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.rowHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateY(0)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: `hsl(${u.id * 47 % 360}, 60%, ${isDark ? '25%' : '85%'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: `hsl(${u.id * 47 % 360}, 50%, ${isDark ? '70%' : '35%'})` }}>
                        {(u.name || u.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {u.name || u.email}
                          {u.is_admin && <span style={{ fontSize: 9, background: isDark ? '#374151' : '#1a1a1a', color: '#fff', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>ADMIN</span>}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{new Date(u.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
                    <p style={{ margin: 0, fontSize: 12, color: C.muted, textTransform: 'capitalize' }}>{u.account_type}</p>
                    <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: isDark ? tierStyle.darkBg : tierStyle.bg, color: tierStyle.text }}>{tierStyle.label}</span>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      <select value={u.tier} disabled={updatingUser === u.id} onChange={e => updateTier(u.id, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: 7, border: `1.5px solid ${C.inputBorder}`, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer', background: C.inputBg, color: C.text, outline: 'none' }}>
                        <option value="free">Free</option><option value="basic">Basic</option><option value="premium">Premium</option>
                      </select>
                      <button disabled={updatingUser === u.id} onClick={() => toggleAdmin(u.id, !u.is_admin)}
                        style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s ease', borderColor: u.is_admin ? (isDark ? '#7f1d1d' : '#fecaca') : C.inputBorder, background: u.is_admin ? (isDark ? '#450a0a' : '#fff1f2') : C.inputBg, color: u.is_admin ? '#dc2626' : C.muted, opacity: updatingUser === u.id ? 0.6 : 1 }}>
                        {u.is_admin ? 'Revoke Admin' : 'Make Admin'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {pagination.pages > 1 && (
            <div style={{ padding: '14px 20px', borderTop: `1px solid ${C.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{pagination.total} users total</p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button disabled={!pagination.has_prev} onClick={() => setPage(p => p - 1)} style={{ padding: '5px 12px', borderRadius: 7, border: `1.5px solid ${C.inputBorder}`, fontSize: 12, cursor: pagination.has_prev ? 'pointer' : 'not-allowed', background: C.inputBg, color: C.text, opacity: pagination.has_prev ? 1 : 0.4, fontFamily: 'inherit' }}>← Prev</button>
                <span style={{ padding: '5px 12px', fontSize: 12, color: C.muted }}>Page {page} of {pagination.pages}</span>
                <button disabled={!pagination.has_next} onClick={() => setPage(p => p + 1)} style={{ padding: '5px 12px', borderRadius: 7, border: `1.5px solid ${C.inputBorder}`, fontSize: 12, cursor: pagination.has_next ? 'pointer' : 'not-allowed', background: C.inputBg, color: C.text, opacity: pagination.has_next ? 1 : 0.4, fontFamily: 'inherit' }}>Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: toast.type === 'success' ? (isDark ? '#1f2937' : '#1a1a1a') : '#dc2626', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', border: isDark ? `1px solid ${toast.type === 'success' ? '#374151' : '#7f1d1d'}` : 'none' }}>
          {toast.msg}
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity: 0.6 } 50% { opacity: 1 } }`}</style>
    </div>
  )
}

