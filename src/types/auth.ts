export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    // Optional profile fields that might be merged
    name?: string;
    avatar?: string;
    full_name?: string;
    phone?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
    role?: UserRole;
}

export interface SignupCredentials {
    email: string;
    password: string;
    full_name: string;
    phone: string;
    role: UserRole;
    specialization?: string;
    qualification?: string;
    registration_number?: string;
    experience_years?: number;
    available_from?: string;
    available_to?: string;
}
