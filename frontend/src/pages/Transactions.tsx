import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import api from '../api/axios'

interface Transaction {
  id: number
  type: string
  category: string
  amount: number
  date: string
  notes: string
  is_recurring: boolean
  payment_method: string
  payment_channel?: string
}

const CATEGORIES = [
  { label: 'Groceries', icon: '🛒' },
  { label: 'Transport', icon: '🚗' },
  { label: 'Utilities', icon: '💡' },
  { label: 'Rent', icon: '🏠' },
  { label: 'Healthcare', icon: '🏥' },
  { label: 'Entertainment', icon: '🎬' },
  { label: 'Salary', icon: '💼' },
  { label: 'Sales', icon: '📈' },
  { label: 'Salaries', icon: '👥' },
  { label: 'Other', icon: '📦' },
]

const CATEGORY_COLORS: Record<string, string> = {
  Groceries: '#10b981', Transport: '#3b82f6', Utilities: '#f59e0b',
  Rent: '#8b5cf6', Healthcare: '#ef4444', Entertainment: '#06b6d4',
  Salary: '#10b981', Sales: '#3b82f6', Salaries: '#8b5cf6', Other: '#6b7280',
}

const defaultForm = {
  type: 'expense',
  category: 'Other',
  payment_method: 'Mpesa',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
  is_recurring: false,
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [saving, setSaving] = useState(false)
  const amountRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState(defaultForm)

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions/')
      setTransactions(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTransactions() }, [])

  useEffect(() => {
    if (drawerOpen) setTimeout(() => amountRef.current?.focus(), 100)
  }, [drawerOpen])

  const openNew = () => {
    setForm(defaultForm)
    setCustomCategory('')
    setEditingId(null)
    setError('')
    setDrawerOpen(true)
  }

  const openEdit = (t: Transaction) => {
    setForm({
      type: t.type,
      category: t.category,
      payment_method: t.payment_method,
      amount: String(t.amount),
      date: t.date,
      notes: t.notes || '',
      is_recurring: t.is_recurring,
    })
    setEditingId(t.id)
    setError('')
    setDrawerOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    const finalCategory = form.category === 'Other' && customCategory.trim()
      ? customCategory.trim()
      : form.category

    try {
      if (editingId) {
        await api.put(`/transactions/${editingId}`, { ...form, category: finalCategory })
      } else {
        await api.post('/transactions/', { ...form, category: finalCategory })
      }
      setDrawerOpen(false)
      fetchTransactions()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this transaction?')) return
    try {
      await api.delete(`/transactions/${id}`)
      fetchTransactions()
    } catch (err) { console.error(err) }
  }

  const filtered = transactions.filter(t => {
    const matchType = filterType === 'all' || t.type === filterType
    const matchSearch = !search || t.category.toLowerCase().includes(search.toLowerCase()) ||
      (t.notes || '').toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const getCategoryIcon = (cat: string) => CATEGORIES.find(c => c.label === cat)?.icon ?? '📦'
  const getCategoryColor = (cat: string) => CATEGORY_COLORS[cat] ?? '#6b7280'

  return (
    <div className="min-h-screen" style={{ background: '#f8f7f4', fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 28, color: '#1a1a1a', letterSpacing: '-0.5px' }}>
              Transactions
            </h1>
            <p style={{ color: '#888', fontSize: 14, marginTop: 2 }}>
              {transactions.length} total · {new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={openNew}
            style={{
              background: '#1a1a1a', color: '#fff', border: 'none',
              borderRadius: 12, padding: '10px 20px', fontSize: 14,
              fontWeight: 500, cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 6, fontFamily: "'Inter', sans-serif",
              transition: 'transform 0.1s, background 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#333')}
            onMouseOut={e => (e.currentTarget.style.background = '#1a1a1a')}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add transaction
          </button>
        </div>

        {/* Summary strip */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Income', value: totalIncome, color: '#059669', bg: '#ecfdf5' },
            { label: 'Expenses', value: totalExpense, color: '#dc2626', bg: '#fef2f2' },
            { label: 'Net', value: totalIncome - totalExpense, color: totalIncome - totalExpense >= 0 ? '#2563eb' : '#dc2626', bg: '#eff6ff' },
          ].map(item => (
            <div key={item.label} style={{ background: item.bg, borderRadius: 14, padding: '16px 20px' }}>
              <p style={{ fontSize: 12, color: '#666', fontWeight: 500, marginBottom: 4 }}>{item.label}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: item.color, fontFamily: "'Inter', sans-serif",}}>
                KES {Math.abs(item.value).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: 14 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search transactions..."
              style={{
                width: '100%', padding: '9px 12px 9px 36px',
                border: '1.5px solid #e5e5e5', borderRadius: 10,
                fontSize: 13, background: '#fff', outline: 'none',
                fontFamily:"'Inter', sans-serif", boxSizing: 'border-box',
              }}
            />
          </div>
          {(['all', 'income', 'expense'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              style={{
                padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                border: '1.5px solid', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
                borderColor: filterType === f ? '#1a1a1a' : '#e5e5e5',
                background: filterType === f ? '#1a1a1a' : '#fff',
                color: filterType === f ? '#fff' : '#555',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Transaction list */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #ebebeb', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#aaa', fontSize: 14 }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
              <p style={{ color: '#aaa', fontSize: 14 }}>No transactions found</p>
              <button onClick={openNew} style={{ marginTop: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: "'Inter', sans-serif", }}>
                Add your first transaction →
              </button>
            </div>
          ) : (
            filtered.map((t, i) => (
              <div
                key={t.id}
                style={{
                  display: 'flex', alignItems: 'center', padding: '14px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid #f3f3f3' : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseOver={e => (e.currentTarget.style.background = '#fafafa')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: 12, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  background: getCategoryColor(t.category) + '18', flexShrink: 0, marginRight: 14,
                }}>
                  {getCategoryIcon(t.category)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', margin: 0 }}>{t.category}</p>
                  <p style={{ fontSize: 12, color: '#999', margin: '2px 0 0', display: 'flex', gap: 8 }}>
                    <span>{t.date}</span>
                    {t.payment_method && <span>· {t.payment_method}</span>}
                    {t.notes && <span>· {t.notes}</span>}
                    {t.is_recurring && <span style={{ color: '#8b5cf6' }}>· ↻ recurring</span>}
                  </p>
                </div>

                {/* Amount */}
                <div style={{ textAlign: 'right', marginRight: 16 }}>
                  <p style={{
                    fontSize: 15, fontWeight: 500, margin: 0,
                    fontFamily: "'Inter', sans-serif",
                    color: t.type === 'income' ? '#059669' : '#dc2626',
                  }}>
                    {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString()}
                  </p>
                  <p style={{ fontSize: 11, color: '#ccc', margin: 0 }}>KES</p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => openEdit(t)} style={{
                    background: '#f3f3f3', border: 'none', borderRadius: 8,
                    padding: '5px 10px', fontSize: 12, color: '#555',
                    cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  }}>Edit</button>
                  <button onClick={() => handleDelete(t.id)} style={{
                    background: '#fff0f0', border: 'none', borderRadius: 8,
                    padding: '5px 10px', fontSize: 12, color: '#dc2626',
                    cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                  }}>✕</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Slide-in Drawer */}
      <>
        {/* Overlay */}
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(2px)', zIndex: 40,
            opacity: drawerOpen ? 1 : 0,
            pointerEvents: drawerOpen ? 'auto' : 'none',
            transition: 'opacity 0.25s',
          }}
        />

        {/* Drawer panel */}
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
          background: '#fff', zIndex: 50, boxShadow: '-4px 0 40px rgba(0,0,0,0.1)',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          display: 'flex', flexDirection: 'column',
          fontFamily: "'Inter', sans-serif",
        }}>
          {/* Drawer header */}
          <div style={{ padding: '24px 24px 0', borderBottom: '1px solid #f0f0f0', paddingBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>
                {editingId ? 'Edit Transaction' : 'New Transaction'}
              </h2>
              <button onClick={() => setDrawerOpen(false)} style={{
                background: '#f3f3f3', border: 'none', borderRadius: 8,
                width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#555',
              }}>✕</button>
            </div>
          </div>

          {/* Drawer form */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: 13 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Type toggle */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {['expense', 'income'].map(t => (
                    <button
                      key={t} type="button"
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      style={{
                        padding: '10px', borderRadius: 10, border: '2px solid', cursor: 'pointer',
                        fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 14, transition: 'all 0.15s',
                        borderColor: form.type === t ? (t === 'expense' ? '#dc2626' : '#059669') : '#e5e5e5',
                        background: form.type === t ? (t === 'expense' ? '#fef2f2' : '#ecfdf5') : '#fff',
                        color: form.type === t ? (t === 'expense' ? '#dc2626' : '#059669') : '#999',
                      }}
                    >
                      {t === 'expense' ? '↑ Expense' : '↓ Income'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount — most important, biggest */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Amount (KES)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#aaa', fontFamily: "'Inter', sans-serif" }}>KES</span>
                  <input
                    ref={amountRef}
                    type="number" step="0.01" min="0"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    required
                    placeholder="0.00"
                    style={{
                      width: '100%', padding: '14px 14px 14px 56px',
                      fontSize: 24, fontWeight: 500, fontFamily: "'Inter', sans-serif",
                      border: '2px solid #e5e5e5', borderRadius: 12, outline: 'none',
                      color: '#1a1a1a', boxSizing: 'border-box',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#1a1a1a')}
                    onBlur={e => (e.target.style.borderColor = '#e5e5e5')}
                  />
                </div>
              </div>

              {/* Category grid */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Category</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {CATEGORIES.map(c => (
                    <button
                      key={c.label} type="button"
                      onClick={() => setForm(f => ({ ...f, category: c.label }))}
                      style={{
                        padding: '10px 4px', borderRadius: 10, border: '2px solid',
                        cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: 11,
                        fontWeight: 500, textAlign: 'center', transition: 'all 0.15s',
                        borderColor: form.category === c.label ? getCategoryColor(c.label) : '#e5e5e5',
                        background: form.category === c.label ? getCategoryColor(c.label) + '18' : '#fff',
                        color: form.category === c.label ? getCategoryColor(c.label) : '#777',
                      }}
                    >
                      <div style={{ fontSize: 18, marginBottom: 2 }}>{c.icon}</div>
                      {c.label}
                    </button>
                  ))}
                </div>
                {form.category === 'Other' && (
                  <input
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    placeholder="e.g. Netflix, Gym..."
                    style={{ marginTop: 8, width: '100%', padding: '9px 12px', border: '2px solid #e5e5e5', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  />
                )}
              </div>

              {/* Payment + Date row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Payment</label>
                  <select
                    value={form.payment_method}
                    onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', border: '2px solid #e5e5e5', borderRadius: 10, fontSize: 13, fontFamily: "'Inter', sans-serif", outline: 'none', background: '#fff' }}
                  >
                    <option value="Mpesa">M-Pesa</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Date</label>
                  <input
                    type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '9px 12px', border: '2px solid #e5e5e5', borderRadius: 10, fontSize: 13, fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Notes <span style={{ fontWeight: 500, color: '#aaa' }}>(optional)</span></label>
                <input
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="What was this for?"
                  style={{ width: '100%', padding: '9px 12px', border: '2px solid #e5e5e5', borderRadius: 10, fontSize: 13, fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Recurring */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '12px', background: '#fafafa', borderRadius: 10, border: '1.5px solid #ebebeb' }}>
                <input
                  type="checkbox" checked={form.is_recurring}
                  onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>Recurring transaction</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#999' }}>Mark if this repeats monthly</p>
                </div>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={saving}
                style={{
                  background: saving ? '#999' : '#1a1a1a', color: '#fff',
                  border: 'none', borderRadius: 12, padding: '14px',
                  fontSize: 15, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: "'Inter', sans-serif", marginTop: 4, transition: 'background 0.15s',
                }}
              >
                {saving ? 'Saving...' : editingId ? 'Update Transaction' : 'Save Transaction'}
              </button>
            </form>
          </div>
        </div>
      </>
    </div>
  )
}