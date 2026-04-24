import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
    const { user, logout } = useAuth()
    const { isDark, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const location = useLocation()
    const [menuOpen, setMenuOpen] = useState(false)

    const handleLogout = () => { logout(); navigate('/login') }

    const navLinks = [
        { path: '/dashboard',    label: 'Dashboard',    icon: '📊' },
        { path: '/transactions', label: 'Transactions', icon: '💳' },
        { path: '/budgets',      label: 'Budgets',      icon: '🎯' },
        { path: '/reports',      label: 'Reports',      icon: '📄' },
        { path: '/mpesa',        label: 'M-Pesa',       icon: '📱' },
    ]

    return (
        <>
            {/* Top navbar */}
            <nav style={{
                background: isDark ? '#1f2937' : '#ffffff',
                borderBottom: `1px solid ${isDark ? '#374151' : '#f0f0f0'}`,
                padding: '0 16px',
                height: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 50,
                fontFamily: "'Inter', sans-serif",
            }}>
                {/* Logo */}
                <Link to="/dashboard" style={{
                    fontSize: 18, fontWeight: 700,
                    color: isDark ? '#60a5fa' : '#2563eb',
                    textDecoration: 'none', letterSpacing: '-0.5px', flexShrink: 0,
                }}>
                    FlowWise
                </Link>

                {/* Desktop links */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
                    {navLinks.map(link => {
                        const active = location.pathname === link.path
                        return (
                            <Link key={link.path} to={link.path} style={{
                                fontSize: 13, fontWeight: 500, textDecoration: 'none',
                                padding: '6px 12px', borderRadius: 8, transition: 'all 0.15s',
                                color: active ? (isDark ? '#60a5fa' : '#2563eb') : (isDark ? '#9ca3af' : '#6b7280'),
                                background: active ? (isDark ? '#1e3a8a' : '#eff6ff') : 'transparent',
                            }}>
                                {link.label}
                            </Link>
                        )
                    })}
                    {user?.is_admin && (
                        <Link to="/admin" style={{
                            fontSize: 13, fontWeight: 500, textDecoration: 'none',
                            padding: '6px 12px', borderRadius: 8, transition: 'all 0.15s',
                            color: location.pathname === '/admin' ? '#7c3aed' : (isDark ? '#9ca3af' : '#6b7280'),
                            background: location.pathname === '/admin' ? (isDark ? '#2e1065' : '#f5f3ff') : 'transparent',
                        }}>Admin</Link>
                    )}
                </div>

                {/* Right controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: isDark ? '#6b7280' : '#9ca3af', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="desktop-only">
                        {user?.name}
                    </span>

                    {/* Theme toggle */}
                    <button onClick={toggleTheme} style={{
                        width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: isDark ? '#374151' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, transition: 'background 0.15s',
                    }}>
                        {isDark ? '☀️' : '🌙'}
                    </button>

                    {/* Desktop logout */}
                    <button onClick={handleLogout} style={{
                        fontSize: 13, fontWeight: 500, padding: '7px 14px', borderRadius: 9,
                        border: 'none', cursor: 'pointer', transition: 'background 0.15s',
                        background: isDark ? '#374151' : '#f3f4f6',
                        color: isDark ? '#d1d5db' : '#374151',
                    }} className="desktop-only">
                        Logout
                    </button>

                    {/* Mobile hamburger */}
                    <button onClick={() => setMenuOpen(o => !o)} style={{
                        width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: isDark ? '#374151' : '#f3f4f6',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                        flexShrink: 0,
                    }} className="mobile-only">
                        <span style={{ display: 'block', width: 18, height: 2, background: isDark ? '#d1d5db' : '#374151', borderRadius: 2, transition: 'transform 0.2s', transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
                        <span style={{ display: 'block', width: 18, height: 2, background: isDark ? '#d1d5db' : '#374151', borderRadius: 2, transition: 'opacity 0.2s', opacity: menuOpen ? 0 : 1 }} />
                        <span style={{ display: 'block', width: 18, height: 2, background: isDark ? '#d1d5db' : '#374151', borderRadius: 2, transition: 'transform 0.2s', transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
                    </button>
                </div>
            </nav>

            {/* Mobile menu drawer */}
            {menuOpen && (
                <div style={{
                    position: 'fixed', top: 56, left: 0, right: 0, bottom: 0,
                    background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(4px)', zIndex: 49,
                }} onClick={() => setMenuOpen(false)} />
            )}

            <div style={{
                position: 'fixed', top: 56, right: 0, bottom: 0, width: 260,
                background: isDark ? '#1f2937' : '#ffffff',
                borderLeft: `1px solid ${isDark ? '#374151' : '#f0f0f0'}`,
                zIndex: 50, transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
                display: 'flex', flexDirection: 'column',
                fontFamily: "'Inter', sans-serif",
                overflowY: 'auto',
            }}>
                <div style={{ padding: '16px 16px 8px' }}>
                    <p style={{ fontSize: 12, color: isDark ? '#6b7280' : '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 12px' }}>
                        {user?.name}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {navLinks.map(link => {
                            const active = location.pathname === link.path
                            return (
                                <Link key={link.path} to={link.path} onClick={() => setMenuOpen(false)} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '12px 14px', borderRadius: 12, textDecoration: 'none',
                                    transition: 'all 0.15s',
                                    background: active ? (isDark ? '#1e3a8a' : '#eff6ff') : 'transparent',
                                    color: active ? (isDark ? '#60a5fa' : '#2563eb') : (isDark ? '#d1d5db' : '#374151'),
                                    fontWeight: active ? 600 : 400, fontSize: 15,
                                }}>
                                    <span style={{ fontSize: 20 }}>{link.icon}</span>
                                    {link.label}
                                </Link>
                            )
                        })}
                        {user?.is_admin && (
                            <Link to="/admin" onClick={() => setMenuOpen(false)} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '12px 14px', borderRadius: 12, textDecoration: 'none',
                                color: isDark ? '#d1d5db' : '#374151', fontSize: 15,
                            }}>
                                <span style={{ fontSize: 20 }}>⚙️</span> Admin
                            </Link>
                        )}
                    </div>
                </div>

                <div style={{ marginTop: 'auto', padding: 16, borderTop: `1px solid ${isDark ? '#374151' : '#f0f0f0'}` }}>
                    <button onClick={handleLogout} style={{
                        width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                        background: isDark ? '#374151' : '#f3f4f6', color: isDark ? '#d1d5db' : '#374151',
                        fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                    }}>
                        Logout
                    </button>
                </div>
            </div>

            <style>{`
                @media (min-width: 768px) {
                    .desktop-nav { display: flex !important; }
                    .desktop-only { display: block !important; }
                    .mobile-only { display: none !important; }
                }
                @media (max-width: 767px) {
                    .desktop-nav { display: none !important; }
                    .desktop-only { display: none !important; }
                    .mobile-only { display: flex !important; }
                }
            `}</style>
        </>
    )
}
