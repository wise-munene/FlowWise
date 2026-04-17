import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import api from '../api/axios'

type MpesaAccount = {
    id: number
    account_type: 'till' | 'paybill'
    shortcode: string
    account_name?: string
}

export default function Mpesa() {
    const [phone, setPhone] = useState('')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')
    const [category, setCategory] = useState('Other')

    const [accounts, setAccounts] = useState<MpesaAccount[]>([])
    const [accountType, setAccountType] = useState<'till' | 'paybill'>('till')
    const [shortcode, setShortcode] = useState('')
    const [accountName, setAccountName] = useState('')

    const [paymentMethod, setPaymentMethod] = useState<'stk' | 'till' | 'paybill'>('stk')

    useEffect(() => {
        fetchAccounts()
    }, [])

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/mpesa/accounts')
            setAccounts(res.data)
        } catch (err) {
            console.error(err)
        }
    }

    const handleSTKPush = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setStatus('idle')

        try {
            const response = await api.post('/mpesa/stk-push', {
                phone,
                amount: parseFloat(amount),
                account_ref: category, // can be used to identify the transaction in callbacks
                description,
                category
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
                description,
                category
            })
            setMessage(response.data.message)
            setStatus('success')
            setPhone('')
            setAmount('')
            setDescription('')
            setCategory('Other')
        } catch (err: any) {
            setMessage(err.response?.data?.error || 'Simulation failed')
            setStatus('error')
        } finally {
            setLoading(false)
        }
    }

    const handleAddAccount = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            await api.post('/mpesa/accounts', {
                account_type: accountType,
                shortcode,
                account_name: accountType === 'paybill' ? accountName : ''
            })

            fetchAccounts()
            setShortcode('')
            setAccountName('')
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-2xl mx-auto px-6 py-8">

                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">M-Pesa</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Send payment requests and manage payments
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

                {/* STK PUSH */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">
                        STK Push Payment
                    </h3>

                    <form onSubmit={handleSTKPush} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="0712345678"
                                required
                                className="w-full px-4 py-2.5 border rounded-lg"
                            />
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="100"
                                required
                                className="w-full px-4 py-2.5 border rounded-lg"
                            />
                        </div>

                            <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={
                            category === "Other"
                                ? "Enter custom category (e.g. Gym, Netflix, Car wash)"
                                : "Payment for services"
                        }
                        className="w-full px-4 py-2.5 border rounded-lg"
                            />
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-2.5 border rounded-lg"
                        >
                            <option value="Rent">Rent</option>
                            <option value="Groceries">Groceries</option>
                            <option value="Transport">Transport</option>
                            <option value="Bills">Bills</option>
                            <option value="Other">Other</option>
                        </select>

                        <button
                            disabled={loading}
                            className="w-full bg-green-600 text-white py-2 rounded-lg"
                        >
                            {loading ? 'Processing...' : 'Send STK Push'}
                        </button>
                    </form>
                </div>

                {/* SIMULATE */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">
                        Simulate M-Pesa transaction
                    </h3>

                    <form onSubmit={handleSimulate} className="space-y-4">
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Phone"
                            className="w-full border px-3 py-2 rounded"
                        />
                        <input
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Amount"
                            className="w-full border px-3 py-2 rounded"
                        />
                        <button
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            {loading ? 'Processing...' : 'Record'}
                        </button>
                    </form>
                </div>

                {/* BUSINESS SETUP */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">
                        Add M-Pesa Account
                    </h3>

                    <form onSubmit={handleAddAccount} className="space-y-3">
                        <select
                            value={accountType}
                            onChange={(e) => setAccountType(e.target.value as 'till' | 'paybill')}
                            className="w-full border rounded-lg px-3 py-2"
                        >
                            <option value="till">Till</option>
                            <option value="paybill">Paybill</option>
                        </select>

                        <input
                            placeholder="Shortcode"
                            value={shortcode}
                            onChange={(e) => setShortcode(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                        />

                        {accountType === 'paybill' && (
                            <input
                                placeholder="Account Name"
                                value={accountName}
                                onChange={(e) => setAccountName(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        )}

                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                            Add Account
                        </button>
                    </form>
                </div>

                {/* ACCOUNTS */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">
                        Your Accounts
                    </h3>

                    {accounts.length === 0 ? (
                        <p className="text-sm text-gray-400">No accounts added</p>
                    ) : (
                        accounts.map((acc) => (
                            <div key={acc.id} className="border-b py-2">
                                <p className="text-sm font-medium">
                                    {acc.account_type.toUpperCase()} - {acc.shortcode}
                                </p>
                                {acc.account_type === 'paybill' && (
                                    <p className="text-xs text-gray-400">
                                        {acc.account_name}
                                    </p>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* CUSTOMER PAYMENT */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">
                        Pay Business
                    </h3>

                    <select
                        value={paymentMethod}
                        onChange={(e) =>
                            setPaymentMethod(e.target.value as 'stk' | 'till' | 'paybill')
                        }
                        className="w-full border rounded-lg px-3 py-2 mb-4"
                    >
                        <option value="stk">STK Push</option>
                        <option value="till">Till (Buy Goods)</option>
                        <option value="paybill">Paybill</option>
                    </select>

                    {paymentMethod === 'stk' && (
                        <p className="text-sm text-gray-500">
                            Use STK Push above to pay instantly
                        </p>
                    )}

                    {paymentMethod === 'till' &&
                        accounts
                            .filter((a) => a.account_type === 'till')
                            .map((acc) => (
                                <div key={acc.id}>
                                    <p className="text-sm">
                                        Till Number: <span className="font-bold">{acc.shortcode}</span>
                                    </p>
                                    <div className="text-xs text-gray-400 mt-2">
                                        <p>1. Go to M-Pesa</p>
                                        <p>2. Buy Goods</p>
                                        <p>3. Enter Till Number</p>
                                        <p>4. Enter amount</p>
                                        <p>5. Confirm</p>
                                    </div>
                                </div>
                            ))}

                    {paymentMethod === 'paybill' &&
                        accounts
                            .filter((a) => a.account_type === 'paybill')
                            .map((acc) => (
                                <div key={acc.id}>
                                    <p className="text-sm">
                                        Paybill: <span className="font-bold">{acc.shortcode}</span>
                                    </p>
                                    <p className="text-sm">
                                        Account:{' '}
                                        <span className="font-bold">
                                            {phone || 'Your phone number'}
                                        </span>
                                    </p>
                                </div>
                            ))}
                </div>

            </div>
        </div>
    )
}