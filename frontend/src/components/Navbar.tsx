import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const navLinks = [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/transactions', label: 'Transactions' },
        { path: '/budgets', label: 'Budgets' },
        { path: '/reports', label: 'Reports' },
        { path: '/mpesa', label: 'M-Pesa' },
    ]

    return (
        <nav className="bg-white border-b border-gray-100 px-6 py-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between">

                <Link to="/dashboard" className="text-xl font-bold text-blue-600">
                    FlowWise
                </Link>

                {/* Main Links */}
                <div className="hidden md:flex items-center gap-6">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`text-sm font-medium transition-colors duration-150 ${
                                location.pathname === link.path
                                    ? 'text-blue-600'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            {link.label}
                        </Link>
                    ))}

                    {/*  ADMIN LINK (CONDITIONAL) */}
                    {user?.is_admin && (
                        <Link
                            to="/admin"
                            className={`text-sm font-medium ${
                                location.pathname === '/admin'
                                    ? 'text-purple-600'
                                    : 'text-gray-500 hover:text-purple-600'
                            }`}
                        >
                            Admin
                        </Link>
                    )}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 hidden md:block">
                        {user?.name}
                    </span>

                    <button
                        onClick={handleLogout}
                        className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-150"
                    >
                        Logout
                    </button>
                </div>

            </div>
        </nav>
    )
}