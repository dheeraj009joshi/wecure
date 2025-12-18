import api from '@/lib/api';
import { Doctor } from './doctorService';
import { Patient } from './patientService';
import { Appointment } from './appointmentService';

export interface AdminStats {
    total_patients: number;
    total_doctors: number;
    total_appointments: number;
    pending_doctors: number;
}

export const adminService = {
    getStats: async (): Promise<AdminStats> => {
        const response = await api.get('/admin/dashboard');
        return response.data;
    },

    getPendingDoctors: async (): Promise<Doctor[]> => {
        const response = await api.get('/admin/doctors/pending');
        return response.data;
    },

    getAllDoctors: async (status?: string, search?: string): Promise<Doctor[]> => {
        const params: any = {};
        if (status) params.status = status;
        if (search) params.search = search;
        const response = await api.get('/admin/doctors', { params });
        return response.data;
    },

    getAllPatients: async (search?: string): Promise<Patient[]> => {
        const params: any = {};
        if (search) params.search = search;
        const response = await api.get('/admin/patients', { params });
        return response.data;
    },

    getAllAppointments: async (status?: string): Promise<Appointment[]> => {
        const params: any = {};
        if (status) params.status = status;
        const response = await api.get('/admin/appointments', { params });
        return response.data;
    },

    verifyDoctor: async (doctorId: string): Promise<void> => {
        await api.put(`/admin/doctors/${doctorId}/verify`);
    },

    suspendDoctor: async (doctorId: string): Promise<void> => {
        await api.put(`/admin/doctors/${doctorId}/suspend`);
    },

    updateDoctor: async (doctorId: string, data: Partial<Doctor>): Promise<Doctor> => {
        const response = await api.put(`/admin/doctors/${doctorId}`, data);
        return response.data;
    },

    updatePatient: async (patientId: string, data: Partial<Patient>): Promise<Patient> => {
        const response = await api.put(`/admin/patients/${patientId}`, data);
        return response.data;
    },

    getPatientById: async (patientId: string): Promise<Patient> => {
        const response = await api.get(`/admin/patients/${patientId}`);
        return response.data;
    },

    getPatientAppointments: async (patientId: string): Promise<Appointment[]> => {
        const response = await api.get(`/admin/patients/${patientId}/appointments`);
        return response.data;
    },

    getAppointmentById: async (appointmentId: string): Promise<Appointment> => {
        const response = await api.get(`/admin/appointments/${appointmentId}`);
        return response.data;
    },

    getDoctorById: async (doctorId: string): Promise<Doctor> => {
        const response = await api.get(`/admin/doctors/${doctorId}`);
        return response.data;
    }
};
