'use client';

import { useEffect, useState } from 'react';
import { StatsCards } from '@/components/doctor/StatsCards';
import { TodaySchedule } from '@/components/doctor/TodaySchedule';
import { useAuthStore } from '@/store/authStore';
import { doctorService } from '@/services/doctorService';
import { appointmentService } from '@/services/appointmentService';
import { Users, Calendar, Activity, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { AvailabilitySetupModal } from "@/components/doctor/AvailabilitySetupModal";
import availabilityService from "@/services/availabilityService";

export default function DoctorDashboard() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState({
        totalPatients: 0,
        appointmentsToday: 0,
        totalAppointments: 0,
        rating: 0,
    });
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
    const { toast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [myAppointments, profile] = await Promise.all([
                appointmentService.getDoctorAppointments(),
                doctorService.getProfile()
            ]);

            const today = new Date().toISOString().split('T')[0];
            const todayAppointments = myAppointments.filter((apt: any) => {
                const aptDate = apt.appointment_date;
                return aptDate === today || aptDate?.split('T')[0] === today;
            });

            // Get unique patient IDs
            const uniquePatientIds = new Set(myAppointments.map((apt: any) => apt.patient_id).filter(Boolean));
            
            setStats({
                totalPatients: uniquePatientIds.size,
                appointmentsToday: todayAppointments.length,
                totalAppointments: myAppointments.length,
                rating: profile.average_rating || 0,
            });

            setAppointments(myAppointments); // Store all appointments
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            toast({
                title: "Error",
                description: "Failed to load dashboard data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    if (loading) {
        return <div className="p-8">Loading dashboard...</div>;
    }

    const formattedStats = [
        {
            title: "Total Patients",
            value: stats.totalPatients.toString(),
            change: "+12%", // Mock change for now
            trend: "up" as const,
            icon: Users,
            iconColor: "bg-blue-500",
        },
        {
            title: "Appointments Today",
            value: stats.appointmentsToday.toString(),
            change: "+4%",
            trend: "up" as const,
            icon: Calendar,
            iconColor: "bg-purple-500",
        },
        {
            title: "Total Appointments",
            value: stats.totalAppointments.toString(),
            change: "+23%",
            trend: "up" as const,
            icon: Activity,
            iconColor: "bg-green-500",
        },
        {
            title: "Average Rating",
            value: stats.rating.toFixed(1),
            change: "+0.5",
            trend: "up" as const,
            icon: Star,
            iconColor: "bg-yellow-500",
        },
    ];

    // Get today's appointments for the schedule view
    const today = new Date().toISOString().split('T')[0];
    const todaysSchedule = appointments.filter((apt: any) => {
        const aptDate = apt.appointment_date;
        return aptDate === today || aptDate?.split('T')[0] === today;
    });

    // Get recent activity (last 5 appointments created or updated)
    const recentActivity = [...appointments]
        .sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : new Date(a.appointment_date).getTime();
            const dateB = b.created_at ? new Date(b.created_at).getTime() : new Date(b.appointment_date).getTime();
            return dateB - dateA;
        })
        .slice(0, 5);

    return (
        <div className="space-y-8">
            <AvailabilitySetupModal
                isOpen={showAvailabilityModal}
                onClose={() => setShowAvailabilityModal(false)}
                onSuccess={() => {
                    fetchData(); // Refresh to potentially update stats or availability status
                }}
            />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome back, Dr. {user?.full_name || user?.name || 'Doctor'}
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={fetchData} disabled={loading}>
                        <Calendar className="mr-2 h-4 w-4" />
                        Refresh Data
                    </Button>
                    <Button onClick={() => toast({ description: "Please ask patients to book via the patient portal." })}>
                        New Appointment
                    </Button>
                </div>
            </div>

            <StatsCards stats={formattedStats} />

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <TodaySchedule appointments={todaysSchedule} />
                </div>
                <div className="col-span-3">
                    <div className="rounded-xl border bg-card text-card-foreground shadow h-full">
                        <div className="p-6 flex flex-col gap-y-1.5 border-b">
                            <h3 className="font-semibold leading-none tracking-tight">Recent Activity</h3>
                        </div>
                        <div className="p-6">
                            {recentActivity.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No recent activity.</p>
                            ) : (
                                <div className="space-y-4">
                                    {recentActivity.map((apt) => (
                                        <div key={apt.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-2 w-2 rounded-full ${apt.status === 'confirmed' ? 'bg-green-500' :
                                                    apt.status === 'pending' ? 'bg-yellow-500' :
                                                        apt.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-500'
                                                    }`} />
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {apt.status === 'pending' ? 'New Request' :
                                                            apt.status === 'confirmed' ? 'Confirmed' :
                                                                apt.status === 'cancelled' ? 'Cancelled' : 'Completed'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {apt.patient?.full_name || "Patient"} - {apt.appointment_date?.split('T')[0] || apt.appointment_date}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {apt.appointment_time}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
