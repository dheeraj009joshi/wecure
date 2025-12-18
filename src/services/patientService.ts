import api from '@/lib/api';

export interface Patient {
    id: string;
    user_id: string;
    full_name: string;
    phone: string;
    date_of_birth?: string;
    gender?: string;
    blood_group?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    allergies?: string[];
    chronic_conditions?: string[];
    current_medications?: string;
    avatar_url?: string;
    created_at?: string;
}

export const patientService = {
    getProfile: async () => {
        const response = await api.get<Patient>('/patients/me');
        return response.data;
    },

    updateProfile: async (data: Partial<Patient>) => {
        const response = await api.put<Patient>('/patients/me', data);
        return response.data;
    },

    getById: async (id: string) => {
        // Note: Backend doesn't have a direct endpoint for this
        // We'll need to get patient info from appointments
        // For now, we'll use the appointments endpoint to get patient data
        const response = await api.get<Patient[]>(`/appointments?patient_id=${id}`);
        return response.data;
    }
};
