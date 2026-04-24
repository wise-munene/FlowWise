import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

type MpesaAccount = { id:number; account_type:'till'|'paybill'; shortcode:string; account_name?:string }
type Budget = { id:number; category:string; budget_amount:number; spent_amount:number; percentage_used:number; is_exceeded:boolean; is_near_limit:boolean }
type DrawerMode = 'pay'|'add-account'|null

const PRESET_CATS = [
  {label:'Groceries',icon:'🛒'},{label:'Transport',icon:'🚗'},{label:'Utilities',icon:'💡'},
  {label:'Rent',icon:'🏠'},{label:'Healthcare',icon:'🏥'},{label:'Entertainment',icon:'🎬'},{label:'Other',icon:'📦'},
]

export default function Mpesa() {
  const { isDark } = useTheme()
  const [accounts, setAccounts]  = useState<MpesaAccount[]>([])
  const [budgets, setBudgets]    = useState<Budget[]>([])
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null)
  const [status, setStatus]      = useState<'idle'|'success'|'error'>('idle')
  const [statusMsg, setStatusMsg] = useState('')
  const [saving, setSaving]      = useState(false)
  const [amount, setAmount]      = useState('')
  const [payMethod, setPayMethod] = useState<'till'|'paybill'>('till')
  const [selShortcode, setSelShortcode] = useState('')
  const [accountRef, setAccountRef] = useState('')
  const [description, setDescription] = useState('')
  const [linkMode, setLinkMode]  = useState<'existing'|'custom'>('existing')
  const [selBudgetCat, setSelBudgetCat] = useState('')
  const [customCat, setCustomCat] = useState('')
  const [presetCat, setPresetCat] = useState('Other')
  const [newAccType, setNewAccType] = useState<'till'|'paybill'>('till')
  const [newShortcode, setNewShortcode] = useState('')
  const [newAccName, setNewAccName] = useState('')

  const C = {
    bg:isDark?'#111827':'#f8f7f4', card:isDark?'#1f2937':'#fff',
    border:isDark?'#374151':'#ebebeb', text:isDark?'#f9fafb':'#1a1a1a',
    muted:isDark?'#9ca3af':'#888', subtle:isDark?'#6b7280':'#aaa',
    inputBg:isDark?'#111827':'#fff', inputBorder:isDark?'#374151':'#e5e5e5',
    font:"'Inter', sans-serif", mono:"'JetBrains Mono', monospace",
    greenBg:isDark?'#064e3b':'#ecfdf5', greenText:isDark?'#34d399':'#059669',
  }
  const iSt:React.CSSProperties = { width:'100%', padding:'11px 14px', border:`2px solid ${C.inputBorder}`, borderRadius:10, fontSize:14, fontFamily:C.font, outline:'none', boxSizing:'border-box', color:C.text, background:C.inputBg }
  const lSt:React.CSSProperties = { fontSize:12, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', display:'block', marginBottom:7 }
  const togBtn = (active:boolean, color='#16a34a'):React.CSSProperties => ({
    padding:'11px 10px', borderRadius:10, border:'2px solid', cursor:'pointer', fontFamily:C.font,
    fontWeight:500, fontSize:13, transition:'all 0.15s', textAlign:'center' as const,
    borderColor:active?color:C.inputBorder, background:active?(isDark?'#064e3b':'#ecfdf5'):C.inputBg, color:active?color:C.muted,
  })

  useEffect(() => { fetchAccounts(); fetchBudgets() }, [])
  const fetchAccounts = async () => { try { const r = await api.get('/mpesa/accounts'); setAccounts(r.data) } catch(e) { console.error(e) } }
  const fetchBudgets  = async () => { try { const r = await api.get('/budgets/'); setBudgets(r.data) } catch(e) { console.error(e) } }

  const getFinalCat = () => linkMode==='existing' ? selBudgetCat : (customCat.trim()||presetCat)

  const handlePay = async () => {
    if(!amount || parseFloat(amount)<=0) { setStatus('error'); setStatusMsg('Enter a valid amount'); return }
    const cat = getFinalCat()
    if(!cat) { setStatus('error'); setStatusMsg('Select a category'); return }
    setSaving(true); setStatus('idle')
    try {
      await api.post('/transactions/', { type:'expense', amount:parseFloat(amount), category:cat, payment_method:'Mpesa', payment_channel:payMethod,
        till_number:payMethod==='till'?selShortcode||null:null, paybill_number:payMethod==='paybill'?selShortcode||null:null,
        account_reference:payMethod==='paybill'?accountRef||null:null, date:new Date().toISOString().split('T')[0], notes:description })
      setStatus('success'); setStatusMsg(`KES ${parseFloat(amount).toLocaleString()} recorded`)
      setAmount(''); setDescription(''); setAccountRef(''); setSelShortcode(''); setCustomCat(''); setDrawerMode(null); fetchBudgets()
    } catch(e:any) { setStatus('error'); setStatusMsg(e.response?.data?.error||'Failed') }
    finally { setSaving(false) }
  }

  const handleAddAcc = async (e:React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/mpesa/accounts', { account_type:newAccType, shortcode:newShortcode, account_name:newAccType==='paybill'?newAccName:'' })
      fetchAccounts(); setNewShortcode(''); setNewAccName(''); setDrawerMode(null)
    } catch(e:any) { setStatus('error'); setStatusMsg(e.response?.data?.error||'Failed to add account') }
  }
  const handleDelAcc = async (id:number) => {
    if(!confirm('Remove this account?')) return
    try { await api.delete(`/mpesa/accounts/${id}`); fetchAccounts() } catch(e) { console.error(e) }
  }
  const openPay = () => {
    setStatus('idle'); setLinkMode(budgets.length>0?'existing':'custom')
    setSelBudgetCat(budgets.length>0?budgets[0].category:''); setDrawerMode('pay')
  }
  const relAccounts = accounts.filter(a=>a.account_type===payMethod)

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:C.font }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <Navbar />

      <div style={{ maxWidth:800, margin:'0 auto', padding:'20px 16px 48px' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, gap:12, flexWrap:'wrap' }}>
          <div>
            <h1 style={{ fontSize:24, fontWeight:600, color:C.text, letterSpacing:'-0.5px', margin:0 }}>M-Pesa</h1>
            <p style={{ color:C.muted, fontSize:13, marginTop:3 }}>Record payments & manage accounts</p>
          </div>
          <div style={{ display:'flex', gap:8, flexShrink:0 }}>
            <button onClick={() => setDrawerMode('add-account')} style={{ background:C.card, color:C.text, border:`1.5px solid ${C.border}`, borderRadius:10, padding:'9px 14px', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:C.font }}>
              + Account
            </button>
            <button onClick={openPay} style={{ background:'#16a34a', color:'#fff', border:'none', borderRadius:10, padding:'9px 18px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>
              ✓ Record
            </button>
          </div>
        </div>

        {/* Toast */}
        {status!=='idle' && (
          <div style={{ padding:'12px 16px', borderRadius:12, marginBottom:20, fontSize:14, background:status==='success'?C.greenBg:(isDark?'#450a0a':'#fef2f2'), color:status==='success'?C.greenText:'#dc2626', border:`1px solid ${status==='success'?(isDark?'#065f46':'#a7f3d0'):(isDark?'#7f1d1d':'#fecaca')}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>{status==='success'?'✓ ':'⚠ '}{statusMsg}</span>
            <button onClick={() => setStatus('idle')} style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', fontSize:18, lineHeight:1 }}>✕</button>
          </div>
        )}

        {/* Budget overview — auto-fill grid, compact */}
        {budgets.length>0 && (
          <div style={{ marginBottom:24 }}>
            <h2 style={{ fontSize:13, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>Budget Tracker</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:10 }}>
              {budgets.map(b => {
                const pct = Math.min(b.percentage_used,100)
                const bar = b.is_exceeded?'#dc2626':b.is_near_limit?'#f59e0b':'#16a34a'
                return (
                  <div key={b.id} style={{ background:C.card, borderRadius:14, padding:'14px', border:`1.5px solid ${C.border}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <span style={{ fontSize:13, fontWeight:500, color:C.text }}>{b.category}</span>
                      {b.is_exceeded && <span style={{ fontSize:10, background:isDark?'#450a0a':'#fef2f2', color:'#dc2626', padding:'2px 6px', borderRadius:20, fontWeight:600 }}>OVER</span>}
                      {b.is_near_limit && !b.is_exceeded && <span style={{ fontSize:10, background:isDark?'#422006':'#fffbeb', color:'#d97706', padding:'2px 6px', borderRadius:20, fontWeight:600 }}>NEAR</span>}
                    </div>
                    <div style={{ height:5, background:isDark?'#374151':'#f0f0f0', borderRadius:10, marginBottom:6, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:bar, borderRadius:10, transition:'width 0.4s' }} />
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:11, color:C.muted, fontFamily:C.mono }}>KES {b.spent_amount.toLocaleString()}</span>
                      <span style={{ fontSize:11, color:C.subtle, fontFamily:C.mono }}>/{b.budget_amount.toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Linked accounts */}
        <div>
          <h2 style={{ fontSize:13, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>Linked Accounts</h2>
          {accounts.length===0 ? (
            <div style={{ background:C.card, borderRadius:14, border:`1.5px dashed ${C.border}`, padding:'32px', textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>📱</div>
              <p style={{ color:C.muted, fontSize:14, margin:'0 0 12px' }}>No accounts linked yet</p>
              <button onClick={() => setDrawerMode('add-account')} style={{ background:'none', border:'none', color:'#16a34a', fontWeight:500, fontSize:14, cursor:'pointer', fontFamily:C.font }}>
                + Link your first account →
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {accounts.map(acc => (
                <div key={acc.id} style={{ background:C.card, borderRadius:12, border:`1.5px solid ${C.border}`, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:38, height:38, borderRadius:10, background:C.greenBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                      {acc.account_type==='till'?'🏪':'🏢'}
                    </div>
                    <div>
                      <p style={{ margin:0, fontSize:14, fontWeight:500, color:C.text }}>{acc.account_name||acc.shortcode}</p>
                      <p style={{ margin:0, fontSize:12, color:C.muted }}>{acc.account_type==='till'?'Till':'Paybill'} · {acc.shortcode}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelAcc(acc.id)} style={{ background:'none', border:'none', color:'#dc2626', fontSize:13, cursor:'pointer', fontFamily:C.font, flexShrink:0 }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overlay */}
      <div onClick={() => setDrawerMode(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(2px)', zIndex:40, opacity:drawerMode?1:0, pointerEvents:drawerMode?'auto':'none', transition:'opacity 0.25s' }} />

      {/* Drawer — full width on mobile */}
      <div style={{
        position:'fixed', top:0, right:0, bottom:0,
        width: drawerMode==='pay' ? 'min(460px,100vw)' : 'min(380px,100vw)',
        background:C.card, zIndex:50, boxShadow:'-4px 0 40px rgba(0,0,0,0.3)',
        transform:drawerMode?'translateX(0)':'translateX(100%)',
        transition:'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
        display:'flex', flexDirection:'column', fontFamily:C.font,
      }}>
        <div style={{ padding:'20px 20px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:600, color:C.text }}>
            {drawerMode==='pay'?'✓ Record M-Pesa Payment':'+ Add M-Pesa Account'}
          </h2>
          <button onClick={() => setDrawerMode(null)} style={{ background:isDark?'#374151':'#f3f3f3', border:'none', borderRadius:8, width:30, height:30, cursor:'pointer', fontSize:14, color:C.muted }}>✕</button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:20 }}>
          {drawerMode==='pay' && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              {/* Amount */}
              <div>
                <label style={lSt}>Amount (KES)</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:13, color:C.muted, fontFamily:C.mono }}>KES</span>
                  <input autoFocus type="number" min="0" step="1" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0"
                    style={{ ...iSt, paddingLeft:52, fontSize:28, fontWeight:700, fontFamily:C.mono, color:'#059669' }} />
                </div>
              </div>

              {/* Payment via */}
              <div>
                <label style={lSt}>Payment via</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {(['till','paybill'] as const).map(m => (
                    <button key={m} type="button" onClick={() => { setPayMethod(m); setSelShortcode('') }} style={togBtn(payMethod===m)}>
                      {m==='till'?'🏪 Till':'🏢 Paybill'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account selector */}
              {relAccounts.length>0 && (
                <div>
                  <label style={lSt}>Select Account</label>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {relAccounts.map(acc => (
                      <button key={acc.id} type="button" onClick={() => setSelShortcode(acc.shortcode)}
                        style={{ ...togBtn(selShortcode===acc.shortcode), textAlign:'left', padding:'10px 14px', display:'flex', justifyContent:'space-between', color:C.text }}>
                        <span style={{ fontWeight:500 }}>{acc.account_name||acc.shortcode}</span>
                        <span style={{ fontFamily:C.mono, fontSize:12, color:C.muted }}>{acc.shortcode}</span>
                      </button>
                    ))}
                    <button type="button" onClick={() => setSelShortcode('')} style={togBtn(!selShortcode,'#6b7280')}>Enter manually</button>
                  </div>
                </div>
              )}

              {(!selShortcode||relAccounts.length===0) && (
                <div>
                  <label style={lSt}>{payMethod==='till'?'Till Number':'Paybill Number'}</label>
                  <input value={selShortcode} onChange={e=>setSelShortcode(e.target.value)} placeholder={payMethod==='till'?'e.g. 123456':'e.g. 400200'} style={iSt} />
                </div>
              )}

              {payMethod==='paybill' && (
                <div>
                  <label style={lSt}>Account Reference</label>
                  <input value={accountRef} onChange={e=>setAccountRef(e.target.value)} placeholder="Your account number" style={iSt} />
                </div>
              )}

              <div>
                <label style={lSt}>Description (optional)</label>
                <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="What was this payment for?" style={iSt} />
              </div>

              {/* Budget link */}
              <div style={{ background:isDark?'#111827':'#f9f9f9', borderRadius:14, padding:16, border:`1.5px solid ${C.border}` }}>
                <p style={{ margin:'0 0 4px', fontSize:13, fontWeight:600, color:C.text }}>📊 Link to Budget</p>
                <p style={{ margin:'0 0 12px', fontSize:12, color:C.muted }}>Which budget does this count toward?</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                  <button type="button" disabled={budgets.length===0}
                    onClick={() => { setLinkMode('existing'); if(budgets.length>0) setSelBudgetCat(budgets[0].category) }}
                    style={{ ...togBtn(linkMode==='existing','#2563eb'), fontSize:12, opacity:budgets.length===0?0.4:1 }}>
                    Existing budget
                  </button>
                  <button type="button" onClick={() => setLinkMode('custom')} style={{ ...togBtn(linkMode==='custom','#2563eb'), fontSize:12 }}>
                    Custom category
                  </button>
                </div>

                {linkMode==='existing' && budgets.length>0 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {budgets.map(b => {
                      const isSel = selBudgetCat===b.category
                      return (
                        <button key={b.id} type="button" onClick={() => setSelBudgetCat(b.category)}
                          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:10, border:'1.5px solid', cursor:'pointer', fontFamily:'inherit', background:isSel?(isDark?'#1e3a8a':'#eff6ff'):C.inputBg, borderColor:isSel?'#2563eb':C.inputBorder, transition:'all 0.12s' }}>
                          <div style={{ textAlign:'left' }}>
                            <p style={{ margin:0, fontSize:13, fontWeight:600, color:C.text }}>{b.category}</p>
                            <p style={{ margin:'2px 0 0', fontSize:11, color:C.muted, fontFamily:C.mono }}>KES {b.spent_amount.toLocaleString()} / {b.budget_amount.toLocaleString()} · {Math.min(b.percentage_used,100).toFixed(0)}%</p>
                          </div>
                          {b.is_exceeded && <span style={{ fontSize:10, color:'#dc2626', fontWeight:500 }}>OVER</span>}
                          {b.is_near_limit && !b.is_exceeded && <span style={{ fontSize:10, color:'#d97706', fontWeight:500 }}>NEAR</span>}
                        </button>
                      )
                    })}
                  </div>
                )}

                {linkMode==='custom' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {PRESET_CATS.map(c => (
                        <button key={c.label} type="button" onClick={() => { setPresetCat(c.label); setCustomCat('') }}
                          style={{ padding:'5px 11px', borderRadius:20, border:'1.5px solid', cursor:'pointer', fontSize:12, fontFamily:C.font, transition:'all 0.12s',
                            borderColor:presetCat===c.label&&!customCat?'#2563eb':C.inputBorder,
                            background:presetCat===c.label&&!customCat?(isDark?'#1e3a8a':'#eff6ff'):C.inputBg,
                            color:presetCat===c.label&&!customCat?'#2563eb':C.muted }}>
                          {c.icon} {c.label}
                        </button>
                      ))}
                    </div>
                    <input value={customCat} onChange={e=>setCustomCat(e.target.value)} placeholder="Or type a custom name..." style={{ ...iSt, fontSize:13 }} />
                  </div>
                )}
              </div>

              <div style={{ background:isDark?'#422006':'#fffbeb', borderRadius:10, padding:'10px 14px', border:`1px solid ${isDark?'#78350f':'#fde68a'}` }}>
                <p style={{ margin:0, fontSize:12, color:isDark?'#fcd34d':'#92400e' }}>
                  💡 Make the M-Pesa payment on your phone first, then tap <strong>Record</strong> here.
                </p>
              </div>

              <button onClick={handlePay} disabled={saving}
                style={{ background:saving?'#6b7280':'#16a34a', color:'#fff', border:'none', borderRadius:12, padding:'14px', fontSize:15, fontWeight:600, cursor:saving?'not-allowed':'pointer', fontFamily:C.font }}>
                {saving?'Recording...':"✓ I've Paid — Record Transaction"}
              </button>
            </div>
          )}

          {drawerMode==='add-account' && (
            <form onSubmit={handleAddAcc} style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div>
                <label style={lSt}>Account Type</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {(['till','paybill'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setNewAccType(t)} style={togBtn(newAccType===t)}>
                      {t==='till'?'🏪 Till':'🏢 Paybill'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lSt}>{newAccType==='till'?'Till Number':'Paybill Number'}</label>
                <input value={newShortcode} onChange={e=>setNewShortcode(e.target.value)} placeholder={newAccType==='till'?'e.g. 123456':'e.g. 400200'} required style={iSt} />
              </div>
              {newAccType==='paybill' && (
                <div>
                  <label style={lSt}>Account Name</label>
                  <input value={newAccName} onChange={e=>setNewAccName(e.target.value)} placeholder="e.g. KPLC, Nairobi Water" required style={iSt} />
                </div>
              )}
              <button type="submit" style={{ background:isDark?'#3b82f6':'#1a1a1a', color:'#fff', border:'none', borderRadius:12, padding:'13px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>
                Link Account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
