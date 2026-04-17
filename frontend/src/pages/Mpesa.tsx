// Mpesa.tsx (FINAL VERSION - COPY PASTE)

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
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')
    const [category, setCategory] = useState('Other')

    const [accounts, setAccounts] = useState<MpesaAccount[]>([])
    const [accountType, setAccountType] = useState<'till' | 'paybill'>('till')
    const [shortcode, setShortcode] = useState('')
    const [accountName, setAccountName] = useState('')

    const [paymentMethod, setPaymentMethod] = useState<'till' | 'paybill'>('till')

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

    // ✅ RECORD PAYMENT (MAIN FIX)
    const handleRecordPayment = async () => {
        if (!amount) {
            setMessage("Amount is required")
            setStatus("error")
            return
        }

        try {
            await api.post('/transactions/', {
                type: 'expense',
                amount: parseFloat(amount),
                category: category === "Other" ? description : category,
                payment_method: 'Mpesa',
                payment_channel: paymentMethod,
                till_number: paymentMethod === 'till' ? shortcode : null,
                paybill_number: paymentMethod === 'paybill' ? shortcode : null,
                account_reference: paymentMethod === 'paybill' ? accountName : null,
                date: new Date().toISOString().split('T')[0],
                notes: description
            })

            setMessage("Payment recorded successfully")
            setStatus("success")

            setAmount('')
            setDescription('')
            setAccountName('')
            setCategory('Other')

        } catch (err) {
            setMessage("Failed to record payment")
            setStatus("error")
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

                <h2 className="text-2xl font-bold mb-6">M-Pesa</h2>

                {status !== 'idle' && (
                    <div className={`mb-6 p-4 rounded-lg ${
                        status === 'success' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                        {message}
                    </div>
                )}

                {/* ADD ACCOUNT */}
                <div className="bg-white p-6 mb-6 rounded-xl">
                    <h3 className="font-semibold mb-3">Add M-Pesa Account</h3>

                    <form onSubmit={handleAddAccount} className="space-y-3">
                        <select
                            value={accountType}
                            onChange={(e) => setAccountType(e.target.value as any)}
                            className="w-full border px-3 py-2 rounded"
                        >
                            <option value="till">Till</option>
                            <option value="paybill">Paybill</option>
                        </select>

                        <input
                            placeholder="Shortcode"
                            value={shortcode}
                            onChange={(e) => setShortcode(e.target.value)}
                            className="w-full border px-3 py-2 rounded"
                        />

                        {accountType === 'paybill' && (
                            <input
                                placeholder="Account Name"
                                value={accountName}
                                onChange={(e) => setAccountName(e.target.value)}
                                className="w-full border px-3 py-2 rounded"
                            />
                        )}

                        <button className="bg-blue-600 text-white px-4 py-2 rounded">
                            Add Account
                        </button>
                    </form>
                </div>

                {/* PAY BUSINESS */}
                <div className="bg-white p-6 rounded-xl">
                    <h3 className="font-semibold mb-3">Pay Business</h3>

                    <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full border px-3 py-2 mb-4 rounded"
                    >
                        <option value="till">Till (Buy Goods)</option>
                        <option value="paybill">Paybill</option>
                    </select>

                    {/* AMOUNT */}
                    <input
                        type="number"
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full border px-3 py-2 rounded mb-3"
                    />

                    {/* DESCRIPTION */}
                    <input
                        placeholder="Description (e.g. Sandals)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full border px-3 py-2 rounded mb-3"
                    />

                    {/* CATEGORY */}
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full border px-3 py-2 rounded mb-3"
                    >
                        <option value="Rent">Rent</option>
                        <option value="Groceries">Groceries</option>
                        <option value="Transport">Transport</option>
                        <option value="Bills">Bills</option>
                        <option value="Other">Other</option>
                    </select>

                    {/* TILL */}
                    {paymentMethod === 'till' &&
                        accounts.filter(a => a.account_type === 'till').map(acc => (
                            <div key={acc.id} className="mb-3">
                                <p>Use Till: <b>{acc.shortcode}</b></p>
                            </div>
                        ))
                    }

                    {/* PAYBILL */}
                    {paymentMethod === 'paybill' &&
                        <>
                            {accounts.filter(a => a.account_type === 'paybill').map(acc => (
                                <div key={acc.id} className="mb-2">
                                    <p>Paybill: <b>{acc.shortcode}</b></p>
                                </div>
                            ))}

                            <input
                                placeholder="Account Number"
                                value={accountName}
                                onChange={(e) => setAccountName(e.target.value)}
                                className="w-full border px-3 py-2 rounded mb-3"
                            />
                        </>
                    }

                    <div className="text-xs text-gray-500 mb-3">
                        Complete the payment in M-Pesa, then confirm below.
                    </div>

                    <button
                        onClick={handleRecordPayment}
                        className="w-full bg-green-600 text-white py-2 rounded"
                    >
                        I HAVE PAID
                    </button>
                </div>

            </div>
        </div>
    )
}