import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

interface Budget {
  id: number; category: string; budget_amount: number; spent_amount: number; period: string;
  alert_threshold: number; percentage_used: number; is_exceeded: boolean; is_near_limit: boolean
}

const CATEGORIES = [
  { label: 'Rent', icon: '🏠' }, { label: 'Utilities', icon: '💡' }, { label: 'Groceries', icon: '🛒' },
  { label: 'Transport', icon: '🚗' }, { label: 'Salaries', icon: '👥' }, { label: 'Healthcare', icon: '🏥' },
  { label: 'Entertainment', icon: '🎬' }, { label: 'Other', icon: '📦' },
]
const CATEGORY_COLORS: Record<string, string> = {
  Rent: '#8b5cf6', Utilities: '#f59e0b', Groceries: '#10b981',
  Transport: '#3b82f6', Salaries: '#06b6d4', Healthcare: '#ef4444',
  Entertainment: '#ec4899', Other: '#6b7280',
}

export default function Budgets() {
  const { isDark } = useTheme()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [error, setError] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ category: 'Rent', budget_amount: '', period: 'monthly', alert_threshold: 0.80 })

  const C = {
    bg: isDark ? '#111827' : '#f8f7f4',
    card: isDark ? '#1f2937' : '#ffffff',
    border: isDark ? '#374151' : '#ebebeb',
    text: isDark ? '#f9fafb' : '#1a1a1a',
    muted: isDark ? '#9ca3af' : '#888888',
    subtle: isDark ? '#6b7280' : '#aaaaaa',
    inputBg: isDark ? '#111827' : '#fff',
    inputBorder: isDark ? '#374151' : '#e5e5e5',
    font: "'Inter', sans-serif",
    mono: "'JetBrains Mono', monospace",
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', border: `2px solid ${C.inputBorder}`,
    borderRadius: 10, fontSize: 14, fontFamily: C.font, outline: 'none',
    boxSizing: 'border-box' as const, color: C.text, background: C.inputBg,
  }
  const labelStyle = { fontSize: 12, fontWeight: 500 as const, color: C.muted, textTransform: 'uppercase' as const, letterSpacing: '0.5px', display: 'block', marginBottom: 8 }

  const fetchBudgets = async () => {
    try { const res = await api.get('/budgets/'); setBudgets(res.data) }
    catch (err) { console.error(err) } finally { setLoading(false) }
  }
  useEffect(() => { fetchBudgets() }, [])

  const openNew = () => { setForm({ category: 'Rent', budget_amount: '', period: 'monthly', alert_threshold: 0.80 }); setCustomCategory(''); setEditingId(null); setError(''); setDrawerOpen(true) }
  const openEdit = (b: Budget) => { setForm({ category: b.category, budget_amount: String(b.budget_amount), period: b.period, alert_threshold: b.alert_threshold }); setEditingId(b.id); setError(''); setDrawerOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true)
    const finalCategory = form.category === 'Other' && customCategory.trim() ? customCategory.trim() : form.category
    try {
      if (editingId) await api.put(`/budgets/${editingId}`, { ...form, category: finalCategory })
      else await api.post('/budgets/', { ...form, category: finalCategory })
      setDrawerOpen(false); fetchBudgets()
    } catch (err: any) { setError(err.response?.data?.error || 'Something went wrong') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this budget?')) return
    try { await api.delete(`/budgets/${id}`); fetchBudgets() } catch (err) { console.error(err) }
  }

  const totalBudgeted = budgets.reduce((s, b) => s + b.budget_amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent_amount, 0)
  const overCount = budgets.filter(b => b.is_exceeded).length
  const nearCount = budgets.filter(b => b.is_near_limit && !b.is_exceeded).length

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, transition: 'background 0.3s, color 0.3s' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <Navbar />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 500, color: C.text, letterSpacing: '-0.5px', margin: 0 }}>Budgets</h1>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{budgets.length} categories · {new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}</p>
          </div>
          <button onClick={openNew}
            style={{ background: isDark ? '#3b82f6' : '#1a1a1a', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: C.font }}
            onMouseOver={e => (e.currentTarget.style.background = isDark ? '#2563eb' : '#333')}
            onMouseOut={e => (e.currentTarget.style.background = isDark ? '#3b82f6' : '#1a1a1a')}>
            + Add budget
          </button>
        </div>

        {/* Summary strip */}
        {budgets.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total Budgeted', value: `KES ${totalBudgeted.toLocaleString()}`, color: '#2563eb', bg: isDark ? '#1e3a8a' : '#eff6ff' },
              { label: 'Total Spent', value: `KES ${totalSpent.toLocaleString()}`, color: '#dc2626', bg: isDark ? '#450a0a' : '#fef2f2' },
              { label: 'Over Budget', value: `${overCount} categories`, color: overCount > 0 ? '#dc2626' : '#059669', bg: overCount > 0 ? (isDark ? '#450a0a' : '#fef2f2') : (isDark ? '#064e3b' : '#ecfdf5') },
              { label: 'Near Limit', value: `${nearCount} categories`, color: nearCount > 0 ? '#d97706' : '#059669', bg: nearCount > 0 ? (isDark ? '#422006' : '#fffbeb') : (isDark ? '#064e3b' : '#ecfdf5') },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: 14, padding: '14px 16px', border: `1.5px solid ${s.color}30` }}>
                <p style={{ fontSize: 11, fontWeight: 500, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 6px' }}>{s.label}</p>
                <p style={{ fontSize: 17, fontWeight: 500, color: s.color, fontFamily: C.mono, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Budget list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: C.muted, fontSize: 14 }}>Loading...</div>
        ) : budgets.length === 0 ? (
          <div style={{ background: C.card, borderRadius: 16, border: `1.5px dashed ${C.border}`, padding: '56px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
            <h3 style={{ fontSize: 16, fontWeight: 500, color: C.text, margin: '0 0 8px' }}>No budgets yet</h3>
            <p style={{ color: C.muted, fontSize: 14, margin: '0 0 20px' }}>Set spending limits to stay on track</p>
            <button onClick={openNew} style={{ background: isDark ? '#3b82f6' : '#1a1a1a', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: C.font }}>
              Create your first budget
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {budgets.map(b => {
              const pct = Math.min(b.percentage_used, 100)
              const catColor = CATEGORY_COLORS[b.category] ?? '#6b7280'
              const barColor = b.is_exceeded ? '#dc2626' : b.is_near_limit ? '#f59e0b' : catColor
              const catIcon = CATEGORIES.find(c => c.label === b.category)?.icon ?? '📦'
              const remaining = b.budget_amount - b.spent_amount
              const cardBorder = b.is_exceeded ? (isDark ? '#7f1d1d' : '#fecaca') : b.is_near_limit ? (isDark ? '#78350f' : '#fde68a') : C.border

              return (
                <div key={b.id}
                  style={{ background: C.card, borderRadius: 16, padding: '20px', border: `1.5px solid ${cardBorder}`, transition: 'all 0.15s' }}
                  onMouseOver={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)')}
                  onMouseOut={e => (e.currentTarget.style.boxShadow = 'none')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: catColor + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{catIcon}</div>
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: C.text }}>{b.category}</p>
                        <p style={{ margin: 0, fontSize: 11, color: C.muted, textTransform: 'capitalize' }}>{b.period}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {b.is_exceeded && <span style={{ fontSize: 10, background: isDark ? '#450a0a' : '#fef2f2', color: '#dc2626', padding: '3px 8px', borderRadius: 20, fontWeight: 500 }}>OVER</span>}
                      {b.is_near_limit && !b.is_exceeded && <span style={{ fontSize: 10, background: isDark ? '#422006' : '#fffbeb', color: '#d97706', padding: '3px 8px', borderRadius: 20, fontWeight: 500 }}>NEAR</span>}
                      <button onClick={() => openEdit(b)} style={{ background: isDark ? '#374151' : '#f5f5f5', border: 'none', borderRadius: 7, padding: '4px 10px', fontSize: 11, color: C.muted, cursor: 'pointer', fontFamily: C.font }}>Edit</button>
                      <button onClick={() => handleDelete(b.id)} style={{ background: isDark ? '#450a0a' : '#fff0f0', border: 'none', borderRadius: 7, padding: '4px 8px', fontSize: 11, color: '#dc2626', cursor: 'pointer', fontFamily: C.font }}>✕</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 22, fontWeight: 500, fontFamily: C.mono, color: b.is_exceeded ? '#dc2626' : C.text }}>KES {b.spent_amount.toLocaleString()}</p>
                      <p style={{ margin: 0, fontSize: 12, color: C.subtle, fontFamily: C.mono }}>of KES {b.budget_amount.toLocaleString()}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: 24, fontWeight: 500, color: pct > 100 ? '#dc2626' : catColor }}>{pct.toFixed(0)}%</p>
                      <p style={{ margin: 0, fontSize: 11, color: remaining < 0 ? '#dc2626' : C.subtle }}>
                        {remaining < 0 ? `KES ${Math.abs(remaining).toLocaleString()} over` : `KES ${remaining.toLocaleString()} left`}
                      </p>
                    </div>
                  </div>
                  <div style={{ height: 8, background: isDark ? '#374151' : '#f3f3f3', borderRadius: 20, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 20, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <p style={{ margin: 0, fontSize: 10, color: C.subtle }}>Alert at {Math.round(b.alert_threshold * 100)}%</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Overlay */}
      <div onClick={() => setDrawerOpen(false)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', zIndex: 40, opacity: drawerOpen ? 1 : 0, pointerEvents: drawerOpen ? 'auto' : 'none', transition: 'opacity 0.25s' }} />

      {/* Drawer */}
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, background: C.card, zIndex: 50, boxShadow: '-4px 0 40px rgba(0,0,0,0.3)', transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)', display: 'flex', flexDirection: 'column', fontFamily: C.font }}>
        <div style={{ padding: '22px 24px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: C.text }}>{editingId ? 'Edit Budget' : 'New Budget'}</h2>
          <button onClick={() => setDrawerOpen(false)} style={{ background: isDark ? '#374151' : '#f3f3f3', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 14, color: C.muted }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {error && <div style={{ background: isDark ? '#450a0a' : '#fef2f2', border: `1px solid ${isDark ? '#7f1d1d' : '#fecaca'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: 13 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={labelStyle}>Category</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {CATEGORIES.map(c => {
                  const color = CATEGORY_COLORS[c.label] ?? '#6b7280'
                  const sel = form.category === c.label
                  return (
                    <button key={c.label} type="button" onClick={() => setForm(f => ({ ...f, category: c.label }))}
                      style={{ padding: '10px 4px', borderRadius: 10, border: '2px solid', cursor: 'pointer', fontFamily: C.font, fontSize: 10, fontWeight: 500, textAlign: 'center', borderColor: sel ? color : C.inputBorder, background: sel ? color + '25' : C.inputBg, color: sel ? color : C.muted, transition: 'all 0.12s' }}>
                      <div style={{ fontSize: 20, marginBottom: 3 }}>{c.icon}</div>{c.label}
                    </button>
                  )
                })}
              </div>
              {form.category === 'Other' && (
                <input value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="e.g. Netflix, School fees..." style={{ ...inputStyle, marginTop: 10, fontSize: 13 }} />
              )}
            </div>

            <div>
              <label style={labelStyle}>Budget Amount (KES)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: C.muted, fontFamily: C.mono }}>KES</span>
                <input type="number" min="0" step="1" value={form.budget_amount} onChange={e => setForm(f => ({ ...f, budget_amount: e.target.value }))} placeholder="0" required
                  style={{ ...inputStyle, paddingLeft: 52, fontSize: 22, fontWeight: 500, fontFamily: C.mono }}
                  onFocus={e => (e.target.style.borderColor = '#3b82f6')} onBlur={e => (e.target.style.borderColor = C.inputBorder)} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Period</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {['monthly', 'yearly'].map(p => (
                  <button key={p} type="button" onClick={() => setForm(f => ({ ...f, period: p }))}
                    style={{ padding: '11px', borderRadius: 10, border: '2px solid', cursor: 'pointer', fontFamily: C.font, fontWeight: 500, fontSize: 13, transition: 'all 0.12s', borderColor: form.period === p ? '#3b82f6' : C.inputBorder, background: form.period === p ? (isDark ? '#1e3a8a' : '#1a1a1a') : C.inputBg, color: form.period === p ? '#fff' : C.muted }}>
                    {p === 'monthly' ? '📅 Monthly' : '📆 Yearly'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Alert threshold — <span style={{ color: C.text, fontFamily: C.mono }}>{Math.round(form.alert_threshold * 100)}%</span></label>
              <p style={{ fontSize: 12, color: C.muted, margin: '0 0 10px' }}>Get warned when you reach this percentage of your budget</p>
              <input type="range" min="0.5" max="1" step="0.05" value={form.alert_threshold} onChange={e => setForm(f => ({ ...f, alert_threshold: parseFloat(e.target.value) }))} style={{ width: '100%', accentColor: '#3b82f6' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 11, color: C.subtle }}>50%</span>
                <span style={{ fontSize: 11, color: C.subtle }}>100%</span>
              </div>
            </div>

            <button type="submit" disabled={saving}
              style={{ background: saving ? '#6b7280' : (isDark ? '#3b82f6' : '#1a1a1a'), color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: C.font, marginTop: 4 }}>
              {saving ? 'Saving...' : editingId ? 'Update Budget' : 'Create Budget'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
