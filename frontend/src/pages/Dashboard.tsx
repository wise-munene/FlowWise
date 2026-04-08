import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
    PieChart, Pie, Cell, ResponsiveContainer
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

                {/* Welcome */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Welcome back, {user?.name}
                    </h2>
                    <p className="text-gray-500 mt-1">
                        Here's your financial overview
                    </p>
                </div>

                {/* Alerts */}
                {alerts.length > 0 && (
                    <div className="mb-6 space-y-2">
                        {alerts.map((alert, i) => (
                            <div
                                key={i}
                                className={`p-4 rounded-lg border text-sm font-medium ${
                                    alert.status === 'exceeded'
                                        ? 'bg-red-50 border-red-200 text-red-700'
                                        : 'bg-amber-50 border-amber-200 text-amber-700'
                                }`}
                            >
                                {alert.message}
                            </div>
                        ))}
                    </div>
                )}

                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                        <p className="text-sm text-gray-500">Total income</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">
                            KES {totalIncome.toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                        <p className="text-sm text-gray-500">Total expenses</p>
                        <p className="text-2xl font-bold text-red-500 mt-1">
                            KES {totalExpense.toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                        <p className="text-sm text-gray-500">Net balance</p>
                        <p className={`text-2xl font-bold mt-1 ${netBalance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                            KES {netBalance.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

                    {/* Bar chart */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">
                            Income vs Expenses
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={monthlyData}>
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expense" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Pie chart */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">
                            Expenses by category
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    dataKey="amount"
                                    nameKey="category"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={({ payload, percent }) =>
                                            `${payload.category} ${((percent ?? 0) * 100).toFixed(0)}%`
                                    }
                                >
                                    {categoryData.map((_, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
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
    )
}