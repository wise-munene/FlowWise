import { useState } from 'react'
import Navbar from '../components/Navbar'
import api from '../api/axios'

export default function Mpesa() {
    const [phone, setPhone] = useState('')
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState('M-Pesa')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    const CATEGORIES = [
        'Rent', 'Utilities', 'Groceries', 'Transport',
        'Salaries', 'Healthcare', 'Entertainment', 'M-Pesa', 'Other'
    ]

    const handleSTKPush = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setStatus('idle')
        try {
            const response = await api.post('/mpesa/stk-push', {
                phone,
                amount: parseFloat(amount),
                account_ref: 'FlowWise',
                description
            })
            setMessage(response.data.message)
            setStatus('success')
        } catch (err: any) {
            setMessage(err.response?.data?.error || 'Payment request failed')
            setStatus('error')
        } finally {
            setLoading(false)
        }
    }

    const handleSimulate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setStatus('idle')
        try {
            const response = await api.post('/mpesa/simulate', {
                phone,
                amount: parseFloat(amount),
                category,
                description
            })
            setMessage(response.data.message)
            setStatus('success')
            setPhone('')
            setAmount('')
            setDescription('')
        } catch (err: any) {
            setMessage(err.response?.data?.error || 'Simulation failed')
            setStatus('error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-2xl mx-auto px-6 py-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">M-Pesa</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Send payment requests and record M-Pesa transactions
                    </p>
                </div>

                {status !== 'idle' && (
                    <div className={`mb-6 p-4 rounded-lg border text-sm font-medium ${
                        status === 'success'
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-red-50 border-red-200 text-red-600'
                    }`}>
                        {message}
                    </div>
                )}

                {/* STK Push */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-bold">M</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-800">
                                STK Push payment
                            </h3>
                            <p className="text-xs text-gray-400">
                                Sends a payment prompt to the customer's phone
                            </p>
                        </div>
                        <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                            Sandbox
                        </span>
                    </div>
                    <form onSubmit={handleSTKPush} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone number
                                </label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="0712345678"
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount (KES)
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="100"
                                    required
                                    min="1"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description (optional)
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Payment for services"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                        >
                            {loading ? 'Sending request...' : 'Send STK Push'}
                        </button>
                    </form>
                </div>

                {/* Simulate transaction */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-bold">S</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-800">
                                Simulate M-Pesa transaction
                            </h3>
                            <p className="text-xs text-gray-400">
                                Record an M-Pesa payment directly without STK Push
                            </p>
                        </div>
                    </div>
                    <form onSubmit={handleSimulate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone number
                                </label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="0712345678"
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount (KES)
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="100"
                                    required
                                    min="1"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {CATEGORIES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description (optional)
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What was this payment for?"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                        >
                            {loading ? 'Recording...' : 'Record M-Pesa transaction'}
                        </button>
                    </form>
                </div>

                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-700 font-medium mb-1">Sandbox mode</p>
                    <p className="text-xs text-amber-600">
                        STK Push uses Safaricom's sandbox — no real money moves.
                        Use the simulate option to test recording transactions in FlowWise.
                        For production, update MPESA_ENV=production in your .env after Safaricom approves your app.
                    </p>
                </div>
            </div>
        </div>
    )
}