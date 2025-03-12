import axios from 'axios';
import { ACCESS_TOKEN } from '../constants';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true, // Send cookies (sessionid, csrftoken)
});

// Fetch CSRF token once and store it
const getCsrfToken = async () => {
    const response = await api.get('/csrf/'); // Endpoint to get CSRF token
    const csrfToken = response.data.csrftoken || document.cookie.match(/csrftoken=([^;]+)/)?.[1];
    return csrfToken;
};

api.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`; // JWT for normal login
        } else if (config.method === 'post' || config.method === 'put' || config.method === 'delete') {
            // For session auth (Google), add CSRF token
            const csrfToken = await getCsrfToken();
            if (csrfToken) {
                config.headers['X-CSRFToken'] = csrfToken;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;