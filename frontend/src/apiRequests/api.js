import axios from 'axios';
import { ACCESS_TOKEN } from '../constants';

const api = axios.create({
    baseURL: 'http://localhost:8000',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

const getCsrfToken = () => {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : null;
};

const ensureCsrfToken = async () => {
    if (!getCsrfToken()) {
        console.log("Fetching CSRF token...");
        await api.get('/csrf/');
    }
    return getCsrfToken();
};

api.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (token && token !== "null") {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Always add CSRF token for POST, PUT, DELETE requests
        if (['post', 'put', 'delete'].includes(config.method.toLowerCase())) {
            const csrfToken = await ensureCsrfToken();
            if (csrfToken) {
                config.headers['X-CSRFToken'] = csrfToken;
            }
        }
        
        // For multipart/form-data requests, let the browser set the content type
        if (config.headers['Content-Type'] === 'multipart/form-data') {
            delete config.headers['Content-Type'];
        }
        
        console.log("Request config:", config); // Debug
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;