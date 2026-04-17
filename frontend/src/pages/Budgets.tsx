import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import api from '../api/axios'

interface Budget {
    id: number
    category: string
    budget_amount: number
    spent_amount: number
    period: string
    alert_threshold: number
    percentage_used: number
    is_exceeded: boolean
    is_near_limit: boolean
}
const CATEGORIES = [
    'Rent',
    'Utilities',
    'Groceries',
    'Transport',
    'Salaries',
    'Healthcare',
    'Entertainment',
    'Other'
]

export default function Budgets() {
    const [budgets, setBudgets] = useState<Budget[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [error, setError] = useState('')
    const [customCategory, setCustomCategory] = useState('')
    const [editingId, setEditingId] = useState<number | null>(null)

    

    const [form, setForm] = useState({
        category: 'Rent',
        budget_amount: '',
        period: 'monthly',
        alert_threshold: 0.80
    })

    const fetchBudgets = async () => {
        try {
            const res = await api.get('/budgets/')
            setBudgets(res.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBudgets()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        try {
          const finalCategory =
            form.category === "Other" ? customCategory : form.category

        const payload = {
        ...form,
        category: finalCategory
        }

        if (editingId) {
        await api.put(`/budgets/${editingId}`, payload)
        } else {
        await api.post('/budgets/', payload)
        }

            setShowForm(false)
            setForm({ category: 'Rent', budget_amount: '', period: 'monthly', alert_threshold: 0.80 })
            setCustomCategory('')
            fetchBudgets()
        } catch (err: any) {
            setError(err.response?.data?.error || 'Something went wrong')
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this budget?')) return
        try {
            await api.delete(`/budgets/${id}`)
            fetchBudgets()
        } catch (err) {
            console.error(err)
        }
    }

    const getBarColor = (budget: Budget) => {
        if (budget.is_exceeded) return 'bg-red-500'
        if (budget.is_near_limit) return 'bg-amber-400'
        return 'bg-blue-500'
    }

    const handleEdit = (b: Budget) => {
    setForm({
        category: b.category,
        budget_amount: String(b.budget_amount),
        period: b.period,
        alert_threshold: b.alert_threshold
    })
    setEditingId(b.id)
    setShowForm(true)
}

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-4xl mx-auto px-6 py-8">

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Budgets</h2>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                        + Add budget
                    </button>
                </div>

                {/* Form */}
                {showForm && (
                    <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">New budget</h3>
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                 {form.category === "Other" && (
                                <input
                                    type="text"
                                    placeholder="Enter custom budget (e.g. Netflix, Gym)"
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    className="w-full mt-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                                <select
                                    value={form.period}
                                    onChange={(e) => setForm({ ...form, period: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Budget amount (KES)</label>
                                <input
                                    type="number"
                                    value={form.budget_amount}
                                    onChange={(e) => setForm({ ...form, budget_amount: e.target.value })}
                                    placeholder="0.00"
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Alert at ({Math.round(form.alert_threshold * 100)}%)
                                </label>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="1"
                                    step="0.05"
                                    value={form.alert_threshold}
                                    onChange={(e) => setForm({ ...form, alert_threshold: parseFloat(e.target.value) })}
                                    className="w-full mt-2"
                                />
                            </div>
                            <div className="md:col-span-2 flex gap-3">
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
                                >
                                    {editingId ? 'Update' : 'Save'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Budget list */}
                {loading ? (
                    <p className="text-gray-400 text-sm">Loading...</p>
                ) : budgets.length === 0 ? (
                    <p className="text-gray-400 text-sm">No budgets yet. Add one above.</p>
                ) : (
                    <div className="space-y-4">
                        {budgets.map(b => (
                            <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800">{b.category}</h3>
                                        <p className="text-xs text-gray-400 capitalize">{b.period}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-gray-800">
                                                KES {b.spent_amount.toLocaleString()}
                                                <span className="text-gray-400 font-normal"> / {b.budget_amount.toLocaleString()}</span>
                                            </p>
                                            <p className="text-xs text-gray-400">{b.percentage_used}% used</p>
                                        </div>
                                        {b.is_exceeded && (
                                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                                                Exceeded
                                            </span>
                                        )}
                                        {b.is_near_limit && !b.is_exceeded && (
                                            <span className="text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-full font-medium">
                                                Warning
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleDelete(b.id)}
                                            className="text-xs text-red-400 hover:underline"
                                        >
                                            Delete
                                        </button>
                                        <button
                                        onClick={() => handleEdit(b)}
                                        className="text-blue-500 text-xs hover:underline"
                                    >
                                        Edit
                                    </button>
                                    </div>
                                </div>
                                {/* Progress bar */}
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-300 ${getBarColor(b)}`}
                                        style={{ width: `${Math.min(b.percentage_used, 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}