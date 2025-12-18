import api from '@/lib/api';

export interface TimeSlot {
    start_time: string;
    end_time: string;
    status?: string;
    appointment_id?: string;
}

export interface DayAvailability {
    id?: string;
    doctor_id?: string;
    day_of_week: string;
    is_available: boolean;
    slots: TimeSlot[];
}

export interface TimeRange {
    start_time: string;
    end_time: string;
}

const availabilityService = {
    // Get doctor's weekly availability
    async getAvailability(): Promise<DayAvailability[]> {
        const response = await api.get('/availability');
        return response.data;
    },

    // Create or update availability for a day using time ranges
    async setAvailability(dayOfWeek: string, isAvailable: boolean, timeRanges: TimeRange[]): Promise<DayAvailability> {
        const response = await api.post('/availability/set', {
            day_of_week: dayOfWeek,
            is_available: isAvailable,
            time_ranges: timeRanges
        });
        return response.data;
    },

    // Add individual slot to a day
    async addSlot(dayOfWeek: string, startTime: string, endTime: string): Promise<DayAvailability> {
        const response = await api.post(`/availability/${dayOfWeek}/add-slot`, {
            start_time: startTime,
            end_time: endTime
        });
        return response.data;
    },

    // Remove individual slot from a day
    async removeSlot(dayOfWeek: string, startTime: string): Promise<DayAvailability> {
        const response = await api.post(`/availability/${dayOfWeek}/remove-slot`, {
            start_time: startTime
        });
        return response.data;
    },

    // Legacy method for backward compatibility - converts slots to time ranges
    async updateAvailability(data: DayAvailability): Promise<DayAvailability> {
        // Convert slots to time ranges
        const timeRanges: TimeRange[] = [];
        const sortedSlots = [...(data.slots || [])].sort((a, b) => 
            a.start_time.localeCompare(b.start_time)
        );

        if (sortedSlots.length > 0) {
            let currentRange: TimeRange | null = null;
            for (const slot of sortedSlots) {
                if (!currentRange) {
                    currentRange = { start_time: slot.start_time, end_time: slot.end_time };
                } else if (currentRange.end_time === slot.start_time) {
                    // Merge consecutive slots
                    currentRange.end_time = slot.end_time;
                } else {
                    // Save current range and start new one
                    timeRanges.push(currentRange);
                    currentRange = { start_time: slot.start_time, end_time: slot.end_time };
                }
            }
            if (currentRange) {
                timeRanges.push(currentRange);
            }
        }

        return this.setAvailability(data.day_of_week, data.is_available, timeRanges);
    },

    // Delete availability for a day
    async deleteAvailability(dayOfWeek: string): Promise<void> {
        await api.delete(`/availability/${dayOfWeek}`);
    },

    // Get available slots for a doctor on a specific date (public endpoint)
    async getDoctorAvailabilityForDate(doctorId: string, appointmentDate: string): Promise<TimeSlot[]> {
        console.log('[Availability Service] Requesting slots:', {
            doctorId,
            appointmentDate,
            url: `/availability/doctor/${doctorId}`,
            params: { appointment_date: appointmentDate }
        });
        
        try {
            const response = await api.get(`/availability/doctor/${doctorId}`, {
                params: { appointment_date: appointmentDate }
            });
            
            console.log('[Availability Service] Response received:', {
                status: response.status,
                dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
                dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
                data: response.data
            });
            
            // Ensure we return an array
            const slots = Array.isArray(response.data) ? response.data : [];
            console.log('[Availability Service] Returning slots:', slots.length, 'slots');
            if (slots.length > 0) {
                console.log('[Availability Service] First 3 slots:', slots.slice(0, 3));
            }
            
            return slots;
        } catch (error: any) {
            console.error('[Availability Service] Error fetching slots:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                url: error.config?.url
            });
            throw error;
        }
    },
};

export default availabilityService;
