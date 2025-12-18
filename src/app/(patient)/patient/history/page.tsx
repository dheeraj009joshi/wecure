'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { appointmentService, Appointment } from '@/services/appointmentService';
import { prescriptionService, Prescription } from '@/services/prescriptionService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Video, MapPin, FileText, Pill, Loader2, Download, MessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Link from 'next/link';

export default function MedicalHistoryPage() {
    const { user } = useAuthStore();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const hasFetchedRef = useRef(false);
    const fetchingRef = useRef(false);

    useEffect(() => {
        if (!user || hasFetchedRef.current || fetchingRef.current) {
            if (!user) {
                setLoading(false);
            }
            return;
        }

        let isMounted = true;
        hasFetchedRef.current = true;
        fetchingRef.current = true;
        let timeoutId: NodeJS.Timeout | null = null;

        timeoutId = setTimeout(() => {
            if (isMounted) {
                console.warn('[History] API timeout - clearing loading state');
                setLoading(false);
                fetchingRef.current = false;
                toast({
                    title: "Timeout",
                    description: "Request took too long. Please try again.",
                    variant: "destructive",
                });
            }
        }, 15000);

        const fetchData = async () => {
            try {
                setLoading(true);
                const [appointmentsData, prescriptionsData] = await Promise.all([
                    appointmentService.getPatientAppointments(),
                    prescriptionService.getMyPrescriptions()
                ]);

                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }

                if (!isMounted) return;

                setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
                setPrescriptions(Array.isArray(prescriptionsData) ? prescriptionsData : []);
                setLoading(false);
                fetchingRef.current = false;
            } catch (error: any) {
                console.error('Failed to fetch history:', error);
                
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }

                if (isMounted) {
                    if (error.response?.status === 404 || error.code === 'ECONNABORTED') {
                        setAppointments([]);
                        setPrescriptions([]);
                    } else {
                        toast({
                            title: "Error",
                            description: error.response?.data?.detail || error.message || "Failed to load medical history",
                            variant: "destructive",
                        });
                    }
                    setLoading(false);
                    fetchingRef.current = false;
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
            fetchingRef.current = false;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [user?.id, toast]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (timeString: string) => {
        if (!timeString || typeof timeString !== 'string') return '';
        return timeString.substring(0, 5);
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { label: string; className: string }> = {
            pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
            confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-700' },
            completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
            cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
        };
        const variant = variants[status] || variants['pending'];
        return <Badge className={variant.className}>{variant.label}</Badge>;
    };

    // Group prescriptions by appointment
    const prescriptionsByAppointment = prescriptions.reduce((acc, pres) => {
        if (!acc[pres.appointment_id]) {
            acc[pres.appointment_id] = [];
        }
        acc[pres.appointment_id].push(pres);
        return acc;
    }, {} as Record<string, Prescription[]>);

    // Sort appointments by date (newest first)
    const sortedAppointments = [...appointments].sort((a, b) => {
        const dateA = new Date(a.appointment_date).getTime();
        const dateB = new Date(b.appointment_date).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return (b.appointment_time || '').localeCompare(a.appointment_time || '');
    });

    if (!user) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card>
                        <CardContent className="p-8 text-center">
                            <p className="text-lg">Please log in to view your medical history.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">Loading medical history...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Medical History</h1>
                    <p className="text-muted-foreground">View your complete medical records, prescriptions, and consultation notes</p>
                </div>

                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="mb-6">
                        <TabsTrigger value="all">All Records ({sortedAppointments.length})</TabsTrigger>
                        <TabsTrigger value="prescriptions">Prescriptions ({prescriptions.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-6">
                        {sortedAppointments.length > 0 ? (
                            sortedAppointments.map((appointment) => {
                                const appointmentPrescriptions = prescriptionsByAppointment[appointment.id] || [];
                                return (
                                    <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-4 flex-1">
                                                    <Avatar className="h-16 w-16">
                                                        <AvatarImage src={appointment.doctor?.avatar_url} />
                                                        <AvatarFallback>
                                                            {appointment.doctor?.full_name?.charAt(0) || 'D'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="text-xl font-semibold">
                                                                Dr. {appointment.doctor?.full_name || 'Unknown Doctor'}
                                                            </h3>
                                                            {getStatusBadge(appointment.status || 'pending')}
                                                        </div>
                                                        {appointment.doctor?.specialties?.[0] && (
                                                            <p className="text-sm text-muted-foreground mb-2">
                                                                {appointment.doctor.specialties[0]}
                                                            </p>
                                                        )}
                                                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-4 w-4" />
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
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {appointment.chief_complaint && (
                                                <div>
                                                    <p className="text-sm font-medium mb-1">Chief Complaint:</p>
                                                    <p className="text-sm text-muted-foreground">{appointment.chief_complaint}</p>
                                                </div>
                                            )}

                                            {appointment.consultation_notes && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <MessageSquare className="h-4 w-4 text-primary" />
                                                        <p className="text-sm font-medium">Consultation Notes:</p>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                                                        {appointment.consultation_notes}
                                                    </p>
                                                </div>
                                            )}

                                            {appointment.diagnosis && (
                                                <div>
                                                    <p className="text-sm font-medium mb-1">Diagnosis:</p>
                                                    <p className="text-sm text-muted-foreground">{appointment.diagnosis}</p>
                                                </div>
                                            )}

                                            {(appointment.blood_pressure || appointment.heart_rate || appointment.temperature || appointment.weight) && (
                                                <div>
                                                    <p className="text-sm font-medium mb-2">Vital Signs:</p>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                                        {appointment.blood_pressure && (
                                                            <div className="bg-muted p-2 rounded">
                                                                <span className="font-medium">BP: </span>
                                                                {appointment.blood_pressure}
                                                            </div>
                                                        )}
                                                        {appointment.heart_rate && (
                                                            <div className="bg-muted p-2 rounded">
                                                                <span className="font-medium">HR: </span>
                                                                {appointment.heart_rate} bpm
                                                            </div>
                                                        )}
                                                        {appointment.temperature && (
                                                            <div className="bg-muted p-2 rounded">
                                                                <span className="font-medium">Temp: </span>
                                                                {appointment.temperature}°F
                                                            </div>
                                                        )}
                                                        {appointment.weight && (
                                                            <div className="bg-muted p-2 rounded">
                                                                <span className="font-medium">Weight: </span>
                                                                {appointment.weight} kg
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {appointmentPrescriptions.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Pill className="h-4 w-4 text-primary" />
                                                        <p className="text-sm font-medium">Prescriptions ({appointmentPrescriptions.length}):</p>
                                                    </div>
                                                    {appointmentPrescriptions.map((prescription) => (
                                                        <Card key={prescription.id} className="bg-muted/50 mb-2">
                                                            <CardContent className="p-4">
                                                                <div className="flex items-start justify-between mb-2">
                                                                    <p className="text-sm font-medium">Prescription #{prescription.prescription_number}</p>
                                                                    {prescription.pdf_url && (
                                                                        <Button size="sm" variant="outline" asChild>
                                                                            <a href={prescription.pdf_url} target="_blank" rel="noopener noreferrer">
                                                                                <Download className="h-4 w-4 mr-2" />
                                                                                Download PDF
                                                                            </a>
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                                {prescription.medicines && prescription.medicines.length > 0 && (
                                                                    <div className="space-y-2">
                                                                        {prescription.medicines.map((medicine, idx) => (
                                                                            <div key={idx} className="text-sm">
                                                                                <span className="font-medium">{medicine.name}</span>
                                                                                {' - '}
                                                                                <span className="text-muted-foreground">
                                                                                    {medicine.dosage}, {medicine.frequency}, {medicine.duration}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {prescription.instructions && (
                                                                    <p className="text-sm text-muted-foreground mt-2">
                                                                        <span className="font-medium">Instructions: </span>
                                                                        {prescription.instructions}
                                                                    </p>
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })
                        ) : (
                            <Card className="bg-muted/50 border-dashed">
                                <CardContent className="p-8 text-center">
                                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                    <p className="text-muted-foreground mb-4 text-lg">
                                        No medical records found.
                                    </p>
                                    <Link href="/doctors">
                                        <Button>Book Your First Appointment</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="prescriptions" className="space-y-4">
                        {prescriptions.length > 0 ? (
                            prescriptions.map((prescription) => {
                                const appointment = appointments.find(apt => apt.id === prescription.appointment_id);
                                return (
                                    <Card key={prescription.id} className="hover:shadow-lg transition-shadow">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="text-lg">
                                                        Prescription #{prescription.prescription_number}
                                                    </CardTitle>
                                                    {appointment && (
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            Dr. {appointment.doctor?.full_name || 'Unknown Doctor'} - {formatDate(appointment.appointment_date)}
                                                        </p>
                                                    )}
                                                </div>
                                                {prescription.pdf_url && (
                                                    <Button size="sm" variant="outline" asChild>
                                                        <a href={prescription.pdf_url} target="_blank" rel="noopener noreferrer">
                                                            <Download className="h-4 w-4 mr-2" />
                                                            Download PDF
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {prescription.medicines && prescription.medicines.length > 0 && (
                                                <div className="space-y-3 mb-4">
                                                    <p className="text-sm font-medium mb-2">Medications:</p>
                                                    {prescription.medicines.map((medicine, idx) => (
                                                        <div key={idx} className="bg-muted p-3 rounded-lg">
                                                            <p className="font-medium">{medicine.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {medicine.dosage} • {medicine.frequency} • {medicine.duration}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {prescription.instructions && (
                                                <div>
                                                    <p className="text-sm font-medium mb-1">Instructions:</p>
                                                    <p className="text-sm text-muted-foreground">{prescription.instructions}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })
                        ) : (
                            <Card className="bg-muted/50 border-dashed">
                                <CardContent className="p-8 text-center">
                                    <Pill className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                    <p className="text-muted-foreground mb-4 text-lg">
                                        No prescriptions found.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

