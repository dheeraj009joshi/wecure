import api from '@/lib/api';
import { Doctor } from './doctorService';

export interface Appointment {
    id: string;
    appointment_number: string;
    doctor_id: string;
    patient_id: string;
    appointment_date: string;
    appointment_time: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    appointment_type: 'video' | 'in_person';
    chief_complaint?: string;
    symptoms?: string[];
    diagnosis?: string;
    consultation_notes?: string;
    blood_pressure?: string;
    heart_rate?: string;
    temperature?: string;
    weight?: string;
    follow_up_required?: boolean;
    follow_up_date?: string;
    created_at?: string;
    doctor?: Doctor;
    patient?: {
        id: string;
        full_name: string;
        phone?: string;
        email?: string;
        date_of_birth?: string;
        gender?: string;
        avatar_url?: string;
    };
}

export const appointmentService = {
    create: async (data: any) => {
        const response = await api.post<Appointment>('/appointments', data);
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<Appointment>(`/appointments/${id}`);
        return response.data;
    },

    getMyAppointments: async () => {
        // Determine endpoint based on role (this logic might need to be handled by checking user role in store)
        // For now, let's assume we have separate services or endpoints
        // But backend has /patients/me/appointments and /doctors/me/appointments
        // We'll expose both here or let the component decide
        return [];
    },

    getPatientAppointments: async () => {
        const response = await api.get<Appointment[]>('/patients/me/appointments');
        return response.data;
    },

    getDoctorAppointments: async () => {
        const response = await api.get<Appointment[]>('/doctors/me/appointments');
        return response.data;
    },

    updateStatus: async (id: string, status: string) => {
        const response = await api.put<Appointment>(`/appointments/${id}`, { status });
        return response.data;
    },

    update: async (id: string, data: {
        status?: string;
        diagnosis?: string;
        consultation_notes?: string;
        blood_pressure?: string;
        heart_rate?: string;
        temperature?: string;
        weight?: string;
        follow_up_required?: boolean;
        follow_up_date?: string;
    }) => {
        const response = await api.put<Appointment>(`/appointments/${id}`, data);
        return response.data;
    },

    cancel: async (id: string, cancellation_reason?: string) => {
        const response = await api.post<Appointment>(`/appointments/${id}/cancel`, { cancellation_reason });
        return response.data;
    }
};
