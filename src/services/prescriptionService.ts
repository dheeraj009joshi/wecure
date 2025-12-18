import api from '@/lib/api';

export interface Medicine {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
}

export interface Prescription {
    id: string;
    prescription_number: string;
    appointment_id: string;
    doctor_id: string;
    patient_id: string;
    medicines: Medicine[];
    instructions?: string;
    pdf_url?: string;
    created_at: string;
}

export const prescriptionService = {
    getAll: async (appointmentId?: string) => {
        const params = appointmentId ? { appointment_id: appointmentId } : {};
        const response = await api.get<Prescription[]>('/prescriptions', { params });
        return response.data;
    },

    getMyPrescriptions: async () => {
        const response = await api.get<Prescription[]>('/prescriptions/me');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<Prescription>(`/prescriptions/${id}`);
        return response.data;
    },

    create: async (data: {
        appointment_id: string;
        medicines: Medicine[];
        instructions?: string;
    }) => {
        const response = await api.post<Prescription>('/prescriptions', data);
        return response.data;
    },

    getPatientPrescriptions: async (patientId: string) => {
        // Get all prescriptions and filter by patient_id
        const allPrescriptions = await api.get<Prescription[]>('/prescriptions');
        return allPrescriptions.data.filter(pres => pres.patient_id === patientId);
    }
};

