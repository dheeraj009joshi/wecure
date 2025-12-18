import { create } from 'zustand'

export interface BookingState {
    consultationType: 'zoom' | 'meet' | 'in-person' | null
    selectedDate: Date | null
    selectedSlot: string | null
    patientName: string
    patientAge: string
    patientGender: string
    relationship: string
    symptoms: string
    uploadedFiles: File[]

    setConsultationType: (type: 'zoom' | 'meet' | 'in-person') => void
    setDateTime: (date: Date, slot: string) => void
    setPatientDetails: (details: {
        name: string
        age: string
        gender: string
        relationship: string
        symptoms: string
    }) => void
    setUploadedFiles: (files: File[]) => void
    resetBooking: () => void
}

export const useBookingStore = create<BookingState>((set) => ({
    consultationType: null,
    selectedDate: null,
    selectedSlot: null,
    patientName: '',
    patientAge: '',
    patientGender: '',
    relationship: 'self',
    symptoms: '',
    uploadedFiles: [],

    setConsultationType: (type) => set({ consultationType: type }),
    setDateTime: (date, slot) => set({ selectedDate: date, selectedSlot: slot }),
    setPatientDetails: (details) => set({
        patientName: details.name,
        patientAge: details.age,
        patientGender: details.gender,
        relationship: details.relationship,
        symptoms: details.symptoms,
    }),
    setUploadedFiles: (files) => set({ uploadedFiles: files }),
    resetBooking: () => set({
        consultationType: null,
        selectedDate: null,
        selectedSlot: null,
        patientName: '',
        patientAge: '',
        patientGender: '',
        relationship: 'self',
        symptoms: '',
        uploadedFiles: [],
    }),
}))
