import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

interface Summary {
  total_income: number; total_expense: number; net: number
  transaction_count: number; top_category: string | null
}

export default function Reports() {
  const { isDark } = useTheme()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate]     = useState('')
  const [downloading, setDownloading] = useState<'csv'|'pdf'|null>(null)
  const [summary, setSummary]     = useState<Summary|null>(null)
  const [loading, setLoading]     = useState(true)

  const C = {
    bg: isDark ? '#111827':'#f8f7f4', card: isDark ? '#1f2937':'#fff',
    border: isDark ? '#374151':'#ebebeb', text: isDark ? '#f9fafb':'#1a1a1a',
    muted: isDark ? '#9ca3af':'#888', inputBg: isDark ? '#111827':'#fff',
    inputBorder: isDark ? '#374151':'#e5e5e5',
    font: "'Inter', sans-serif", mono: "'JetBrains Mono', monospace",
  }

  const iSt = {
    width:'100%', padding:'11px 14px', border:`2px solid ${C.inputBorder}`,
    borderRadius:10, fontSize:14, fontFamily:C.font, outline:'none',
    boxSizing:'border-box' as const, color:C.text, background:C.inputBg,
  }

  useEffect(() => {
    api.get('/transactions/').then(res => {
      const txs = res.data.transactions ?? res.data
      const income  = txs.filter((t:{type:string}) => t.type==='income').reduce((s: number, t: { amount: number }) => s + t.amount, 0)
      const expense = txs.filter((t:{type:string}) => t.type==='expense').reduce((s:number,t:{amount:number}) => s+t.amount, 0)
      const cats    = txs.filter((t:{type:string}) => t.type==='expense').reduce((acc:Record<string,number>,t:{category:string;amount:number}) => { acc[t.category]=(acc[t.category]||0)+t.amount; return acc }, {})
      const topCat = Object.entries(cats as Record<string, number>)
        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
      setSummary({ total_income:income, total_expense:expense, net:income-expense, transaction_count:txs.length, top_category:topCat })
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const token = localStorage.getItem('access_token')

  const handleDownload = async (type:'csv'|'pdf') => {
    setDownloading(type)
    try {
      let url = `${import.meta.env.VITE_API_URL}/reports/${type}`
      const p = []
      if (startDate) p.push(`start_date=${startDate}`)
      if (endDate)   p.push(`end_date=${endDate}`)
      if (p.length)  url += `?${p.join('&')}`
      const r = await fetch(url, { headers:{ Authorization:`Bearer ${token}` } })
      if (!r.ok) throw new Error('Download failed')
      const blob = await r.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `flowwise_${new Date().toISOString().split('T')[0]}.${type}`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) { console.error(e) }
    finally { setDownloading(null) }
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:C.font }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <Navbar />

      <div style={{ maxWidth:700, margin:'0 auto', padding:'24px 16px 48px' }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:26, fontWeight:600, color:C.text, letterSpacing:'-0.5px', margin:0 }}>Reports</h1>
          <p style={{ color:C.muted, fontSize:13, marginTop:4 }}>Export your data for records or your accountant</p>
        </div>

        {/* Summary — 2-col on mobile, 4-col on larger */}
        {!loading && summary && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:10, marginBottom:20 }}>
            {[
              { label:'Income',       value:`KES ${summary.total_income.toLocaleString()}`,  color:'#059669', bg:isDark?'#064e3b':'#ecfdf5' },
              { label:'Expenses',     value:`KES ${summary.total_expense.toLocaleString()}`, color:'#dc2626', bg:isDark?'#450a0a':'#fef2f2' },
              { label:'Net Balance',  value:`KES ${summary.net.toLocaleString()}`,           color:summary.net>=0?'#2563eb':'#dc2626', bg:isDark?'#1e3a8a':'#eff6ff' },
              { label:'Transactions', value:`${summary.transaction_count}`,                  color:'#7c3aed', bg:isDark?'#2e1065':'#f5f3ff' },
            ].map((s,i) => (
              <div key={i} style={{ background:s.bg, borderRadius:14, padding:'14px 16px', border:`1.5px solid ${s.color}18` }}>
                <p style={{ fontSize:11, fontWeight:500, color:C.muted, textTransform:'uppercase', letterSpacing:'0.4px', margin:'0 0 5px' }}>{s.label}</p>
                <p style={{ fontSize:15, fontWeight:700, color:s.color, fontFamily:C.mono, margin:0, wordBreak:'break-word' }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Insight */}
        {summary?.top_category && (
          <div style={{ background:isDark?'#1a2332':'#fffbeb', borderRadius:12, padding:'12px 16px', border:`1px solid ${isDark?'#374151':'#fde68a'}`, marginBottom:20 }}>
            <p style={{ margin:0, fontSize:13, color:isDark?'#fbbf24':'#92400e', lineHeight:1.5 }}>
              💡 Your highest spending category is <strong>{summary.top_category}</strong>. Use the date filter below to see it by month.
            </p>
          </div>
        )}

        {/* Date filter */}
        <div style={{ background:C.card, borderRadius:16, padding:'20px', border:`1.5px solid ${C.border}`, marginBottom:16 }}>
          <p style={{ fontSize:14, fontWeight:600, color:C.text, margin:'0 0 16px' }}>📅 Filter by Date Range</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:500, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', display:'block', marginBottom:6 }}>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={iSt} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:500, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', display:'block', marginBottom:6 }}>End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={iSt} />
            </div>
            {(startDate || endDate) && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:4 }}>
                <p style={{ margin:0, fontSize:13, color:C.muted }}>
                  {startDate||'All time'} → {endDate||'Today'}
                </p>
                <button onClick={() => { setStartDate(''); setEndDate('') }}
                  style={{ background:'none', border:'none', color:C.muted, fontSize:12, cursor:'pointer', fontFamily:C.font }}>
                  Clear ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Download cards — stacked on mobile */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* CSV */}
          <div style={{ background:C.card, borderRadius:16, padding:'20px', border:`1.5px solid ${C.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:isDark?'#064e3b':'#ecfdf5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>📊</div>
              <div>
                <h3 style={{ fontSize:16, fontWeight:600, color:C.text, margin:'0 0 3px' }}>CSV Export</h3>
                <p style={{ fontSize:12, color:C.muted, margin:0 }}>Spreadsheet format — Excel, Google Sheets</p>
              </div>
            </div>
            <div style={{ background:isDark?'#111827':'#f9f9f9', borderRadius:10, padding:'10px 12px', marginBottom:14, fontSize:12, color:C.muted }}>
              📋 Date · Type · Category · Amount · Notes · Recurring
            </div>
            <button onClick={() => handleDownload('csv')} disabled={downloading==='csv'}
              style={{ width:'100%', background:downloading==='csv'?'#aaa':'#059669', color:'#fff', border:'none', borderRadius:10, padding:'13px', fontSize:14, fontWeight:600, cursor:downloading==='csv'?'not-allowed':'pointer', fontFamily:C.font, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {downloading==='csv'
                ? <><div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />Downloading...</>
                : '⬇ Download CSV'
              }
            </button>
          </div>

          {/* PDF */}
          <div style={{ background:C.card, borderRadius:16, padding:'20px', border:`1.5px solid ${C.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:isDark?'#1e3a8a':'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>📄</div>
              <div>
                <h3 style={{ fontSize:16, fontWeight:600, color:C.text, margin:'0 0 3px' }}>PDF Report</h3>
                <p style={{ fontSize:12, color:C.muted, margin:0 }}>Formatted summary — share with accountant</p>
              </div>
            </div>
            <div style={{ background:isDark?'#111827':'#f9f9f9', borderRadius:10, padding:'10px 12px', marginBottom:14, fontSize:12, color:C.muted }}>
              📋 Summary totals · Transaction table · FlowWise branding
            </div>
            <button onClick={() => handleDownload('pdf')} disabled={downloading==='pdf'}
              style={{ width:'100%', background:downloading==='pdf'?'#aaa':'#2563eb', color:'#fff', border:'none', borderRadius:10, padding:'13px', fontSize:14, fontWeight:600, cursor:downloading==='pdf'?'not-allowed':'pointer', fontFamily:C.font, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {downloading==='pdf'
                ? <><div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />Generating...</>
                : '⬇ Download PDF'
              }
            </button>
          </div>
        </div>

        <div style={{ marginTop:16, background:isDark?'#1a2332':'#fffbeb', borderRadius:12, padding:'12px 16px', border:`1px solid ${isDark?'#374151':'#fde68a'}` }}>
          <p style={{ margin:0, fontSize:13, color:isDark?'#fbbf24':'#92400e' }}>
            💡 <strong>Tip:</strong> Select a date range first to generate a monthly or quarterly report.
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

