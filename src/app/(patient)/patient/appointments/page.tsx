'use client';

import { useEffect, useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Loader2, X, Calendar as CalendarIcon } from "lucide-react"
import { appointmentService, Appointment } from '@/services/appointmentService';
import { prescriptionService, Prescription } from '@/services/prescriptionService';
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Video, MapPin, Clock, Pill, MessageSquare, Download, FileText } from "lucide-react"
import Link from 'next/link';
import { useToast } from "@/components/ui/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const { toast } = useToast();
    const hasFetchedRef = useRef(false);
    const fetchingRef = useRef(false);

    const fetchAppointments = async () => {
        // Prevent concurrent calls
        if (fetchingRef.current) {
            console.log('[Appointments] Already fetching, skipping...');
            return;
        }

        let isMounted = true;
        let timeoutId: NodeJS.Timeout | null = null;
        fetchingRef.current = true;

        // Safety timeout - always clear loading after 15 seconds
        timeoutId = setTimeout(() => {
            if (isMounted) {
                console.warn('[Appointments] API timeout - clearing loading state');
                setLoading(false);
                setAppointments([]);
                fetchingRef.current = false;
                toast({
                    title: "Timeout",
                    description: "Request took too long. Please try again.",
                    variant: "destructive",
                });
            }
        }, 15000);

        try {
            setLoading(true);
            const [appointmentsData, prescriptionsData] = await Promise.all([
                appointmentService.getPatientAppointments(),
                prescriptionService.getMyPrescriptions().catch(() => []) // Don't fail if prescriptions fail
            ]);
            
            // Clear timeout on success
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            
            if (isMounted) {
                // Always set to array, even if empty or null
                setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
                setPrescriptions(Array.isArray(prescriptionsData) ? prescriptionsData : []);
                setLoading(false);
                fetchingRef.current = false;
            }
        } catch (error: any) {
            console.error('Failed to fetch appointments:', error);
            
            // Clear timeout on error
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            
            if (isMounted) {
                // Handle 404 "Patient profile not found" gracefully
                if (error.response?.status === 404 || error.code === 'ECONNABORTED') {
                    // Patient profile doesn't exist or timeout - show empty state
                    setAppointments([]);
                } else {
                    setAppointments([]);
                    toast({
                        title: "Error",
                        description: error.response?.data?.detail || error.message || "Failed to load appointments",
                        variant: "destructive",
                    });
                }
                setLoading(false);
                fetchingRef.current = false;
            }
        }
    };

    useEffect(() => {
        if (hasFetchedRef.current || fetchingRef.current) return;
        hasFetchedRef.current = true;
        fetchAppointments();
    }, []);

    const handleCancel = async () => {
        if (!appointmentToCancel) return;
        try {
            setCancelling(true);
            await appointmentService.cancel(appointmentToCancel.id);
            toast({
                title: "Success",
                description: "Appointment cancelled successfully",
            });
            setCancelDialogOpen(false);
            setAppointmentToCancel(null);
            fetchAppointments();
        } catch (error: any) {
            console.error('Failed to cancel appointment:', error);
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to cancel appointment",
                variant: "destructive",
            });
        } finally {
            setCancelling(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const formatTime = (timeString: string) => {
        if (!timeString) return '';
        const time = timeString.substring(0, 5);
        return time;
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { label: string; className: string }> = {
            'pending': { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
            'confirmed': { label: 'Confirmed', className: 'bg-blue-100 text-blue-700' },
            'completed': { label: 'Completed', className: 'bg-green-100 text-green-700' },
            'cancelled': { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
        };
        const variant = variants[status] || variants['pending'];
        return <Badge className={variant.className}>{variant.label}</Badge>;
    };

    const filteredAppointments = appointments.filter(apt => {
        const matchesSearch = !searchTerm || 
            apt.doctor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apt.chief_complaint?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || apt.appointment_type === filterType;
        return matchesSearch && matchesType;
    });

    const upcomingAppointments = filteredAppointments.filter(a =>
        a.status === 'pending' || a.status === 'confirmed'
    );
    const completedAppointments = filteredAppointments.filter(a => a.status === 'completed');
    const cancelledAppointments = filteredAppointments.filter(a => a.status === 'cancelled');

    // Group prescriptions by appointment
    const prescriptionsByAppointment = prescriptions.reduce((acc, pres) => {
        if (!acc[pres.appointment_id]) {
            acc[pres.appointment_id] = [];
        }
        acc[pres.appointment_id].push(pres);
        return acc;
    }, {} as Record<string, Prescription[]>);

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">Loading appointments...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">My Appointments</h1>
                        <p className="text-muted-foreground">Manage and track your appointments</p>
                    </div>
                    <Link href="/doctors">
                        <Button className="bg-gradient-to-r from-primary-blue to-primary-purple">
                            Book New Appointment
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-xl border">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by doctor name or reason..." 
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="video">Video Only</SelectItem>
                            <SelectItem value="in_person">In-Person Only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="upcoming" className="w-full">
                    <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-xl">
                        <TabsTrigger value="upcoming" className="rounded-lg py-2 px-4">
                            Upcoming ({upcomingAppointments.length})
                        </TabsTrigger>
                        <TabsTrigger value="completed" className="rounded-lg py-2 px-4">
                            Completed ({completedAppointments.length})
                        </TabsTrigger>
                        <TabsTrigger value="cancelled" className="rounded-lg py-2 px-4">
                            Cancelled ({cancelledAppointments.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upcoming" className="mt-6 space-y-4">
                        {upcomingAppointments.length > 0 ? (
                            upcomingAppointments.map((appointment) => (
                                <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <Avatar className="h-16 w-16">
                                                <AvatarImage src={appointment.doctor?.avatar_url} />
                                                <AvatarFallback>
                                                    {appointment.doctor?.full_name?.charAt(0) || 'D'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="font-semibold text-lg">
                                                            Dr. {appointment.doctor?.full_name || 'Unknown Doctor'}
                                                        </h3>
                                                        {appointment.doctor?.specialties?.[0] && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {appointment.doctor.specialties[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {getStatusBadge(appointment.status || 'pending')}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                                                    <div className="flex items-center gap-1">
                                                        <CalendarIcon className="h-4 w-4" />
                                                        {formatDate(appointment.appointment_date)}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4" />
                                                        {formatTime(appointment.appointment_time)}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {appointment.appointment_type === 'video' ? (
                                                            <><Video className="h-4 w-4" /> Video Consultation</>
                                                        ) : (
                                                            <><MapPin className="h-4 w-4" /> In-Person</>
                                                        )}
                                                    </div>
                                                </div>
                                                {appointment.chief_complaint && (
                                                    <p className="text-sm mt-2">
                                                        <span className="font-medium">Reason: </span>
                                                        {appointment.chief_complaint}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {appointment.status === 'confirmed' && appointment.appointment_type === 'video' && (
                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                                        <Video className="h-4 w-4 mr-2" />
                                                        Join Call
                                                    </Button>
                                                )}
                                                {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="destructive"
                                                        onClick={() => {
                                                            setAppointmentToCancel(appointment);
                                                            setCancelDialogOpen(true);
                                                        }}
                                                    >
                                                        <X className="h-4 w-4 mr-2" />
                                                        Cancel
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg mb-2">No upcoming appointments</p>
                                <Link href="/doctors">
                                    <Button className="mt-4">Find a Doctor</Button>
                                </Link>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="completed" className="mt-6 space-y-4">
                        {completedAppointments.length > 0 ? (
                            completedAppointments.map((appointment) => {
                                const appointmentPrescriptions = prescriptionsByAppointment[appointment.id] || [];
                                return (
                                    <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                <Avatar className="h-16 w-16">
                                                    <AvatarImage src={appointment.doctor?.avatar_url} />
                                                    <AvatarFallback>
                                                        {appointment.doctor?.full_name?.charAt(0) || 'D'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <h3 className="font-semibold text-lg">
                                                                Dr. {appointment.doctor?.full_name || 'Unknown Doctor'}
                                                            </h3>
                                                            {appointment.doctor?.specialties?.[0] && (
                                                                <p className="text-sm text-muted-foreground">
                                                                    {appointment.doctor.specialties[0]}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {getStatusBadge(appointment.status || 'completed')}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                                                        <div className="flex items-center gap-1">
                                                            <CalendarIcon className="h-4 w-4" />
                                                            {formatDate(appointment.appointment_date)}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-4 w-4" />
                                                            {formatTime(appointment.appointment_time)}
                                                        </div>
                                                    </div>
                                                    {appointment.chief_complaint && (
                                                        <p className="text-sm">
                                                            <span className="font-medium">Reason: </span>
                                                            {appointment.chief_complaint}
                                                        </p>
                                                    )}
                                                    {appointment.consultation_notes && (
                                                        <div className="bg-muted p-3 rounded-lg">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <MessageSquare className="h-4 w-4 text-primary" />
                                                                <p className="text-sm font-medium">Consultation Notes:</p>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">{appointment.consultation_notes}</p>
                                                        </div>
                                                    )}
                                                    {appointment.diagnosis && (
                                                        <div>
                                                            <p className="text-sm font-medium mb-1">Diagnosis:</p>
                                                            <p className="text-sm text-muted-foreground">{appointment.diagnosis}</p>
                                                        </div>
                                                    )}
                                                    {appointmentPrescriptions.length > 0 && (
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Pill className="h-4 w-4 text-primary" />
                                                                <p className="text-sm font-medium">Prescriptions ({appointmentPrescriptions.length}):</p>
                                                            </div>
                                                            {appointmentPrescriptions.map((prescription) => (
                                                                <div key={prescription.id} className="bg-muted/50 p-3 rounded-lg mb-2">
                                                                    <p className="text-sm font-medium mb-1">Prescription #{prescription.prescription_number}</p>
                                                                    {prescription.medicines && prescription.medicines.length > 0 && (
                                                                        <div className="space-y-1">
                                                                            {prescription.medicines.map((medicine, idx) => (
                                                                                <p key={idx} className="text-sm text-muted-foreground">
                                                                                    {medicine.name} - {medicine.dosage}, {medicine.frequency}, {medicine.duration}
                                                                                </p>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    {prescription.instructions && (
                                                                        <p className="text-sm text-muted-foreground mt-1">
                                                                            <span className="font-medium">Instructions: </span>
                                                                            {prescription.instructions}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <Link href="/patient/history">
                                                        <Button variant="outline" size="sm">
                                                            <FileText className="h-4 w-4 mr-2" />
                                                            View Full History
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No completed appointments</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="cancelled" className="mt-6 space-y-4">
                        {cancelledAppointments.length > 0 ? (
                            cancelledAppointments.map((appointment) => (
                                <Card key={appointment.id}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <Avatar className="h-16 w-16">
                                                <AvatarImage src={appointment.doctor?.avatar_url} />
                                                <AvatarFallback>
                                                    {appointment.doctor?.full_name?.charAt(0) || 'D'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="font-semibold text-lg">
                                                            Dr. {appointment.doctor?.full_name || 'Unknown Doctor'}
                                                        </h3>
                                                        {appointment.doctor?.specialties?.[0] && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {appointment.doctor.specialties[0]}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {getStatusBadge(appointment.status || 'cancelled')}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                                                    <div className="flex items-center gap-1">
                                                        <CalendarIcon className="h-4 w-4" />
                                                        {formatDate(appointment.appointment_date)}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4" />
                                                        {formatTime(appointment.appointment_time)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No cancelled appointments</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel this appointment with Dr. {appointmentToCancel?.doctor?.full_name}? 
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={cancelling}>Keep Appointment</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancel}
                            disabled={cancelling}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {cancelling ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Cancelling...
                                </>
                            ) : (
                                'Cancel Appointment'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
