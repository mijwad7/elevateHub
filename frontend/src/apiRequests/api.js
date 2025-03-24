import axios from 'axios';
import { ACCESS_TOKEN } from '../constants';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
    withCredentials: true,
});

let cachedCsrfToken = null;

const getCsrfToken = async () => {
    if (cachedCsrfToken) return cachedCsrfToken;

    const cookieMatch = document.cookie.match(/csrftoken=([^;]+)/);
    if (cookieMatch) {
        cachedCsrfToken = cookieMatch[1];
        console.log("CSRF token from cookie:", cachedCsrfToken);
        return cachedCsrfToken;
    }

    try {
        const response = await api.get('/csrf/', { withCredentials: true });
        cachedCsrfToken = response.data.csrftoken;
        console.log("Fetched CSRF token:", cachedCsrfToken);
        // Verify cookie was set
        const newCookieMatch = document.cookie.match(/csrftoken=([^;]+)/);
        if (!newCookieMatch) {
            console.warn("CSRF cookie not set after fetch");
        }
        return cachedCsrfToken;
    } catch (error) {
        console.error("Failed to fetch CSRF token:", error);
        return null;
    }
};

// Preload CSRF token
export const initializeCsrfToken = async () => {
    if (!cachedCsrfToken) {
        await getCsrfToken();
    }
};

// Interceptor
api.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        console.log("Interceptor - Token:", token, "Method:", config.method);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else if (['post', 'put', 'delete'].includes(config.method.toLowerCase())) {
            const csrfToken = await getCsrfToken();
            if (csrfToken) {
                config.headers['X-CSRFToken'] = csrfToken;
                console.log("Added X-CSRFToken:", csrfToken);
            } else {
                console.warn("CSRF token unavailable");
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;