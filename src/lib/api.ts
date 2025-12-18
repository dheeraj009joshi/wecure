import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const authState = useAuthStore.getState();
        const token = authState.token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            // Only log in development
            if (process.env.NODE_ENV === 'development') {
                console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url} - Token present (${token.length} chars)`);
            }
        } else {
            // Only warn if this is an authenticated endpoint
            if (!config.url?.includes('/auth/login') && !config.url?.includes('/auth/signup') && !config.url?.includes('/availability/doctor/')) {
                console.warn(`[API Request] ${config.method?.toUpperCase()} ${config.url} - NO TOKEN (User: ${authState.user?.email || 'none'})`);
            }
        }
        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

// Response interceptor to handle 401s
api.interceptors.response.use(
    (response) => {
        const url = response.config.url || '';
        // Enhanced logging for availability endpoint
        if (url.includes('/availability/doctor/')) {
            console.log(`[API Response] ${response.config.method?.toUpperCase()} ${url} - Status: ${response.status}`);
            console.log(`[API Response] Data type: ${Array.isArray(response.data) ? 'array' : typeof response.data}`);
            if (Array.isArray(response.data)) {
                console.log(`[API Response] Array length: ${response.data.length}`);
                if (response.data.length > 0) {
                    console.log(`[API Response] First item:`, response.data[0]);
                }
            } else {
                console.log(`[API Response] Data:`, response.data);
            }
        } else {
            console.log(`[API Response] ${response.config.method?.toUpperCase()} ${url} - Status: ${response.status}`);
        }
        return response;
    },
    async (error) => {
        if (error.response) {
            // Server responded with error status
            console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} - Status: ${error.response.status}`, error.response.data);
        } else if (error.request) {
            // Request made but no response
            console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} - No response received`, error.message);
        } else {
            // Error setting up request
            console.error(`[API Error] Request setup failed:`, error.message);
        }

        if (error.response?.status === 401 && !error.config?._retry) {
            console.warn('[API] 401 Unauthorized - Logging out');
            error.config._retry = true;
            useAuthStore.getState().logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
