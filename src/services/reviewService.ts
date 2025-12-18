import api from '@/lib/api';

export interface Review {
    id: string;
    doctor_id: string;
    patient_id: string;
    appointment_id: string;
    rating: number;
    comment?: string;
    created_at: string;
    patient?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
}

export const reviewService = {
    getMyReviews: async () => {
        const response = await api.get<Review[]>('/reviews/me');
        return response.data;
    },

    getDoctorReviews: async (doctorId: string) => {
        const response = await api.get<Review[]>(`/reviews/doctor/${doctorId}`);
        return response.data;
    },

    create: async (data: {
        doctor_id: string;
        appointment_id: string;
        rating: number;
        comment?: string;
    }) => {
        const response = await api.post<Review>('/reviews', data);
        return response.data;
    },

    update: async (reviewId: string, data: { rating?: number; comment?: string }) => {
        const response = await api.put<Review>(`/reviews/${reviewId}`, data);
        return response.data;
    },

    delete: async (reviewId: string) => {
        await api.delete(`/reviews/${reviewId}`);
    }
};

