import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        //  Handle network errors
        if (!error.response) {
            console.error("Network error or server down")
            return Promise.reject(error)
        }

        //  Handle unauthorized
        if (error.response.status === 401) {
            localStorage.removeItem('access_token')
            localStorage.removeItem('user')
            window.location.href = '/login'
        }

        // Log other errors
        console.error("API Error:", error.response.data || error.message)

        return Promise.reject(error)
    }
)

export default api