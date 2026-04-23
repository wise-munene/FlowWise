import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
    const { user, logout } = useAuth()
    const { isDark, toggleTheme } = useTheme()
    const navigate  = useNavigate()
    const location  = useLocation()
    const [menuOpen, setMenuOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const navLinks = [
        { path: '/dashboard',    label: 'Dashboard' },
        { path: '/transactions', label: 'Transactions' },
        { path: '/budgets',      label: 'Budgets' },
        { path: '/reports',      label: 'Reports' },
        { path: '/mpesa',        label: 'M-Pesa' },
    ]

    const activeClass = 'text-blue-600 dark:text-blue-400'
    const inactiveClass = 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'

    return (
        <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 px-4 py-3 transition-colors duration-300 relative z-40">
            <div className="max-w-6xl mx-auto flex items-center justify-between">

                {/* Logo */}
                <Link to="/dashboard" className="text-xl font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
                    FlowWise
                </Link>

                {/* Desktop links */}
                <div className="hidden md:flex items-center gap-6">
                    {navLinks.map(link => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`text-sm font-medium transition-colors duration-150 ${location.pathname === link.path ? activeClass : inactiveClass}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    {user?.is_admin && (
                        <Link to="/admin" className={`text-sm font-medium ${location.pathname === '/admin' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'}`}>
                            Admin
                        </Link>
                    )}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400 hidden lg:block truncate max-w-32">
                        {user?.name}
                    </span>

                    {/* Dark mode toggle */}
                    <button
                        onClick={toggleTheme}
                        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-yellow-300 transition-colors"
                    >
                        {isDark ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
                            </svg>
                        )}
                    </button>

                    {/* Logout — desktop only */}
                    <button
                        onClick={handleLogout}
                        className="hidden md:block text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg transition-colors"
                    >
                        Logout
                    </button>

                    {/* Hamburger — mobile only (FIX UX-04) */}
                    <button
                        onClick={() => setMenuOpen(o => !o)}
                        aria-label="Toggle menu"
                        className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        <span className={`block w-5 h-0.5 bg-gray-700 dark:bg-gray-200 transition-transform duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                        <span className={`block w-5 h-0.5 bg-gray-700 dark:bg-gray-200 transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
                        <span className={`block w-5 h-0.5 bg-gray-700 dark:bg-gray-200 transition-transform duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Mobile drawer (FIX UX-04) */}
            {menuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 shadow-lg px-4 py-3 flex flex-col gap-1">
                    {navLinks.map(link => (
                        <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setMenuOpen(false)}
                            className={`text-sm font-medium px-3 py-2.5 rounded-lg transition-colors ${
                                location.pathname === link.path
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    {user?.is_admin && (
                        <Link
                            to="/admin"
                            onClick={() => setMenuOpen(false)}
                            className="text-sm font-medium px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            Admin
                        </Link>
                    )}
                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{user?.name}</span>
                        <button onClick={handleLogout} className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-lg">
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </nav>
    )
}