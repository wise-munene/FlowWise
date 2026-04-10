import  type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-400 text-sm">Loading...</p>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />
    }

    return <>{children}</>
}