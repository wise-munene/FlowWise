import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

interface Transaction {
  id: number; type: string; category: string; amount: number; date: string;
  notes: string; is_recurring: boolean; payment_method: string;
  payment_channel?: string; created_at?: string
}

const CATEGORIES = [
  { label: 'Groceries', icon: '🛒' }, { label: 'Transport', icon: '🚗' }, { label: 'Utilities', icon: '💡' },
  { label: 'Rent', icon: '🏠' }, { label: 'Healthcare', icon: '🏥' }, { label: 'Entertainment', icon: '🎬' },
  { label: 'Salary', icon: '💼' }, { label: 'Sales', icon: '📈' }, { label: 'Salaries', icon: '👥' }, { label: 'Other', icon: '📦' },
]
const CATEGORY_COLORS: Record<string, string> = {
  Groceries: '#10b981', Transport: '#3b82f6', Utilities: '#f59e0b', Rent: '#8b5cf6',
  Healthcare: '#ef4444', Entertainment: '#06b6d4', Salary: '#10b981', Sales: '#3b82f6', Salaries: '#8b5cf6', Other: '#6b7280',
}
const PAYMENT_ICONS: Record<string, string> = { Mpesa: '📱', Cash: '💵', Bank: '🏦', Card: '💳' }
const defaultForm = { type: 'expense', category: 'Other', payment_method: 'Mpesa', amount: '', date: new Date().toISOString().split('T')[0], notes: '', is_recurring: false }

export default function Transactions() {
  const { isDark } = useTheme()
  const [transactions, setTransactions]   = useState<Transaction[]>([])
  const [loading, setLoading]             = useState(true)
  const [drawerOpen, setDrawerOpen]       = useState(false)
  const [detailTx, setDetailTx]           = useState<Transaction | null>(null)
  const [editingId, setEditingId]         = useState<number | null>(null)
  const [error, setError]                 = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [search, setSearch]               = useState('')
  const [filterType, setFilterType]       = useState<'all' | 'income' | 'expense'>('all')
  const [saving, setSaving]               = useState(false)
  const [form, setForm]                   = useState(defaultForm)
  const [deleting, setDeleting]           = useState<number | null>(null)
  const amountRef = useRef<HTMLInputElement>(null)

  const C = {
    bg:          isDark ? '#111827' : '#f8f7f4',
    card:        isDark ? '#1f2937' : '#ffffff',
    border:      isDark ? '#374151' : '#ebebeb',
    rowHover:    isDark ? '#263347' : '#fafafa',
    text:        isDark ? '#f9fafb' : '#1a1a1a',
    muted:       isDark ? '#9ca3af' : '#999999',
    subtle:      isDark ? '#6b7280' : '#cccccc',
    inputBg:     isDark ? '#111827' : '#fff',
    inputBorder: isDark ? '#374151' : '#e5e5e5',
    detailBg:    isDark ? '#111827' : '#f8fafc',
    font:        "'Inter', sans-serif",
    mono:        "'JetBrains Mono', monospace",
  }
  const inputStyle = { width: '100%', padding: '9px 12px', border: `2px solid ${C.inputBorder}`, borderRadius: 10, fontSize: 13, fontFamily: C.font, outline: 'none', boxSizing: 'border-box' as const, color: C.text, background: C.inputBg }

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const res = await api.get('/transactions/')
      setTransactions(res.data.transactions ?? res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchTransactions() }, [])
  useEffect(() => { if (drawerOpen) setTimeout(() => amountRef.current?.focus(), 100) }, [drawerOpen])

  const openNew = () => {
    setForm(defaultForm); setCustomCategory(''); setEditingId(null); setError('')
    setDetailTx(null); setDrawerOpen(true)
  }
  const openEdit = (t: Transaction) => {
    setForm({ type: t.type, category: t.category, payment_method: t.payment_method, amount: String(t.amount), date: t.date, notes: t.notes || '', is_recurring: t.is_recurring })
    setEditingId(t.id); setError(''); setDetailTx(null); setDrawerOpen(true)
  }
  const openDetail = (t: Transaction) => { setDetailTx(t) }
  const closeDetail = () => setDetailTx(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true)
    const finalCategory = form.category === 'Other' && customCategory.trim() ? customCategory.trim() : form.category
    try {
      if (editingId) await api.put(`/transactions/${editingId}`, { ...form, category: finalCategory })
      else await api.post('/transactions/', { ...form, category: finalCategory })
      setDrawerOpen(false); fetchTransactions()
    } catch (err: any) { setError(err.response?.data?.error || 'Something went wrong') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this transaction?')) return
    setDeleting(id)
    try { await api.delete(`/transactions/${id}`); fetchTransactions(); closeDetail() }
    catch (err) { console.error(err) }
    finally { setDeleting(null) }
  }

  const filtered = transactions.filter(t => {
    const matchType   = filterType === 'all' || t.type === filterType
    const matchSearch = !search || t.category.toLowerCase().includes(search.toLowerCase()) || (t.notes || '').toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const getCategoryIcon  = (cat: string) => CATEGORIES.find(c => c.label === cat)?.icon ?? '📦'
  const getCategoryColor = (cat: string) => CATEGORY_COLORS[cat] ?? '#6b7280'

  const formatDateTime = (isoStr?: string) => {
    if (!isoStr) return '—'
    try {
      const d = new Date(isoStr)
      return d.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        + ' at ' + d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
    } catch { return isoStr }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, transition: 'background 0.3s' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 style={{ fontFamily: C.font, fontWeight: 500, fontSize: 28, color: C.text, letterSpacing: '-0.5px' }}>Transactions</h1>
            <p style={{ color: C.muted, fontSize: 14, marginTop: 2 }}>{transactions.length} total · click any row to see details</p>
          </div>
          <button onClick={openNew}
            style={{ background: isDark ? '#3b82f6' : '#1a1a1a', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: C.font }}
            onMouseOver={e => (e.currentTarget.style.background = isDark ? '#2563eb' : '#333')}
            onMouseOut={e => (e.currentTarget.style.background = isDark ? '#3b82f6' : '#1a1a1a')}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add transaction
          </button>
        </div>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Income',   value: totalIncome,               color: '#059669', bg: isDark ? '#064e3b' : '#ecfdf5' },
            { label: 'Expenses', value: totalExpense,              color: '#dc2626', bg: isDark ? '#450a0a' : '#fef2f2' },
            { label: 'Net',      value: totalIncome - totalExpense, color: totalIncome - totalExpense >= 0 ? '#2563eb' : '#dc2626', bg: isDark ? '#1e3a8a' : '#eff6ff' },
          ].map(item => (
            <div key={item.label} style={{ background: item.bg, borderRadius: 14, padding: '16px 20px' }}>
              <p style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginBottom: 4 }}>{item.label}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: item.color, fontFamily: C.mono }}>KES {Math.abs(item.value).toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted, fontSize: 14 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..."
              style={{ ...inputStyle, padding: '9px 12px 9px 36px', border: `1.5px solid ${C.inputBorder}` }} />
          </div>
          {(['all', 'income', 'expense'] as const).map(f => (
            <button key={f} onClick={() => setFilterType(f)}
              style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500, border: '1.5px solid', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', borderColor: filterType === f ? (isDark ? '#3b82f6' : '#1a1a1a') : C.inputBorder, background: filterType === f ? (isDark ? '#3b82f6' : '#1a1a1a') : C.inputBg, color: filterType === f ? '#fff' : C.muted }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Transaction list */}
        <div style={{ background: C.card, borderRadius: 16, border: `1.5px solid ${C.border}`, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.muted, fontSize: 14 }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
              <p style={{ color: C.muted, fontSize: 14 }}>No transactions found</p>
              <button onClick={openNew} style={{ marginTop: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: C.font }}>Add your first transaction →</button>
            </div>
          ) : (
            filtered.map((t, i) => (
              <div key={t.id}
                onClick={() => openDetail(t)}
                style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none', transition: 'background 0.1s', cursor: 'pointer' }}
                onMouseOver={e => (e.currentTarget.style.background = C.rowHover)}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: getCategoryColor(t.category) + '20', flexShrink: 0, marginRight: 14 }}>
                  {getCategoryIcon(t.category)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: C.text, margin: 0 }}>{t.category}</p>
                  <p style={{ fontSize: 12, color: C.muted, margin: '2px 0 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span>{t.date}</span>
                    {t.payment_method && <span>· {t.payment_method}</span>}
                    {t.notes && <span>· {t.notes.length > 30 ? t.notes.slice(0, 30) + '…' : t.notes}</span>}
                    {t.is_recurring && <span style={{ color: '#8b5cf6' }}>· ↻ recurring</span>}
                  </p>
                </div>
                <div style={{ textAlign: 'right', marginRight: 12 }}>
                  <p style={{ fontSize: 15, fontWeight: 500, margin: 0, fontFamily: C.mono, color: t.type === 'income' ? '#059669' : '#dc2626' }}>
                    {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString()}
                  </p>
                  <p style={{ fontSize: 11, color: C.subtle, margin: 0 }}>KES</p>
                </div>
                {/* Chevron hint */}
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={C.subtle} strokeWidth={2} style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── TRANSACTION DETAIL PANEL ───────────────────── */}
      {/* Overlay */}
      <div onClick={closeDetail}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', zIndex: 40, opacity: detailTx ? 1 : 0, pointerEvents: detailTx ? 'auto' : 'none', transition: 'opacity 0.25s' }} />

      {/* Detail panel — slides up from bottom */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50, background: C.card, borderRadius: '20px 20px 0 0', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)', transform: detailTx ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.35s cubic-bezier(0.32,0.72,0,1)', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {detailTx && (
          <>
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: isDark ? '#374151' : '#e5e7eb' }} />
            </div>

            {/* Detail content */}
            <div style={{ overflowY: 'auto', padding: '8px 24px 32px' }}>

              {/* Icon + amount header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, marginTop: 12 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, background: getCategoryColor(detailTx.category) + '22', flexShrink: 0 }}>
                  {getCategoryIcon(detailTx.category)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 600, fontFamily: C.mono, color: detailTx.type === 'income' ? '#059669' : '#dc2626' }}>
                    {detailTx.type === 'income' ? '+' : '-'} KES {detailTx.amount.toLocaleString()}
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: 15, color: C.text, fontWeight: 500 }}>{detailTx.category}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 20, background: detailTx.type === 'income' ? (isDark ? '#064e3b' : '#ecfdf5') : (isDark ? '#450a0a' : '#fef2f2'), color: detailTx.type === 'income' ? '#059669' : '#dc2626' }}>
                  {detailTx.type === 'income' ? 'Income' : 'Expense'}
                </span>
              </div>

              {/* Detail rows */}
              <div style={{ background: C.detailBg, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden', marginBottom: 16 }}>
                {[
                  { label: 'Transaction date', value: new Date(detailTx.date).toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
                  { label: 'Logged at', value: formatDateTime(detailTx.created_at) },
                  { label: 'Payment method', value: `${PAYMENT_ICONS[detailTx.payment_method] ?? '💳'} ${detailTx.payment_method}` },
                  detailTx.payment_channel ? { label: 'Payment channel', value: detailTx.payment_channel } : null,
                  { label: 'Category', value: `${getCategoryIcon(detailTx.category)} ${detailTx.category}` },
                  { label: 'Recurring', value: detailTx.is_recurring ? '↻ Yes — repeats monthly' : 'No' },
                  detailTx.notes ? { label: 'Notes', value: detailTx.notes } : null,
                  { label: 'Transaction ID', value: `#${detailTx.id}` },
                ].filter(Boolean).map((row, i, arr) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none', gap: 16 }}>
                    <p style={{ margin: 0, fontSize: 12, color: C.muted, fontWeight: 500, flexShrink: 0 }}>{row!.label}</p>
                    <p style={{ margin: 0, fontSize: 13, color: C.text, textAlign: 'right', wordBreak: 'break-word' }}>{row!.value}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button onClick={() => openEdit(detailTx)}
                  style={{ padding: '12px', borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: C.font }}>
                  ✏️ Edit
                </button>
                <button onClick={() => handleDelete(detailTx.id)} disabled={deleting === detailTx.id}
                  style={{ padding: '12px', borderRadius: 12, border: 'none', background: isDark ? '#450a0a' : '#fef2f2', color: '#dc2626', fontSize: 14, fontWeight: 500, cursor: deleting === detailTx.id ? 'not-allowed' : 'pointer', fontFamily: C.font }}>
                  {deleting === detailTx.id ? 'Deleting…' : '🗑 Delete'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── ADD / EDIT DRAWER ─────────────────────────── */}
      <div onClick={() => setDrawerOpen(false)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', zIndex: 40, opacity: drawerOpen ? 1 : 0, pointerEvents: drawerOpen ? 'auto' : 'none', transition: 'opacity 0.25s' }} />

      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, background: C.card, zIndex: 50, boxShadow: '-4px 0 40px rgba(0,0,0,0.3)', transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)', display: 'flex', flexDirection: 'column', fontFamily: C.font }}>
        <div style={{ padding: '24px 24px 16px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>{editingId ? 'Edit Transaction' : 'New Transaction'}</h2>
            <button onClick={() => setDrawerOpen(false)} style={{ background: isDark ? '#374151' : '#f3f3f3', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: C.muted }}>✕</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {error && <div style={{ background: isDark ? '#450a0a' : '#fef2f2', border: `1px solid ${isDark ? '#7f1d1d' : '#fecaca'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: 13 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Type */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {['expense', 'income'].map(t => (
                  <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                    style={{ padding: '10px', borderRadius: 10, border: '2px solid', cursor: 'pointer', fontFamily: C.font, fontWeight: 500, fontSize: 14, transition: 'all 0.15s', borderColor: form.type === t ? (t === 'expense' ? '#dc2626' : '#059669') : C.inputBorder, background: form.type === t ? (t === 'expense' ? (isDark ? '#450a0a' : '#fef2f2') : (isDark ? '#064e3b' : '#ecfdf5')) : C.inputBg, color: form.type === t ? (t === 'expense' ? '#dc2626' : '#059669') : C.muted }}>
                    {t === 'expense' ? '↑ Expense' : '↓ Income'}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Amount (KES)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: C.muted }}>KES</span>
                <input ref={amountRef} type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required placeholder="0.00"
                  style={{ width: '100%', padding: '14px 14px 14px 56px', fontSize: 24, fontWeight: 500, fontFamily: C.mono, border: `2px solid ${C.inputBorder}`, borderRadius: 12, outline: 'none', color: C.text, background: C.inputBg, boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                  onFocus={e => (e.target.style.borderColor = '#3b82f6')} onBlur={e => (e.target.style.borderColor = C.inputBorder)} />
              </div>
            </div>

            {/* Category */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Category</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {CATEGORIES.map(c => (
                  <button key={c.label} type="button" onClick={() => setForm(f => ({ ...f, category: c.label }))}
                    style={{ padding: '10px 4px', borderRadius: 10, border: '2px solid', cursor: 'pointer', fontFamily: C.font, fontSize: 11, fontWeight: 500, textAlign: 'center', transition: 'all 0.15s', borderColor: form.category === c.label ? getCategoryColor(c.label) : C.inputBorder, background: form.category === c.label ? getCategoryColor(c.label) + '20' : C.inputBg, color: form.category === c.label ? getCategoryColor(c.label) : C.muted }}>
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{c.icon}</div>{c.label}
                  </button>
                ))}
              </div>
              {form.category === 'Other' && (
                <input value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="e.g. Netflix, Gym..." style={{ ...inputStyle, marginTop: 8 }} />
              )}
            </div>

            {/* Payment + Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Payment</label>
                <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))} style={inputStyle}>
                  <option value="Mpesa">M-Pesa</option><option value="Cash">Cash</option><option value="Bank">Bank</option><option value="Card">Card</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required style={inputStyle} />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Notes <span style={{ fontWeight: 400, color: C.subtle }}>(optional)</span></label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="What was this for?" style={inputStyle} />
            </div>

            {/* Recurring */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '12px', background: isDark ? '#111827' : '#fafafa', borderRadius: 10, border: `1.5px solid ${C.inputBorder}` }}>
              <input type="checkbox" checked={form.is_recurring} onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))} style={{ width: 16, height: 16, cursor: 'pointer' }} />
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: C.text }}>Recurring transaction</p>
                <p style={{ margin: 0, fontSize: 11, color: C.muted }}>Mark if this repeats monthly</p>
              </div>
            </label>

            <button type="submit" disabled={saving}
              style={{ background: saving ? '#6b7280' : (isDark ? '#3b82f6' : '#1a1a1a'), color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: C.font, marginTop: 4 }}>
              {saving ? 'Saving...' : editingId ? 'Update Transaction' : 'Save Transaction'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

