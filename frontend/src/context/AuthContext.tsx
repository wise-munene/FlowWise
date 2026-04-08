import { createContext, useContext, useState, useEffect } from 'react'
import type{ReactNode} from 'react'

interface User {
    id: number
    name: string
    email: string
    account_type: string
}

interface AuthContextType {
    user: User | null
    token: string | null
    login: (token: string, user: User) => void
    logout: () => void
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)

    useEffect(() => {
        const savedToken = localStorage.getItem('access_token')
        const savedUser = localStorage.getItem('user')
        if (savedToken && savedUser) {
            setToken(savedToken)
            setUser(JSON.parse(savedUser))
        }
    }, [])

    const login = (token: string, user: User) => {
        localStorage.setItem('access_token', token)
        localStorage.setItem('user', JSON.stringify(user))
        setToken(token)
        setUser(user)
    }

    const logout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        setToken(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}