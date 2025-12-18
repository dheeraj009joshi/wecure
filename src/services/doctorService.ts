import api from '@/lib/api';

export interface Doctor {
    id: string;
    full_name: string;
    phone: string;
    email?: string; // From user relation
    specialties: string[];
    qualification: string;
    registration_number: string;
    experience_years: number;
    bio?: string;
    avatar_url?: string;
    education?: string;
    clinic_name?: string;
    clinic_address?: string;
    city?: string;
    state?: string;
    video_consultation_fee: number;
    in_person_consultation_fee: number;
    average_rating: number;
    total_reviews: number;
    status: string;
}

export const doctorService = {
    getAll: async () => {
        const response = await api.get<Doctor[]>('/doctors');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<Doctor>(`/doctors/${id}`);
        return response.data;
    },

    getProfile: async () => {
        const response = await api.get<Doctor>('/doctors/me');
        return response.data;
    },

    updateProfile: async (data: Partial<Doctor>) => {
        const response = await api.put<Doctor>('/doctors/me', data);
        return response.data;
    }
};
