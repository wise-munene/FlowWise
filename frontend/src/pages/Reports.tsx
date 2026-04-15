import { useState } from 'react'
import Navbar from '../components/Navbar'

export default function Reports() {
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [loading, setLoading] = useState<'csv' | 'pdf' | null>(null)

    const token = localStorage.getItem('access_token')

    const buildUrl = (type: 'csv' | 'pdf') => {
        let url = `${import.meta.env.VITE_API_URL}/reports/${type}`
        const params = []
        if (startDate) params.push(`start_date=${startDate}`)
        if (endDate) params.push(`end_date=${endDate}`)
        if (params.length) url += `?${params.join('&')}`
        return url
    }

    const handleDownload = async (type: 'csv' | 'pdf') => {
        setLoading(type)
        try {
            const response = await fetch(buildUrl(type), {
                headers: { Authorization: `Bearer ${token}` }
            })
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
            setLoading(null)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-2xl mx-auto px-6 py-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Reports</h2>

                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                        Filter by date range (optional)
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {/* CSV */}
                        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-gray-800">CSV Export</p>
                                <p className="text-xs text-gray-400">Raw data — open in Excel or Google Sheets</p>
                            </div>
                            <button
                                onClick={() => handleDownload('csv')}
                                disabled={loading === 'csv'}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                            >
                                {loading === 'csv' ? 'Downloading...' : 'Download CSV'}
                            </button>
                        </div>

                        {/* PDF */}
                        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-gray-800">PDF Report</p>
                                <p className="text-xs text-gray-400">Formatted report — share with clients or bank</p>
                            </div>
                            <button
                                onClick={() => handleDownload('pdf')}
                                disabled={loading === 'pdf'}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                            >
                                {loading === 'pdf' ? 'Downloading...' : 'Download PDF'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}