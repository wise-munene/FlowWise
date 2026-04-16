import { useState, useEffect } from 'react'
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
}

const CATEGORIES = [
    'Salary', 'Sales', 'Rent', 'Utilities', 'Groceries',
    'Transport', 'Salaries', 'Healthcare', 'Entertainment', 'Other'
]

export default function Transactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [error, setError] = useState('')

    const [form, setForm] = useState({
        type: 'expense',
        category: 'Other',
        payment_method: 'Mpesa',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        is_recurring: false
    })

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

    useEffect(() => {
        fetchTransactions()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        try {
            if (editingId) {
                await api.put(`/transactions/${editingId}`, form)
            } else {
                await api.post('/transactions/', form)
            }
            setShowForm(false)
            setEditingId(null)
            setForm({
                type: 'expense',
                category: 'Other',
                payment_method: 'Mpesa',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                notes: '',
                is_recurring: false
            })
            fetchTransactions()
        } catch (err: any) {
            setError(err.response?.data?.error || 'Something went wrong')
        }
    }

    const handleEdit = (t: Transaction) => {
        setForm({
            type: t.type,
            category: t.category,
            payment_method: t.payment_method,
            amount: String(t.amount),
            date: t.date,
            notes: t.notes || '',
            is_recurring: t.is_recurring
        })
        setEditingId(t.id)
        setShowForm(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this transaction?')) return
        try {
            await api.delete(`/transactions/${id}`)
            fetchTransactions()
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-4xl mx-auto px-6 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
                    <button
                        onClick={() => { setShowForm(true); setEditingId(null) }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                        + Add transaction
                    </button>
                </div>

                {/* Form */}
                {showForm && (
                    <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">
                            {editingId ? 'Edit transaction' : 'New transaction'}
                        </h3>
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="income">Income</option>
                                    <option value="expense">Expense</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Method
                                    </label>
                                    <select
                                        value={form.payment_method}
                                        onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Mpesa">Mpesa</option>
                                        <option value="Cash">Cash</option>
                                    </select>
                                    </div>
                                <select
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
                                <input
                                    type="number"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    placeholder="0.00"
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <input
                                    type="text"
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Optional note"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="md:col-span-2 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="recurring"
                                    checked={form.is_recurring}
                                    onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
                                    className="rounded"
                                />
                                <label htmlFor="recurring" className="text-sm text-gray-700">
                                    Recurring transaction
                                </label>
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
                                    onClick={() => { setShowForm(false); setEditingId(null) }}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Transactions list */}
                <div className="bg-white rounded-xl border border-gray-100">
                    {loading ? (
                        <p className="text-gray-400 text-sm p-6">Loading...</p>
                    ) : transactions.length === 0 ? (
                        <p className="text-gray-400 text-sm p-6">No transactions yet. Add one above.</p>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {transactions.map(t => (
                                <div key={t.id} className="flex items-center justify-between px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${t.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                 {t.category} • {t.payment_method}
                                            </p>
                                            <p className="text-xs text-gray-400">{t.date} {t.notes && `· ${t.notes}`}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                                            {t.type === 'income' ? '+' : '-'} KES {t.amount.toLocaleString()}
                                        </span>
                                        <button
                                            onClick={() => handleEdit(t)}
                                            className="text-xs text-blue-500 hover:underline"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(t.id)}
                                            className="text-xs text-red-400 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}