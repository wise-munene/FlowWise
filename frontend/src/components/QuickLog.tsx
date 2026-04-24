// import { useState } from 'react'
// import { useTheme } from '../context/ThemeContext'
// import api from '../api/axios'

// interface Props {
//   onSaved: () => void
//   defaultType?: 'income' | 'expense'
// }

// const INCOME_SOURCES = [
//   { label: 'Salary',     icon: '💼' },
//   { label: 'Freelance',  icon: '💻' },
//   { label: 'Business',   icon: '🏪' },
//   { label: 'M-Pesa',     icon: '📱' },
//   { label: 'Chama',      icon: '👥' },
//   { label: 'Other',      icon: '💰' },
// ]
// const EXPENSE_CATS = [
//   { label: 'Rent',          icon: '🏠' },
//   { label: 'Groceries',     icon: '🛒' },
//   { label: 'Transport',     icon: '🚗' },
//   { label: 'Utilities',     icon: '💡' },
//   { label: 'Healthcare',    icon: '🏥' },
//   { label: 'Entertainment', icon: '🎬' },
//   { label: 'Other',         icon: '📦' },
// ]

// export default function QuickLog({ onSaved, defaultType = 'income' }: Props) {
//   const { isDark } = useTheme()
//   const [open, setOpen]         = useState(false)
//   const [type, setType]         = useState<'income' | 'expense'>(defaultType)
//   const [amount, setAmount]     = useState('')
//   const [category, setCategory] = useState(defaultType === 'income' ? 'Salary' : 'Rent')
//   const [notes, setNotes]       = useState('')
//   const [date, setDate]         = useState(new Date().toISOString().split('T')[0])
//   const [saving, setSaving]     = useState(false)
//   const [error, setError]       = useState('')

//   const C = {
//     overlay: 'rgba(0,0,0,0.55)',
//     panel:   isDark ? '#1f2937' : '#ffffff',
//     border:  isDark ? '#374151' : '#e5e7eb',
//     text:    isDark ? '#f9fafb' : '#1a1a1a',
//     muted:   isDark ? '#9ca3af' : '#6b7280',
//     inputBg: isDark ? '#111827' : '#f9fafb',
//     inputBorder: isDark ? '#374151' : '#d1d5db',
//     cats:    type === 'income' ? INCOME_SOURCES : EXPENSE_CATS,
//   }

//   const inputStyle: React.CSSProperties = {
//     width: '100%', padding: '10px 14px', border: `1.5px solid ${C.inputBorder}`,
//     borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none',
//     color: C.text, background: C.inputBg, boxSizing: 'border-box', transition: 'border-color 0.15s',
//   }

//   const handleTypeSwitch = (t: 'income' | 'expense') => {
//     setType(t)
//     setCategory(t === 'income' ? 'Salary' : 'Rent')
//     setError('')
//   }

//   const handleSave = async () => {
//     if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount'); return }
//     setSaving(true); setError('')
//     try {
//       await api.post('/transactions/', {
//         type, amount: parseFloat(amount), category, notes, date,
//         payment_method: type === 'income' ? 'Bank' : 'Mpesa',
//       })
//       setAmount(''); setNotes(''); setError('')
//       setOpen(false)
//       onSaved()
//     } catch (err: any) {
//       setError(err.response?.data?.error || 'Failed to save')
//     } finally { setSaving(false) }
//   }

//   return (
//     <>
//       {/* Trigger button — can be used inline on dashboard */}
//       <button onClick={() => { setType(defaultType); setOpen(true) }}
//         style={{
//           background: defaultType === 'income' ? '#059669' : '#2563eb',
//           color: '#fff', border: 'none', borderRadius: 12, padding: '10px 18px',
//           fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
//           display: 'flex', alignItems: 'center', gap: 6, transition: 'opacity 0.15s',
//         }}
//         onMouseOver={e => (e.currentTarget.style.opacity = '0.85')}
//         onMouseOut={e => (e.currentTarget.style.opacity = '1')}>
//         {defaultType === 'income' ? '↓ Log income' : '↑ Log expense'}
//       </button>

//       {/* Modal */}
//       {open && (
//         <div onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
//           style={{ position: 'fixed', inset: 0, background: C.overlay, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
//           <div style={{ background: C.panel, borderRadius: 20, width: '100%', maxWidth: 420, padding: 24, fontFamily: "'Inter', sans-serif" }}>

//             {/* Header */}
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
//               <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: C.text }}>Quick log</h2>
//               <button onClick={() => setOpen(false)}
//                 style={{ background: isDark ? '#374151' : '#f3f4f6', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: C.muted, fontSize: 16 }}>✕</button>
//             </div>

//             {/* Type toggle */}
//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
//               {(['income', 'expense'] as const).map(t => (
//                 <button key={t} onClick={() => handleTypeSwitch(t)}
//                   style={{
//                     padding: '10px', borderRadius: 10, border: '2px solid', cursor: 'pointer',
//                     fontFamily: 'inherit', fontWeight: 500, fontSize: 14, transition: 'all 0.15s',
//                     borderColor: type === t ? (t === 'income' ? '#059669' : '#dc2626') : C.inputBorder,
//                     background: type === t ? (t === 'income' ? (isDark ? '#064e3b' : '#ecfdf5') : (isDark ? '#450a0a' : '#fef2f2')) : C.inputBg,
//                     color: type === t ? (t === 'income' ? '#059669' : '#dc2626') : C.muted,
//                   }}>
//                   {t === 'income' ? '↓ Income' : '↑ Expense'}
//                 </button>
//               ))}
//             </div>

//             {/* Amount — big and central */}
//             <div style={{ position: 'relative', marginBottom: 16 }}>
//               <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: C.muted, fontFamily: "'JetBrains Mono', monospace" }}>KES</span>
//               <input
//                 autoFocus
//                 type="number" min="0" step="1" value={amount}
//                 onChange={e => setAmount(e.target.value)}
//                 placeholder="0"
//                 style={{ ...inputStyle, paddingLeft: 58, fontSize: 28, fontWeight: 500, fontFamily: "'JetBrains Mono', monospace" }}
//                 onFocus={e => (e.target.style.borderColor = type === 'income' ? '#059669' : '#dc2626')}
//                 onBlur={e => (e.target.style.borderColor = C.inputBorder)}
//               />
//             </div>

//             {/* Category grid */}
//             <div style={{ marginBottom: 16 }}>
//               <p style={{ fontSize: 11, fontWeight: 500, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
//                 {type === 'income' ? 'Source' : 'Category'}
//               </p>
//               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
//                 {C.cats.map(c => {
//                   const sel = category === c.label
//                   const accent = type === 'income' ? '#059669' : '#2563eb'
//                   return (
//                     <button key={c.label} onClick={() => setCategory(c.label)}
//                       style={{
//                         padding: '8px 4px', borderRadius: 10, border: '1.5px solid', cursor: 'pointer',
//                         fontFamily: 'inherit', fontSize: 11, fontWeight: 500, textAlign: 'center',
//                         borderColor: sel ? accent : C.inputBorder,
//                         background: sel ? accent + '20' : C.inputBg,
//                         color: sel ? accent : C.muted, transition: 'all 0.12s',
//                       }}>
//                       <div style={{ fontSize: 18, marginBottom: 2 }}>{c.icon}</div>
//                       {c.label}
//                     </button>
//                   )
//                 })}
//               </div>
//             </div>

//             {/* Date + Notes row */}
//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 10, marginBottom: 16 }}>
//               <div>
//                 <p style={{ fontSize: 11, fontWeight: 500, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Date</p>
//                 <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
//               </div>
//               <div>
//                 <p style={{ fontSize: 11, fontWeight: 500, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Notes (optional)</p>
//                 <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="What's this for?" style={inputStyle} />
//               </div>
//             </div>

//             {error && (
//               <div style={{ background: isDark ? '#450a0a' : '#fef2f2', border: `1px solid ${isDark ? '#7f1d1d' : '#fecaca'}`, borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: '#dc2626' }}>
//                 {error}
//               </div>
//             )}

//             <button onClick={handleSave} disabled={saving}
//               style={{
//                 width: '100%', padding: 14, borderRadius: 12, border: 'none',
//                 background: saving ? '#6b7280' : type === 'income' ? '#059669' : '#2563eb',
//                 color: '#fff', fontSize: 15, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer',
//                 fontFamily: 'inherit', transition: 'background 0.15s',
//               }}>
//               {saving ? 'Saving...' : `Save ${type}`}
//             </button>
//           </div>
//         </div>
//       )}
//     </>
//   )
// }
