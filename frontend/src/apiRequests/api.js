import axios from 'axios';
import { ACCESS_TOKEN } from '../constants';

const api = axios.create({
    baseURL: 'http://localhost:8000',
    withCredentials: true,
});

const getCsrfToken = () => {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : null;
};

const ensureCsrfToken = async () => {
    if (!getCsrfToken()) {
        console.log("Fetching CSRF token...");
        await api.get('/auth/status/');
    }
    return getCsrfToken();
};

api.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (token && token !== "null") {  // Only add header if token is valid
            config.headers.Authorization = `Bearer ${token}`;
        } else if (['post', 'put', 'delete'].includes(config.method.toLowerCase())) {
            const csrfToken = await ensureCsrfToken();
            if (csrfToken) {
                config.headers['X-CSRFToken'] = csrfToken;
            } else {
                console.error("CSRF token unavailable after fetch");
            }
        }
        console.log("Request config:", config); // Debug
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;