import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import api from '../api/axios'

type MpesaAccount = {
  id: number
  account_type: 'till' | 'paybill'
  shortcode: string
  account_name?: string
}

type Budget = {
  id: number
  category: string
  budget_amount: number
  spent_amount: number
  percentage_used: number
  is_exceeded: boolean
  is_near_limit: boolean
}

const PRESET_CATEGORIES = [
  { label: 'Groceries', icon: '🛒' },
  { label: 'Transport', icon: '🚗' },
  { label: 'Utilities', icon: '💡' },
  { label: 'Rent', icon: '🏠' },
  { label: 'Healthcare', icon: '🏥' },
  { label: 'Entertainment', icon: '🎬' },
  { label: 'Other', icon: '📦' },
]

type DrawerMode = 'pay' | 'add-account' | null

export default function Mpesa() {
  const [accounts, setAccounts] = useState<MpesaAccount[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMsg, setStatusMsg] = useState('')
  const [saving, setSaving] = useState(false)

  // Payment form
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'till' | 'paybill'>('till')
  const [selectedShortcode, setSelectedShortcode] = useState('')
  const [accountRef, setAccountRef] = useState('')
  const [description, setDescription] = useState('')

  // Budget linking — the core of this feature
  const [budgetLinkMode, setBudgetLinkMode] = useState<'existing' | 'custom'>('existing')
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [presetCategory, setPresetCategory] = useState('Other')

  // Add account form
  const [newAccountType, setNewAccountType] = useState<'till' | 'paybill'>('till')
  const [newShortcode, setNewShortcode] = useState('')
  const [newAccountName, setNewAccountName] = useState('')

  useEffect(() => {
    fetchAccounts()
    fetchBudgets()
  }, [])

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/mpesa/accounts')
      setAccounts(res.data)
    } catch (err) { console.error(err) }
  }

  const fetchBudgets = async () => {
    try {
      const res = await api.get('/budgets/')
      setBudgets(res.data)
    } catch (err) { console.error(err) }
  }

  // Resolve the final category to link to — the key logic
  const getFinalCategory = (): string => {
    if (budgetLinkMode === 'existing') {
      return selectedBudgetCategory
    }
    // Custom mode: use typed custom name if given, otherwise fall back to preset
    return customCategory.trim() || presetCategory
  }

  const handleRecordPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setStatus('error')
      setStatusMsg('Please enter a valid amount')
      return
    }

    const finalCategory = getFinalCategory()
    if (!finalCategory) {
      setStatus('error')
      setStatusMsg('Please select or enter a category')
      return
    }

    setSaving(true)
    setStatus('idle')

    try {
      await api.post('/transactions/', {
        type: 'expense',
        amount: parseFloat(amount),
        category: finalCategory,
        payment_method: 'Mpesa',
        payment_channel: paymentMethod,
        till_number: paymentMethod === 'till' ? selectedShortcode || null : null,
        paybill_number: paymentMethod === 'paybill' ? selectedShortcode || null : null,
        account_reference: paymentMethod === 'paybill' ? accountRef || null : null,
        date: new Date().toISOString().split('T')[0],
        notes: description,
      })

      setStatus('success')
      setStatusMsg(`KES ${parseFloat(amount).toLocaleString()} recorded under "${finalCategory}"`)

      // Reset
      setAmount('')
      setDescription('')
      setAccountRef('')
      setSelectedShortcode('')
      setCustomCategory('')
      setDrawerMode(null)

      // Refresh budgets so the UI reflects updated spent_amount
      fetchBudgets()
    } catch (err: any) {
      setStatus('error')
      setStatusMsg(err.response?.data?.error || 'Failed to record payment')
    } finally {
      setSaving(false)
    }
  }

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/mpesa/accounts', {
        account_type: newAccountType,
        shortcode: newShortcode,
        account_name: newAccountType === 'paybill' ? newAccountName : '',
      })
      fetchAccounts()
      setNewShortcode('')
      setNewAccountName('')
      setDrawerMode(null)
    } catch (err: any) {
      setStatus('error')
      setStatusMsg(err.response?.data?.error || 'Failed to add account')
    }
  }

  const handleDeleteAccount = async (id: number) => {
    if (!confirm('Remove this account?')) return
    try {
      await api.delete(`/mpesa/accounts/${id}`)
      fetchAccounts()
    } catch (err) { console.error(err) }
  }

  const openPay = () => {
    setStatus('idle')
    setBudgetLinkMode(budgets.length > 0 ? 'existing' : 'custom')
    setSelectedBudgetCategory(budgets.length > 0 ? budgets[0].category : '')
    setDrawerMode('pay')
  }

  const relevantAccounts = accounts.filter(a => a.account_type === paymentMethod)

  return (
    <div className="min-h-screen" style={{ background: '#f8f7f4', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontWeight: 500, fontSize: 28, color: '#1a1a1a', letterSpacing: '-0.5px', margin: 0 }}>M-Pesa</h1>
            <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>Record payments & manage accounts</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setDrawerMode('add-account')}
              style={{
                background: '#fff', color: '#1a1a1a', border: '1.5px solid #e0e0e0',
                borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              }}
            >
              + Add Account
            </button>
            <button
              onClick={openPay}
              style={{
                background: '#16a34a', color: '#fff', border: 'none',
                borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              }}
            >
               Record Payment
            </button>
          </div>
        </div>

        {/* Success / error toast */}
        {status !== 'idle' && (
          <div style={{
            padding: '12px 16px', borderRadius: 12, marginBottom: 24, fontSize: 14,
            background: status === 'success' ? '#ecfdf5' : '#fef2f2',
            color: status === 'success' ? '#059669' : '#dc2626',
            border: `1px solid ${status === 'success' ? '#a7f3d0' : '#fecaca'}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{status === 'success' ? '✓ ' : '⚠ '}{statusMsg}</span>
            <button onClick={() => setStatus('idle')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 16 }}>✕</button>
          </div>
        )}

        {/* Budget overview */}
        {budgets.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 14, fontWeight: 500, color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Budget Tracker</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {budgets.map(b => {
                const pct = Math.min(b.percentage_used, 100)
                const barColor = b.is_exceeded ? '#dc2626' : b.is_near_limit ? '#f59e0b' : '#16a34a'
                return (
                  <div key={b.id} style={{ background: '#fff', borderRadius: 14, padding: '16px', border: '1.5px solid #ebebeb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{b.category}</span>
                      {b.is_exceeded && <span style={{ fontSize: 10, background: '#fef2f2', color: '#dc2626', padding: '2px 7px', borderRadius: 20, fontWeight: 500 }}>OVER</span>}
                      {b.is_near_limit && !b.is_exceeded && <span style={{ fontSize: 10, background: '#fffbeb', color: '#d97706', padding: '2px 7px', borderRadius: 20, fontWeight: 500 }}>NEAR</span>}
                    </div>
                    <div style={{ height: 5, background: '#f0f0f0', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 10, transition: 'width 0.4s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#999', fontFamily: "'DM Mono'" }}>KES {b.spent_amount.toLocaleString()}</span>
                      <span style={{ fontSize: 12, color: '#bbb', fontFamily: "'DM Mono'" }}>/ {b.budget_amount.toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Linked accounts */}
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 500, color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Linked Accounts</h2>
          {accounts.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, border: '1.5px dashed #e0e0e0', padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📱</div>
              <p style={{ color: '#aaa', fontSize: 14, margin: '0 0 12px' }}>No accounts linked yet</p>
              <button onClick={() => setDrawerMode('add-account')} style={{ background: 'none', border: 'none', color: '#16a34a', fontWeight: 500, fontSize: 14, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                + Link your first account →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {accounts.map(acc => (
                <div key={acc.id} style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #ebebeb', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                      {acc.account_type === 'till' ? '🏪' : '🏢'}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>
                        {acc.account_name || acc.shortcode}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: '#999' }}>
                        {acc.account_type === 'till' ? 'Till' : 'Paybill'} · {acc.shortcode}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteAccount(acc.id)} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 13, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overlay */}
      <div
        onClick={() => setDrawerMode(null)}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(2px)', zIndex: 40,
          opacity: drawerMode ? 1 : 0,
          pointerEvents: drawerMode ? 'auto' : 'none',
          transition: 'opacity 0.25s',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: drawerMode === 'pay' ? 460 : 380,
        background: '#fff', zIndex: 50,
        boxShadow: '-4px 0 40px rgba(0,0,0,0.1)',
        transform: drawerMode ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Inter', sans-serif",
      }}>

        {/* Drawer header */}
        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 500, color: '#1a1a1a' }}>
            {drawerMode === 'pay' ? ' Record M-Pesa Payment' : ' Add M-Pesa Account'}
          </h2>
          <button onClick={() => setDrawerMode(null)} style={{ background: '#f3f3f3', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 14, color: '#555' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* ── PAY FORM ── */}
          {drawerMode === 'pay' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Amount */}
              <div>
                <label style={labelStyle}>Amount (KES)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#aaa', fontFamily: "'DM Mono'" }}>KES</span>
                  <input
                    autoFocus
                    type="number" min="0" step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    style={{ ...inputStyle, paddingLeft: 56, fontSize: 26, fontWeight: 500, fontFamily: "'Inter', sans-serif", }}
                  />
                </div>
              </div>

              {/* Payment method */}
              <div>
                <label style={labelStyle}>Payment via</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {(['till', 'paybill'] as const).map(m => (
                    <button key={m} type="button" onClick={() => { setPaymentMethod(m); setSelectedShortcode('') }}
                      style={{
                        ...toggleBtnStyle,
                        borderColor: paymentMethod === m ? '#16a34a' : '#e5e5e5',
                        background: paymentMethod === m ? '#ecfdf5' : '#fff',
                        color: paymentMethod === m ? '#16a34a' : '#888',
                      }}>
                      {m === 'till' ? '🏪 Till (Buy Goods)' : '🏢 Paybill'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account selector (if accounts exist for this method) */}
              {relevantAccounts.length > 0 && (
                <div>
                  <label style={labelStyle}>Select Account <span style={{ fontWeight: 400, color: '#aaa' }}>(optional)</span></label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {relevantAccounts.map(acc => (
                      <button key={acc.id} type="button"
                        onClick={() => setSelectedShortcode(acc.shortcode)}
                        style={{
                          ...toggleBtnStyle, textAlign: 'left', padding: '10px 14px',
                          display: 'flex', justifyContent: 'space-between',
                          borderColor: selectedShortcode === acc.shortcode ? '#16a34a' : '#e5e5e5',
                          background: selectedShortcode === acc.shortcode ? '#ecfdf5' : '#fff',
                          color: '#1a1a1a',
                        }}>
                        <span style={{ fontWeight: 500 }}>{acc.account_name || acc.shortcode}</span>
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#999' }}>{acc.shortcode}</span>
                      </button>
                    ))}
                    <button type="button" onClick={() => setSelectedShortcode('')}
                      style={{ ...toggleBtnStyle, color: '#888', borderColor: !selectedShortcode ? '#1a1a1a' : '#e5e5e5', background: !selectedShortcode ? '#f5f5f5' : '#fff' }}>
                      Enter manually
                    </button>
                  </div>
                </div>
              )}

              {/* Manual shortcode if needed */}
              {(!selectedShortcode || relevantAccounts.length === 0) && (
                <div>
                  <label style={labelStyle}>{paymentMethod === 'till' ? 'Till Number' : 'Paybill Number'}</label>
                  <input
                    value={selectedShortcode}
                    onChange={e => setSelectedShortcode(e.target.value)}
                    placeholder={paymentMethod === 'till' ? 'e.g. 123456' : 'e.g. 400200'}
                    style={inputStyle}
                  />
                </div>
              )}

              {paymentMethod === 'paybill' && (
                <div>
                  <label style={labelStyle}>Account Reference</label>
                  <input value={accountRef} onChange={e => setAccountRef(e.target.value)}
                    placeholder="Your account number" style={inputStyle} />
                </div>
              )}

              {/* Description */}
              <div>
                <label style={labelStyle}>Description <span style={{ fontWeight: 400, color: '#aaa' }}>(optional)</span></label>
                <input value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="What was this payment for?" style={inputStyle} />
              </div>

              {/* ━━━ BUDGET LINKING — the core feature ━━━ */}
              <div style={{ background: '#f9f9f9', borderRadius: 14, padding: 18, border: '1.5px solid #ebebeb' }}>
                <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>
                  📊 Link to Budget
                </p>
                <p style={{ margin: '0 0 12px', fontSize: 12, color: '#888' }}>
                  Choose which budget this payment counts against. This automatically updates your spending tracker.
                </p>

                {/* Mode toggle */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  <button type="button"
                    onClick={() => { setBudgetLinkMode('existing'); if (budgets.length > 0) setSelectedBudgetCategory(budgets[0].category) }}
                    style={{
                      ...toggleBtnStyle, fontSize: 12,
                      borderColor: budgetLinkMode === 'existing' ? '#2563eb' : '#e5e5e5',
                      background: budgetLinkMode === 'existing' ? '#eff6ff' : '#fff',
                      color: budgetLinkMode === 'existing' ? '#2563eb' : '#888',
                      opacity: budgets.length === 0 ? 0.4 : 1,
                    }}
                    disabled={budgets.length === 0}
                  >
                    Existing budget
                  </button>
                  <button type="button"
                    onClick={() => setBudgetLinkMode('custom')}
                    style={{
                      ...toggleBtnStyle, fontSize: 12,
                      borderColor: budgetLinkMode === 'custom' ? '#2563eb' : '#e5e5e5',
                      background: budgetLinkMode === 'custom' ? '#eff6ff' : '#fff',
                      color: budgetLinkMode === 'custom' ? '#2563eb' : '#888',
                    }}>
                    Custom / new category
                  </button>
                </div>

                {/* Existing budget picker */}
                {budgetLinkMode === 'existing' && budgets.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {budgets.map(b => {
                      const pct = Math.min(b.percentage_used, 100)
                      const isSelected = selectedBudgetCategory === b.category
                      return (
                        <button key={b.id} type="button"
                          onClick={() => setSelectedBudgetCategory(b.category)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 12px', borderRadius: 10, border: '1.5px solid', cursor: 'pointer',
                            fontFamily: 'inherit', background: isSelected ? '#eff6ff' : '#fff',
                            borderColor: isSelected ? '#2563eb' : '#e5e5e5', transition: 'all 0.12s',
                          }}>
                          <div style={{ textAlign: 'left' }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{b.category}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#999', fontFamily: "'Inter', sans-serif",}}>
                              KES {b.spent_amount.toLocaleString()} / {b.budget_amount.toLocaleString()} · {pct.toFixed(0)}% used
                            </p>
                          </div>
                          <div style={{ width: 48, textAlign: 'right' }}>
                            {b.is_exceeded && <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 500 }}>OVER</span>}
                            {b.is_near_limit && !b.is_exceeded && <span style={{ fontSize: 10, color: '#d97706', fontWeight: 500 }}>NEAR</span>}
                            {!b.is_exceeded && !b.is_near_limit && <span style={{ fontSize: 11, color: '#16a34a' }}>✓</span>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Custom category */}
                {budgetLinkMode === 'custom' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
                      Pick a preset or type your own. If a budget with this name exists, it will be updated automatically.
                    </p>
                    {/* Preset chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {PRESET_CATEGORIES.map(c => (
                        <button key={c.label} type="button"
                          onClick={() => { setPresetCategory(c.label); setCustomCategory('') }}
                          style={{
                            padding: '5px 12px', borderRadius: 20, border: '1.5px solid', cursor: 'pointer',
                            fontSize: 12, fontFamily: "'Inter', sans-serif", transition: 'all 0.12s',
                            borderColor: presetCategory === c.label && !customCategory ? '#2563eb' : '#e5e5e5',
                            background: presetCategory === c.label && !customCategory ? '#eff6ff' : '#fff',
                            color: presetCategory === c.label && !customCategory ? '#2563eb' : '#666',
                          }}>
                          {c.icon} {c.label}
                        </button>
                      ))}
                    </div>
                    {/* Free text override */}
                    <input
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value)}
                      placeholder="Or type a custom name, e.g. 'Netflix', 'School Fees'..."
                      style={{ ...inputStyle, fontSize: 13 }}
                    />
                    {customCategory.trim() && budgets.some(b => b.category.toLowerCase() === customCategory.trim().toLowerCase()) && (
                      <div style={{ background: '#eff6ff', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#2563eb' }}>
                        ✓ Matches your existing <strong>"{budgets.find(b => b.category.toLowerCase() === customCategory.trim().toLowerCase())?.category}"</strong> budget — spending will be updated automatically.
                      </div>
                    )}
                    <p style={{ margin: 0, fontSize: 11, color: '#aaa' }}>
                      Final category: <strong style={{ color: '#1a1a1a' }}>{customCategory.trim() || presetCategory}</strong>
                    </p>
                  </div>
                )}
              </div>

              {/* Confirmation hint */}
              <div style={{ background: '#fffbeb', borderRadius: 10, padding: '10px 14px', border: '1px solid #fde68a' }}>
                <p style={{ margin: 0, fontSize: 12, color: '#92400e' }}>
                  💡 Make the M-Pesa payment on your phone first, then tap <strong>I've Paid</strong> to record it here.
                </p>
              </div>

              {/* Submit */}
              <button
                onClick={handleRecordPayment}
                disabled={saving}
                style={{
                  background: saving ? '#aaa' : '#16a34a', color: '#fff', border: 'none',
                  borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 500,
                  cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif",
                  transition: 'background 0.15s',
                }}
              >
                {saving ? 'Recording...' : "✓ I've Paid — Record Transaction"}
              </button>
            </div>
          )}

          {/* ── ADD ACCOUNT FORM ── */}
          {drawerMode === 'add-account' && (
            <form onSubmit={handleAddAccount} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>Account Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {(['till', 'paybill'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setNewAccountType(t)}
                      style={{
                        ...toggleBtnStyle,
                        borderColor: newAccountType === t ? '#16a34a' : '#e5e5e5',
                        background: newAccountType === t ? '#ecfdf5' : '#fff',
                        color: newAccountType === t ? '#16a34a' : '#888',
                      }}>
                      {t === 'till' ? '🏪 Till' : '🏢 Paybill'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>{newAccountType === 'till' ? 'Till Number' : 'Paybill Number'}</label>
                <input value={newShortcode} onChange={e => setNewShortcode(e.target.value)}
                  placeholder={newAccountType === 'till' ? 'e.g. 123456' : 'e.g. 400200'}
                  required style={inputStyle} />
              </div>
              {newAccountType === 'paybill' && (
                <div>
                  <label style={labelStyle}>Account Name</label>
                  <input value={newAccountName} onChange={e => setNewAccountName(e.target.value)}
                    placeholder="e.g. KPLC, Nairobi Water" required style={inputStyle} />
                </div>
              )}
              <button type="submit" style={{
                background: '#1a1a1a', color: '#fff', border: 'none',
                borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 500,
                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              }}>
                Link Account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Shared styles ──
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#555',
  textTransform: 'uppercase', letterSpacing: '0.5px',
  display: 'block', marginBottom: 8,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  border: '2px solid #e5e5e5', borderRadius: 10,
  fontSize: 14, fontFamily: "'DM Sans', sans-serif",
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s', color: '#1a1a1a',
  background: '#fff',
}

const toggleBtnStyle: React.CSSProperties = {
  padding: '11px 14px', borderRadius: 10, border: '2px solid',
  cursor: 'pointer', fontFamily: "'Inter', sans-serif",
  fontWeight: 500, fontSize: 13, transition: 'all 0.15s',
  textAlign: 'center' as const,
}