import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from 'recharts'
import { Link } from 'react-router-dom'

interface Transaction {
  id: number; type: string; category: string; amount: number; date: string; notes: string; is_recurring: boolean
}
interface Alert {
  category: string; status: string; message: string; budget_amount: number; spent_amount: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']
const CATEGORY_ICONS: Record<string, string> = {
  Groceries: '🛒', Transport: '🚗', Utilities: '💡', Rent: '🏠',
  Healthcare: '🏥', Entertainment: '🎬', Salary: '💼', Sales: '📈',
  Salaries: '👥', Other: '📦',
}

export default function Dashboard() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllCategories, setShowAllCategories] = useState(false)

  const C = {
    bg: isDark ? '#111827' : '#f8f7f4',
    card: isDark ? '#1f2937' : '#ffffff',
    border: isDark ? '#374151' : '#ebebeb',
    text: isDark ? '#f9fafb' : '#1a1a1a',
    muted: isDark ? '#9ca3af' : '#888888',
    font: "'Inter', sans-serif",
    mono: "'JetBrains Mono', monospace",
    label: { fontSize: 12, fontWeight: 400 as const, color: isDark ? '#9ca3af' : '#888', textTransform: 'uppercase' as const, letterSpacing: '0.4px' },
    tooltipStyle: { border: `1px solid ${isDark ? '#374151' : '#e5e5e5'}`, borderRadius: 10, fontSize: 12, background: isDark ? '#1f2937' : '#fff', color: isDark ? '#f9fafb' : '#1a1a1a' },
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txRes, alertRes] = await Promise.all([api.get('/transactions/'), api.get('/budgets/alerts')])
        setTransactions(txRes.data)
        setAlerts(alertRes.data.alerts)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const netBalance = totalIncome - totalExpense

  const categoryData = transactions.filter(t => t.type === 'expense')
    .reduce((acc: { category: string; amount: number }[], t) => {
      const ex = acc.find(i => i.category === t.category)
      if (ex) ex.amount += t.amount; else acc.push({ category: t.category, amount: t.amount })
      return acc
    }, []).sort((a, b) => b.amount - a.amount)

  const monthlyData = transactions.reduce((acc: { month: string; income: number; expense: number }[], t) => {
    const month = t.date.substring(0, 7)
    const ex = acc.find(i => i.month === month)
    if (ex) { if (t.type === 'income') ex.income += t.amount; else ex.expense += t.amount }
    else acc.push({ month, income: t.type === 'income' ? t.amount : 0, expense: t.type === 'expense' ? t.amount : 0 })
    return acc
  }, []).sort((a, b) => a.month.localeCompare(b.month)).slice(-6)

  const today = new Date()
  const oneWeekAgo = new Date(today); oneWeekAgo.setDate(today.getDate() - 7)
  const twoWeeksAgo = new Date(today); twoWeeksAgo.setDate(today.getDate() - 14)
  const weeklyTotal = transactions.filter(t => new Date(t.date) >= oneWeekAgo && t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const lastWeekTotal = transactions.filter(t => { const d = new Date(t.date); return d >= twoWeeksAgo && d < oneWeekAgo && t.type === 'expense' }).reduce((s, t) => s + t.amount, 0)
  const weeklyChange = lastWeekTotal ? ((weeklyTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0

  const dailyData = transactions.filter(t => t.type === 'expense')
    .reduce((acc: { date: string; amount: number }[], t) => {
      const ex = acc.find(i => i.date === t.date)
      if (ex) ex.amount += t.amount; else acc.push({ date: t.date, amount: t.amount })
      return acc
    }, []).sort((a, b) => a.date.localeCompare(b.date)).slice(-30)

  const topCategory = [...categoryData][0]

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, transition: 'background 0.3s' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${isDark ? '#374151' : '#e5e5e5'}`, borderTopColor: isDark ? '#9ca3af' : '#1a1a1a', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: C.muted, fontSize: 14 }}>Loading your dashboard...</p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, transition: 'background 0.3s, color 0.3s' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <Navbar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>{greeting} 👋</p>
          <h1 style={{ fontSize: 28, fontWeight: 500, color: C.text, letterSpacing: '-0.5px', margin: 0 }}>
            {user?.name?.trim() ? `${user.name.trim().split(' ')[0]}'s Dashboard` : 'Your Dashboard'}
          </h1>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
            {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Budget alerts */}
        {alerts.length > 0 && (
          <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.map((alert, i) => (
              <div key={i} style={{
                padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 10,
                background: alert.status === 'exceeded' ? (isDark ? '#450a0a' : '#fef2f2') : (isDark ? '#422006' : '#fffbeb'),
                border: `1px solid ${alert.status === 'exceeded' ? (isDark ? '#7f1d1d' : '#fecaca') : (isDark ? '#78350f' : '#fde68a')}`,
                color: alert.status === 'exceeded' ? (isDark ? '#fca5a5' : '#dc2626') : (isDark ? '#fcd34d' : '#92400e'),
              }}>
                <span style={{ fontSize: 16 }}>{alert.status === 'exceeded' ? '🚨' : '⚠️'}</span>
                {alert.message}
                <Link to="/budgets" style={{ marginLeft: 'auto', fontSize: 12, color: 'inherit', opacity: 0.7, textDecoration: 'none', fontWeight: 600 }}>View →</Link>
              </div>
            ))}
          </div>
        )}

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Income', value: totalIncome, color: '#059669', bg: isDark ? '#064e3b' : '#ecfdf5', icon: '↓' },
            { label: 'Total Expenses', value: totalExpense, color: '#dc2626', bg: isDark ? '#450a0a' : '#fef2f2', icon: '↑' },
            { label: 'Net Balance', value: netBalance, color: netBalance >= 0 ? '#2563eb' : '#dc2626', bg: netBalance >= 0 ? (isDark ? '#1e3a8a' : '#eff6ff') : (isDark ? '#450a0a' : '#fef2f2'), icon: '≡' },
            { label: 'This Week', value: weeklyTotal, color: '#7c3aed', bg: isDark ? '#2e1065' : '#f5f3ff', icon: '📅', sub: `${weeklyChange >= 0 ? '+' : ''}${weeklyChange.toFixed(0)}% vs last week` },
          ].map((card, i) => (
            <div key={i} style={{ background: card.bg, borderRadius: 16, padding: '18px 20px', border: `1.5px solid ${card.color}30` }}>
              <p style={{ ...C.label, marginBottom: 8 }}>{card.label}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: card.color, fontFamily: C.mono, margin: 0 }}>
                {card.value < 0 ? '-' : ''}KES {Math.abs(card.value).toLocaleString()}
              </p>
              {'sub' in card && card.sub && <p style={{ fontSize: 11, color: card.color, marginTop: 4, opacity: 0.8 }}>{card.sub}</p>}
            </div>
          ))}
        </div>

        {/* Insight bar */}
        {topCategory && (
          <div style={{ background: isDark ? '#1f2937' : '#1a1a1a', borderRadius: 14, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, border: isDark ? '1px solid #374151' : 'none' }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <p style={{ margin: 0, fontSize: 13, color: isDark ? '#d1d5db' : '#e5e5e5' }}>
              Your top spending category is <strong style={{ color: '#fff' }}>{topCategory.category}</strong> at{' '}
              <strong style={{ color: '#fff', fontFamily: C.mono }}>KES {topCategory.amount.toLocaleString()}</strong>.
              {topCategory.amount > totalExpense * 0.4 && " That's over 40% of your total expenses."}
            </p>
            <Link to="/budgets" style={{ marginLeft: 'auto', background: '#fff', color: '#1a1a1a', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Set budget →
            </Link>
          </div>
        )}

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* Monthly bar chart */}
          <div style={{ background: C.card, borderRadius: 16, padding: '22px 24px', border: `1.5px solid ${C.border}` }}>
            <p style={C.label}>Income vs Expenses</p>
            <p style={{ fontSize: 22, fontWeight: 500, color: C.text, margin: '14px 0 16px', fontFamily: C.mono }}>Last {monthlyData.length} months</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barCategoryGap="35%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f3f3f3'} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value, name) => [`KES ${Number(value ?? 0).toLocaleString()}`, name || '']} contentStyle={C.tooltipStyle} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: C.muted }} />
                <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} name="Income" />
                <Bar dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Donut chart */}
          <div style={{ background: C.card, borderRadius: 16, padding: '22px 24px', border: `1.5px solid ${C.border}` }}>
            <p style={C.label}>Spending by Category</p>
            <p style={{ fontSize: 22, fontWeight: 500, color: C.text, margin: '4px 0 8px', fontFamily: C.mono }}>KES {totalExpense.toLocaleString()}</p>
            {categoryData.length === 0 ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: C.muted, fontSize: 13 }}>No expense data yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ResponsiveContainer width={130} height={160}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="amount" innerRadius={42} outerRadius={62} paddingAngle={3}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`KES ${Number(value ?? 0).toLocaleString()}`, name || '']} contentStyle={C.tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {(showAllCategories ? categoryData : categoryData.slice(0, 5)).map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: C.muted, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {CATEGORY_ICONS[item.category] ?? '📦'} {item.category}
                      </span>
                      <span style={{ fontSize: 11, fontFamily: C.mono, color: C.muted, flexShrink: 0 }}>
                        {((item.amount / totalExpense) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                  {categoryData.length > 5 && (
                    <p onClick={() => setShowAllCategories(!showAllCategories)}
                      style={{ fontSize: 11, color: C.muted, margin: 0, cursor: 'pointer', fontWeight: 500 }}>
                      {showAllCategories ? 'Show less' : `+${categoryData.length - 5} more`}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Spending trend */}
        <div style={{ background: C.card, borderRadius: 16, padding: '22px 24px', border: `1.5px solid ${C.border}`, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <p style={C.label}>Daily Spending Trend</p>
              <p style={{ fontSize: 22, fontWeight: 500, color: C.text, margin: '4px 0 0', fontFamily: C.mono }}>Last 30 days</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f3f3f3'} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value, name) => [`KES ${Number(value ?? 0).toLocaleString()}`, name || '']} labelFormatter={l => `Date: ${l}`} contentStyle={C.tooltipStyle} />
              <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent transactions */}
        <div style={{ background: C.card, borderRadius: 16, padding: '22px 24px', border: `1.5px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <p style={C.label}>Recent Transactions</p>
              <p style={{ fontSize: 18, fontWeight: 500, color: C.text, margin: '4px 0 0' }}>Latest activity</p>
            </div>
            <Link to="/transactions" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
          </div>
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
              <p style={{ color: C.muted, fontSize: 14, margin: '0 0 12px' }}>No transactions yet</p>
              <Link to="/transactions" style={{ color: '#2563eb', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>Add your first transaction →</Link>
            </div>
          ) : (
            <div>
              {transactions.slice(0, 6).map((t, i) => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                  borderBottom: i < Math.min(transactions.length, 6) - 1 ? `1px solid ${C.border}` : 'none',
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: t.type === 'income' ? (isDark ? '#064e3b' : '#ecfdf5') : (isDark ? '#450a0a' : '#fef2f2'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {CATEGORY_ICONS[t.category] ?? '📦'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: C.text }}>{t.category}</p>
                    <p style={{ margin: 0, fontSize: 11, color: C.muted }}>{t.date}{t.notes ? ` · ${t.notes}` : ''}</p>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, fontFamily: C.mono, color: t.type === 'income' ? '#059669' : '#dc2626', flexShrink: 0 }}>
                    {t.type === 'income' ? '+' : '-'} KES {t.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
