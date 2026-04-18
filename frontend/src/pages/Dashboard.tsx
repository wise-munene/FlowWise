import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import posthog from '../lib/posthog' // ✅ FIXED IMPORT
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
    PieChart, Pie, Cell, ResponsiveContainer,
    LineChart, Line
} from 'recharts'

interface Transaction {
    id: number
    type: string
    category: string
    amount: number
    date: string
    notes: string
    is_recurring: boolean
}

interface Alert {
    category: string
    status: string
    message: string
    budget_amount: number
    spent_amount: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function Dashboard() {
    const { user } = useAuth()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [txRes, alertRes] = await Promise.all([
                    api.get('/transactions/'),
                    api.get('/budgets/alerts')
                ])
                setTransactions(txRes.data)
                setAlerts(alertRes.data.alerts)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    // ✅ TRACK DASHBOARD VIEW (FIXED TYPO)
    useEffect(() => {
        posthog.capture('dashboard_viewed')
    }, [])

    
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

    const netBalance = totalIncome - totalExpense

    const categoryData = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc: any[], t) => {
            const existing = acc.find(item => item.category === t.category)
            if (existing) {
                existing.amount += t.amount
            } else {
                acc.push({ category: t.category, amount: t.amount })
            }
            return acc
        }, [])

    const monthlyData = transactions.reduce((acc: any[], t) => {
        const month = t.date.substring(0, 7)
        const existing = acc.find(item => item.month === month)
        if (existing) {
            if (t.type === 'income') existing.income += t.amount
            else existing.expense += t.amount
        } else {
            acc.push({
                month,
                income: t.type === 'income' ? t.amount : 0,
                expense: t.type === 'expense' ? t.amount : 0
            })
        }
        return acc
    }, []).sort((a, b) => a.month.localeCompare(b.month))

    const today = new Date()
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(today.getDate() - 7)

    const weeklyTransactions = transactions.filter(t =>
        new Date(t.date) >= oneWeekAgo && t.type === 'expense'
    )

    const weeklyTotal = weeklyTransactions.reduce((sum, t) => sum + t.amount, 0)

    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(today.getDate() - 14)

    const lastWeekTransactions = transactions.filter(t => {
        const d = new Date(t.date)
        return d >= twoWeeksAgo && d < oneWeekAgo && t.type === 'expense'
    })

    const lastWeekTotal = lastWeekTransactions.reduce((sum, t) => sum + t.amount, 0)

    const weeklyChange = lastWeekTotal
        ? ((weeklyTotal - lastWeekTotal) / lastWeekTotal) * 100
        : 0

    const dailyData = transactions.reduce((acc: any[], t) => {
        if (t.type !== 'expense') return acc

        const existing = acc.find(item => item.date === t.date)

        if (existing) {
            existing.amount += t.amount
        } else {
            acc.push({ date: t.date, amount: t.amount })
        }

        return acc
    }, []).sort((a, b) => a.date.localeCompare(b.date))

    const topCategory = categoryData.sort((a, b) => b.amount - a.amount)[0]

    const insightMessage = topCategory
        ? `You spent the most on ${topCategory.category} this period.`
        : "No spending data yet."

    // =========================
    // UI
    // =========================

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center h-96">
                    <p className="text-gray-400">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-6xl mx-auto px-6 py-8">

                <h2 className="text-2xl font-bold mb-6">
                    Welcome back, {user?.name}
                </h2>

                
                {/* ALERTS */}
                {alerts.length > 0 && (
                    <div className="mb-6 space-y-2">
                        {alerts.map((alert, i) => (
                            <div
                                key={i}
                                className={`p-4 rounded-lg ${
                                    alert.status === 'exceeded'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                }`}
                            >
                                {alert.message}
                            </div>
                        ))}
                    </div>
                )}

                {/* SUMMARY */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded shadow">
                        <p>Total Income</p>
                        <h3 className="text-green-600 font-bold">
                            KES {totalIncome.toLocaleString()}
                        </h3>
                    </div>

                    <div className="bg-white p-4 rounded shadow">
                        <p>Total Expense</p>
                        <h3 className="text-red-500 font-bold">
                            KES {totalExpense.toLocaleString()}
                        </h3>
                    </div>

                    <div className="bg-white p-4 rounded shadow">
                        <p>Balance</p>
                        <h3 className="text-blue-600 font-bold">
                            KES {netBalance.toLocaleString()}
                        </h3>
                    </div>
                </div>

                {/* WEEKLY */}
                <div className="bg-white p-4 rounded shadow mb-6">
                    <p>Weekly Spending</p>
                    <h3 className="font-bold">
                        KES {weeklyTotal.toLocaleString()}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {weeklyChange >= 0 ? '+' : ''}
                        {weeklyChange.toFixed(1)}% from last week
                    </p>
                </div>

                {/* INSIGHT */}
                <div className="bg-blue-50 p-4 rounded mb-6">
                    <p className="font-medium">💡 Insight</p>
                    <p>{insightMessage}</p>
                </div>

                {/* CHARTS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                    {/* BAR */}
                    <div className="bg-white p-6 rounded-xl shadow">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                        Income vs Expenses
                    </h3>

                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={monthlyData} barCategoryGap="30%">
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                                formatter={(value) => value != null ? `KES ${value.toLocaleString()}` : ''}
                            />
                            <Legend />

                            <Bar
                                dataKey="income"
                                fill="#10b981"
                                radius={[8, 8, 0, 0]}  // 👈 smooth top
                            />

                            <Bar
                                dataKey="expense"
                                fill="#ef4444"
                                radius={[8, 8, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                    {/* PIE */}
                    <div className="bg-white p-6 rounded-xl shadow">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                        Expenses by category
                    </h3>

                    <div className="flex flex-col md:flex-row items-center">
                        <ResponsiveContainer width="50%" height={250}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    dataKey="amount"
                                    innerRadius={60}   // 👈 makes it a donut
                                    outerRadius={90}
                                    paddingAngle={4}
                                >
                                    {categoryData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => value !== undefined && value !== null ? `KES ${value.toLocaleString()}` : ''} />
                            </PieChart>
                        </ResponsiveContainer>

        {/* LEGEND (BETTER THAN LABELS) */}
        <div className="mt-4 md:mt-0 md:ml-6 space-y-2">
            {categoryData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm w-48">
                    <div className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span>{item.category}</span>
                    </div>
                    <span className="text-gray-600">
                        KES {item.amount.toLocaleString()}
                    </span>
                </div>
            ))}
        </div>
    </div>
</div>

                {/* TREND */}
            
            <div className="bg-white p-6 rounded-xl shadow mb-6">
                <div className="mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">
                        Spending Trend
                    </h3>
                    <p className="text-xs text-gray-400">
                        Daily expenses over time
                    </p>
                </div>

                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={dailyData}>
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis />
                        <Tooltip
                            formatter={(value) =>
                                value != null ? `KES ${value.toLocaleString()}` : ''
                            }
                            labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Line
                            type="monotone"
                            dataKey="amount"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

                {/* Recent transactions */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                        Recent transactions
                    </h3>
                    {transactions.length === 0 ? (
                        <p className="text-gray-400 text-sm">No transactions yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {transactions.slice(0, 5).map(t => (
                                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{t.category}</p>
                                        <p className="text-xs text-gray-400">{t.date}</p>
                                    </div>
                                    <span className={`text-sm font-semibold ${
                                        t.type === 'income' ? 'text-green-600' : 'text-red-500'
                                    }`}>
                                        {t.type === 'income' ? '+' : '-'} KES {t.amount.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
        </div>
    )
}