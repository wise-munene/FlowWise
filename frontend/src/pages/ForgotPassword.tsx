import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await api.post('/auth/forgot-password', { email })
            setMessage('If this email exists you will receive a reset link shortly.')
        } catch {
            setMessage('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-600">FlowWise</h1>
                    <p className="text-gray-500 mt-2">Reset your password</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    {message ? (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
                            {message}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg transition-colors"
                            >
                                {loading ? 'Sending...' : 'Send reset link'}
                            </button>
                        </form>
                    )}
                    <p className="text-center text-sm text-gray-500 mt-6">
                        Remember your password?{' '}
                        <Link to="/login" className="text-blue-600 hover:underline font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}