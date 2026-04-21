import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import api from '../api/axios'

const S = {
  font: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
  bg: '#f8f7f4',
  label: {
    fontSize: 12, fontWeight: 500, color: '#555',
    textTransform: 'uppercase' as const, letterSpacing: '0.5px',
    display: 'block', marginBottom: 8,
  },
  input: {
    width: '100%', padding: '11px 14px', border: '2px solid #e5e5e5',
    borderRadius: 10, fontSize: 14, fontFamily: "'Inter', sans-serif",
    outline: 'none', boxSizing: 'border-box' as const, color: '#1a1a1a', background: '#fff',
  },
}

interface Summary {
  total_income: number
  total_expense: number
  net: number
  transaction_count: number
  top_category: string | null
}

export default function Reports() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [downloading, setDownloading] = useState<'csv' | 'pdf' | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)

  const token = localStorage.getItem('access_token')

  useEffect(() => {
    fetchSummary()
  }, [])

  const fetchSummary = async () => {
    try {
      const res = await api.get('/transactions/')
      const txs: { type: string; amount: number; category: string }[] = res.data
      const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      const categories = txs.filter(t => t.type === 'expense').reduce((acc: Record<string, number>, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      }, {})
      const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
      setSummary({ total_income: income, total_expense: expense, net: income - expense, transaction_count: txs.length, top_category: topCategory })
    } catch (err) { console.error(err) }
    finally { setLoadingSummary(false) }
  }

  const buildUrl = (type: 'csv' | 'pdf') => {
    let url = `${import.meta.env.VITE_API_URL}/reports/${type}`
    const params = []
    if (startDate) params.push(`start_date=${startDate}`)
    if (endDate) params.push(`end_date=${endDate}`)
    if (params.length) url += `?${params.join('&')}`
    return url
  }

  const handleDownload = async (type: 'csv' | 'pdf') => {
    setDownloading(type)
    try {
      const response = await fetch(buildUrl(type), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `flowwise_report_${new Date().toISOString().split('T')[0]}.${type}`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    } finally {
      setDownloading(null)
    }
  }

  const dateRangeLabel = startDate || endDate
    ? `${startDate || 'All time'} → ${endDate || 'Today'}`
    : 'All transactions'

  return (
    <div style={{ minHeight: '100vh', background: S.bg, fontFamily: S.font }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <Navbar />

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 500, color: '#1a1a1a', letterSpacing: '-0.5px', margin: 0 }}>Reports</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Export your financial data for records or your accountant</p>
        </div>

        {/* Summary cards */}
        {!loadingSummary && summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total Income', value: `KES ${summary.total_income.toLocaleString()}`, color: '#059669', bg: '#ecfdf5' },
              { label: 'Total Expenses', value: `KES ${summary.total_expense.toLocaleString()}`, color: '#dc2626', bg: '#fef2f2' },
              { label: 'Net Balance', value: `KES ${summary.net.toLocaleString()}`, color: summary.net >= 0 ? '#2563eb' : '#dc2626', bg: '#eff6ff' },
              { label: 'Transactions', value: `${summary.transaction_count}`, color: '#7c3aed', bg: '#f5f3ff' },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: 14, padding: '14px 16px', border: `1.5px solid ${s.color}18` }}>
                <p style={{ fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.4px', margin: '0 0 6px' }}>{s.label}</p>
                <p style={{ fontSize: 16, fontWeight: 500, color: s.color, fontFamily: S.mono, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Date filter */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', border: '1.5px solid #ebebeb', marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', margin: '0 0 16px' }}>
            📅 Filter by Date Range <span style={{ fontSize: 12, fontWeight: 500, color: '#aaa' }}></span>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={S.label}>Start Date</label>
              <input
                type="date" value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={S.input}
                onFocus={e => (e.target.style.borderColor = '#1a1a1a')}
                onBlur={e => (e.target.style.borderColor = '#e5e5e5')}
              />
            </div>
            <div>
              <label style={S.label}>End Date</label>
              <input
                type="date" value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={S.input}
                onFocus={e => (e.target.style.borderColor = '#1a1a1a')}
                onBlur={e => (e.target.style.borderColor = '#e5e5e5')}
              />
            </div>
          </div>
          {(startDate || endDate) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#555' }}>
                📊 Report range: <strong>{dateRangeLabel}</strong>
              </p>
              <button
                onClick={() => { setStartDate(''); setEndDate('') }}
                style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 12, cursor: 'pointer', fontFamily: "'Inter', sans-serif",}}
              >
                Clear dates ✕
              </button>
            </div>
          )}
        </div>

        {/* Download cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          {/* CSV */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1.5px solid #ebebeb', transition: 'all 0.15s' }}
            onMouseOver={e => (e.currentTarget.style.borderColor = '#10b981')}
            onMouseOut={e => (e.currentTarget.style.borderColor = '#ebebeb')}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 14 }}>
              📊
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 500, color: '#1a1a1a', margin: '0 0 6px' }}>CSV Export</h3>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 20px', lineHeight: 1.5 }}>
              Raw data in spreadsheet format. Open in Excel, Google Sheets, or import into any accounting tool.
            </p>
            <div style={{ background: '#f9f9f9', borderRadius: 10, padding: '10px 12px', marginBottom: 16, fontSize: 12, color: '#666' }}>
              <p style={{ margin: 0 }}>📋 Includes: Date, Type, Category, Amount, Notes, Recurring</p>
            </div>
            <button
              onClick={() => handleDownload('csv')}
              disabled={downloading === 'csv'}
              style={{
                width: '100%', background: downloading === 'csv' ? '#aaa' : '#059669', color: '#fff',
                border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 500,
                cursor: downloading === 'csv' ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {downloading === 'csv' ? (
                <>
                  <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Downloading...
                </>
              ) : '⬇ Download CSV'}
            </button>
          </div>

          {/* PDF */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1.5px solid #ebebeb', transition: 'all 0.15s' }}
            onMouseOver={e => (e.currentTarget.style.borderColor = '#2563eb')}
            onMouseOut={e => (e.currentTarget.style.borderColor = '#ebebeb')}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 14 }}>
              📄
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 500, color: '#1a1a1a', margin: '0 0 6px' }}>PDF Report</h3>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 20px', lineHeight: 1.5 }}>
              Formatted financial summary. Share with clients, your bank, or keep for personal records.
            </p>
            <div style={{ background: '#f9f9f9', borderRadius: 10, padding: '10px 12px', marginBottom: 16, fontSize: 12, color: '#666' }}>
              <p style={{ margin: 0 }}>📋 Includes: Summary totals, transaction table, FlowWise branding</p>
            </div>
            <button
              onClick={() => handleDownload('pdf')}
              disabled={downloading === 'pdf'}
              style={{
                width: '100%', background: downloading === 'pdf' ? '#aaa' : '#2563eb', color: '#fff',
                border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700,
                cursor: downloading === 'pdf' ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {downloading === 'pdf' ? (
                <>
                  <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Generating PDF...
                </>
              ) : '⬇ Download PDF'}
            </button>
          </div>
        </div>

        {/* Tip */}
        <div style={{ marginTop: 16, background: '#fffbeb', borderRadius: 12, padding: '12px 16px', border: '1px solid #fde68a' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#92400e' }}>
            💡 <strong>Tip:</strong> Use date filters above to generate period-specific reports.
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}