import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, LoginCredentials, SignupCredentials } from '@/types/auth';
import api from '@/lib/api';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (credentials: LoginCredentials) => Promise<void>;
    signup: (credentials: SignupCredentials) => Promise<void>;
    logout: () => void;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (credentials) => {
                set({ isLoading: true, error: null });
                try {
                    // Backend only expects email and password, not role
                    const { email, password } = credentials;
                    const response = await api.post('/auth/login', { email, password });
                    const { user, access_token } = response.data;

                    console.log('[Auth] Login successful:', {
                        userId: user?.id,
                        userRole: user?.role,
                        tokenLength: access_token?.length,
                        tokenPreview: access_token?.substring(0, 20) + '...'
                    });

                    set({
                        user,
                        token: access_token,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null
                    });
                } catch (error: any) {
                    console.error('Login error:', error);
                    let errorMessage = 'Login failed';
                    
                    if (error.request && !error.response) {
                        // Network error - backend not reachable
                        errorMessage = 'Cannot connect to server. Please ensure the backend is running on http://localhost:8000';
                    } else if (error.response) {
                        // Server responded with error
                        errorMessage = error.response.data?.detail || error.response.data?.message || 'Invalid credentials. Please try again.';
                    } else {
                        errorMessage = error.message || 'An unexpected error occurred';
                    }
                    
                    set({
                        error: errorMessage,
                        isLoading: false
                    });
                    throw error;
                }
            },

            signup: async (credentials) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post('/auth/signup', credentials);
                    const { user, access_token } = response.data;

                    console.log('[Auth] Signup successful:', {
                        userId: user?.id,
                        userRole: user?.role,
                        tokenLength: access_token?.length,
                        tokenPreview: access_token?.substring(0, 20) + '...'
                    });

                    set({
                        user,
                        token: access_token,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null
                    });
                } catch (error: any) {
                    console.error('Signup error:', error);
                    let errorMessage = 'Signup failed';
                    
                    if (error.request && !error.response) {
                        // Network error - backend not reachable
                        errorMessage = 'Cannot connect to server. Please ensure the backend is running on http://localhost:8000';
                    } else if (error.response) {
                        // Server responded with error
                        errorMessage = error.response.data?.detail || error.response.data?.message || 'Failed to create account. Please try again.';
                    } else {
                        errorMessage = error.message || 'An unexpected error occurred';
                    }
                    
                    set({
                        error: errorMessage,
                        isLoading: false
                    });
                    throw error;
                }
            },

            logout: () => {
                console.log('[Auth] Logging out, clearing storage');
                set({ user: null, token: null, isAuthenticated: false });
                try {
                    // Clear only our auth storage key if possible
                    localStorage.removeItem('auth-storage');
                    // As a safety net, clear everything in localStorage
                    localStorage.clear();
                } catch (e) {
                    console.warn('[Auth] Failed to clear localStorage on logout:', e);
                }
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    console.log('[Auth] Rehydrated from localStorage:', {
                        hasToken: !!state.token,
                        tokenLength: state.token?.length,
                        hasUser: !!state.user,
                        userRole: state.user?.role,
                        userId: state.user?.id,
                        isAuthenticated: state.isAuthenticated
                    });
                }
            },
        }
    )
);
