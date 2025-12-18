import api from '@/lib/api';

export interface DoctorAnalytics {
    revenue: {
        total: number;
        this_month: number;
    };
    appointments: {
        total: number;
        completed: number;
    };
    patients: {
        total: number;
        new_this_month: number;
    };
    rating: number;
}

export const analyticsService = {
    getDoctorAnalytics: async () => {
        const response = await api.get<DoctorAnalytics>('/analytics/doctor/overview');
        return response.data;
    }
};

