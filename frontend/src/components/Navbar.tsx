import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
    const { user, logout } = useAuth()
    const { isDark, toggleTheme } = useTheme()
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
        <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 px-6 py-4 transition-colors duration-300">
            <div className="max-w-6xl mx-auto flex items-center justify-between">

                <Link to="/dashboard" className="text-xl font-bold text-blue-600 dark:text-blue-400">
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
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            {link.label}
                        </Link>
                    ))}

                    {/* ADMIN LINK (CONDITIONAL) */}
                    {user?.is_admin && (
                        <Link
                            to="/admin"
                            className={`text-sm font-medium ${
                                location.pathname === '/admin'
                                    ? 'text-purple-600 dark:text-purple-400'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
                            }`}
                        >
                            Admin
                        </Link>
                    )}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400 hidden md:block">
                        {user?.name}
                    </span>

                    {/* Dark / Light Mode Toggle */}
                    <button
                        onClick={toggleTheme}
                        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        className="relative w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-yellow-300 transition-colors duration-200"
                    >
                        {isDark ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
                            </svg>
                        )}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors duration-150"
                    >
                        Logout
                    </button>
                </div>

            </div>
        </nav>
    )
}