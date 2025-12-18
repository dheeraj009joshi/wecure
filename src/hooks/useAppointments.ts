import { useMemo, useCallback } from 'react';
import { useApiCall } from './useApiCall';
import { appointmentService, Appointment } from '@/services/appointmentService';

interface AppointmentStats {
  total: number;
  upcoming: number;
  completed: number;
  pending: number;
  cancelled: number;
}

interface UseAppointmentsReturn {
  appointments: Appointment[];
  stats: AppointmentStats;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  upcomingAppointments: Appointment[];
}

/**
 * Hook for fetching and managing patient appointments
 * Automatically calculates stats and filters upcoming appointments
 */
export function useAppointments(options?: { immediate?: boolean }): UseAppointmentsReturn {
  // Memoize the API function to prevent recreation on every render
  const fetchAppointments = useMemo(
    () => () => appointmentService.getPatientAppointments(),
    []
  );

  const {
    data: appointmentsData,
    loading,
    error,
    execute: refetch,
  } = useApiCall<Appointment[]>(fetchAppointments, {
    immediate: options?.immediate !== false, // Default to true
    timeout: 10000,
  });

  // Ensure appointments is always an array
  const appointments = useMemo(() => {
    return Array.isArray(appointmentsData) ? appointmentsData : [];
  }, [appointmentsData]);

  // Calculate stats
  const stats = useMemo<AppointmentStats>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = appointments.filter((apt) => {
      const aptDate = new Date(apt.appointment_date);
      aptDate.setHours(0, 0, 0, 0);
      return (
        aptDate >= today &&
        apt.status !== 'cancelled' &&
        apt.status !== 'completed'
      );
    });

    const completed = appointments.filter((apt) => apt.status === 'completed');
    const pending = appointments.filter(
      (apt) => apt.status === 'pending' || apt.status === 'confirmed'
    );
    const cancelled = appointments.filter((apt) => apt.status === 'cancelled');

    return {
      total: appointments.length,
      upcoming: upcoming.length,
      completed: completed.length,
      pending: pending.length,
      cancelled: cancelled.length,
    };
  }, [appointments]);

  // Get upcoming appointments (sorted by date/time)
  const upcomingAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return appointments
      .filter((apt) => {
        const aptDate = new Date(apt.appointment_date);
        aptDate.setHours(0, 0, 0, 0);
        return (
          aptDate >= today &&
          apt.status !== 'cancelled' &&
          apt.status !== 'completed'
        );
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
        const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
        return dateA.getTime() - dateB.getTime();
      });
  }, [appointments]);

  return {
    appointments,
    stats,
    loading,
    error,
    refetch,
    upcomingAppointments,
  };
}

// Export helper to get upcoming appointments
export function useUpcomingAppointments(limit?: number) {
  const { appointments, loading, error } = useAppointments();

  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingList = appointments
      .filter((apt) => {
        const aptDate = new Date(apt.appointment_date);
        aptDate.setHours(0, 0, 0, 0);
        return (
          aptDate >= today &&
          apt.status !== 'cancelled' &&
          apt.status !== 'completed'
        );
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
        const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
        return dateA.getTime() - dateB.getTime();
      });

    return limit ? upcomingList.slice(0, limit) : upcomingList;
  }, [appointments, limit]);

  return {
    appointments: upcoming,
    loading,
    error,
  };
}

