"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Calendar as CalendarIcon, Clock, MapPin, Video, Loader2, AlertCircle, CheckCircle2, Star } from "lucide-react"
import { format } from "date-fns"
import { doctorService, Doctor } from '@/services/doctorService';
import { appointmentService } from '@/services/appointmentService';
import availabilityService from '@/services/availabilityService';
import { useAuthStore } from '@/store/authStore';
import { useParams } from "next/navigation"
import Link from "next/link"

interface TimeSlot {
    start_time: string;
    end_time: string;
    status?: string;
}

export default function BookingPage() {
    const params = useParams<{ doctorId: string }>();
    const router = useRouter();
    const { toast } = useToast();
    const { user, isAuthenticated } = useAuthStore();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [consultationType, setConsultationType] = useState<'video' | 'in_person'>('video');
    const [reason, setReason] = useState('');
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const hasFetchedDoctorRef = useRef(false);
    const fetchingDoctorRef = useRef(false);
    const fetchingSlotsRef = useRef(false);

    // Check authentication only when trying to book, not on page load
    const checkAuthBeforeBooking = () => {
        if (!isAuthenticated || !user) {
            toast({
                title: "Authentication Required",
                description: "Please log in as a patient to book an appointment",
                variant: "destructive",
            });
            router.push('/login');
            return false;
        }
        
        if (user.role !== 'patient') {
            toast({
                title: "Access Denied",
                description: "Only patients can book appointments. Please log in with a patient account.",
                variant: "destructive",
            });
            router.push('/');
            return false;
        }
        
        return true;
    };

    useEffect(() => {
        if (!params.doctorId) {
            setLoading(false);
            return;
        }
        
        const currentDoctorId = params.doctorId;
        
        // Prevent concurrent calls
        if (fetchingDoctorRef.current) {
            console.log('[Booking] Already fetching doctor, skipping...');
            return;
        }
        
        // If we already have this doctor loaded, don't fetch again
        if (doctor?.id === currentDoctorId) {
            console.log('[Booking] Doctor already loaded, skipping fetch');
            setLoading(false);
            return;
        }
        
        let isMounted = true;
        let timeoutId: NodeJS.Timeout | null = null;
        fetchingDoctorRef.current = true;
        
        // Safety timeout - always clear loading after 10 seconds (reduced from 15)
        timeoutId = setTimeout(() => {
            if (isMounted && fetchingDoctorRef.current) {
                console.error('[Booking] Doctor fetch timeout after 10s - clearing loading state');
                setLoading(false);
                fetchingDoctorRef.current = false;
                hasFetchedDoctorRef.current = true;
                toast({
                    title: "Timeout",
                    description: "Request took too long. Please refresh the page.",
                    variant: "destructive",
                });
            }
        }, 10000);
        
        const fetchDoctor = async () => {
            try {
                console.log('[Booking] Starting fetch for doctor:', currentDoctorId);
                setLoading(true);
                
                const data = await doctorService.getById(currentDoctorId);
                console.log('[Booking] Doctor data received:', data ? 'Success' : 'Empty');
                
                // Clear timeout on success
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                
                if (!isMounted) {
                    console.log('[Booking] Component unmounted, ignoring response');
                    return;
                }
                
                // Always clear loading, even if data is empty
                setLoading(false);
                fetchingDoctorRef.current = false;
                hasFetchedDoctorRef.current = true;
                
                // Handle response
                if (data && Object.keys(data).length > 0) {
                    setDoctor(data);
                } else {
                    console.warn('[Booking] Empty or invalid doctor response');
                    setDoctor(null);
                    toast({
                        title: "Error",
                        description: "Doctor not found or invalid data received",
                        variant: "destructive",
                    });
                }
            } catch (error: any) {
                console.error('[Booking] Failed to fetch doctor:', error);
                
                // Clear timeout on error
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                
                if (!isMounted) {
                    console.log('[Booking] Component unmounted, ignoring error');
                    return;
                }
                
                // Always clear loading on error
                setLoading(false);
                fetchingDoctorRef.current = false;
                hasFetchedDoctorRef.current = true;
                
                toast({
                    title: "Error",
                    description: error.response?.data?.detail || error.message || "Failed to load doctor details",
                    variant: "destructive",
                });
            }
        };
        
        // Start the fetch
        fetchDoctor();
        
        return () => {
            console.log('[Booking] Cleanup: unmounting');
            isMounted = false;
            fetchingDoctorRef.current = false;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [params.doctorId]);

    useEffect(() => {
        if (!date || !params.doctorId || fetchingSlotsRef.current) {
            if (!date || !params.doctorId) {
                setAvailableSlots([]);
                setSelectedTime(null);
                setLoadingSlots(false);
            }
            return;
        }
        
        let isMounted = true;
        let timeoutId: NodeJS.Timeout | null = null;
        fetchingSlotsRef.current = true;
        
        // Safety timeout for slots (shorter since it's less critical)
        timeoutId = setTimeout(() => {
            if (isMounted) {
                console.warn('[Booking] Slots fetch timeout - clearing loading state');
                setLoadingSlots(false);
                setAvailableSlots([]);
                fetchingSlotsRef.current = false;
            }
        }, 10000);
        
        const fetchAvailableSlots = async () => {
            try {
                setLoadingSlots(true);
                setSelectedTime(null);
                const formattedDate = format(date, 'yyyy-MM-dd');
                
                // Debug: Log the request
                console.log('[Booking Page] Fetching slots for date:', formattedDate);
                console.log('[Booking Page] Selected date object:', date);
                console.log('[Booking Page] Today:', format(new Date(), 'yyyy-MM-dd'));
                
                const slots = await availabilityService.getDoctorAvailabilityForDate(params.doctorId, formattedDate);
                
                // Debug: Log the response
                console.log('[Booking Page] Received slots from backend:', slots);
                console.log('[Booking Page] Number of slots received:', slots?.length || 0);
                if (slots && slots.length > 0) {
                    console.log('[Booking Page] First few slots:', slots.slice(0, 5).map(s => ({ 
                        time: s.start_time, 
                        status: s.status 
                    })));
                }
                
                // Clear timeout on success
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                
                if (isMounted) {
                    // Always set to array, even if empty - NO FILTERING on frontend
                    // The backend should already filter to only return "available" slots
                    const slotsArray = Array.isArray(slots) ? slots : [];
                    console.log('[Booking Page] Setting availableSlots to:', slotsArray.length, 'slots');
                    setAvailableSlots(slotsArray);
                    setLoadingSlots(false);
                    fetchingSlotsRef.current = false;
                }
            } catch (error: any) {
                console.error('Failed to fetch available slots:', error);
                
                // Clear timeout on error
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                
                if (isMounted) {
                    setAvailableSlots([]);
                    setLoadingSlots(false);
                    fetchingSlotsRef.current = false;
                    // Don't show error toast for no slots or timeout - it's expected sometimes
                    if (error.response?.status !== 404 && error.code !== 'ECONNABORTED') {
                        toast({
                            title: "Error",
                            description: error.response?.data?.detail || error.message || "Failed to load available time slots",
                            variant: "destructive",
                        });
                    }
                }
            }
        };
        
        fetchAvailableSlots();
        
        return () => {
            isMounted = false;
            fetchingSlotsRef.current = false;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [date, params.doctorId]);

    const formatTimeTo12Hour = (time24h: string) => {
        const [hours, minutes] = time24h.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    };

    const handleBooking = async () => {
        // Check authentication only when user tries to book
        if (!checkAuthBeforeBooking()) {
            return;
        }

        if (!date || !selectedTime || !doctor) {
            toast({
                title: "Missing Information",
                description: "Please select a date and time for your appointment",
                variant: "destructive",
            });
            return;
        }

        if (!reason.trim()) {
            toast({
                title: "Reason Required",
                description: "Please provide a reason for your visit",
                variant: "destructive",
            });
            return;
        }

        setSubmitting(true);
        try {
            const formattedDate = format(date, 'yyyy-MM-dd');
            // Ensure time is in HH:MM:SS format
            const timeParts = selectedTime.split(':');
            const formattedTime = timeParts.length === 2 
                ? `${selectedTime}:00` 
                : selectedTime;

            const appointmentData = {
                doctor_id: doctor.id,
                appointment_date: formattedDate,
                appointment_time: formattedTime,
                appointment_type: consultationType,
                chief_complaint: reason.trim(),
                symptoms: []
            };

            const result = await appointmentService.create(appointmentData);

            toast({
                title: "Appointment Booked!",
                description: "Your appointment request has been sent successfully. You will receive a confirmation soon.",
            });

            // Redirect after a short delay
            setTimeout(() => {
                router.push('/patient/appointments');
            }, 1500);
        } catch (error: any) {
            console.error('Booking failed:', error);
            const errorMessage = error.response?.data?.detail || "Could not book appointment. Please try again.";
            toast({
                title: "Booking Failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">Loading doctor details...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!doctor) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                    <p className="text-lg text-muted-foreground">Doctor not found</p>
                    <Link href="/doctors">
                        <Button className="mt-4">Browse Doctors</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column - Booking Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Book Appointment</h1>
                        <p className="text-muted-foreground">Schedule your consultation with Dr. {doctor.full_name}</p>
                    </div>

                    {/* Doctor Info Card */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={doctor.avatar_url} />
                                    <AvatarFallback>{doctor.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold">{doctor.full_name}</h3>
                                    <p className="text-muted-foreground">{doctor.specialties?.[0]}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        <span className="text-sm font-medium">{doctor.average_rating?.toFixed(1) || 'New'}</span>
                                        <span className="text-sm text-muted-foreground">({doctor.total_reviews || 0} reviews)</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Consultation Type */}
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Consultation Type</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setConsultationType('video')}
                                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                                        consultationType === 'video'
                                            ? 'border-primary bg-primary/5'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <Video className="h-6 w-6 mb-2 text-primary" />
                                    <p className="font-semibold">Video Call</p>
                                    <p className="text-sm text-muted-foreground">₹{doctor.video_consultation_fee || 500}</p>
                                </button>
                                <button
                                    onClick={() => setConsultationType('in_person')}
                                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                                        consultationType === 'in_person'
                                            ? 'border-primary bg-primary/5'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <MapPin className="h-6 w-6 mb-2 text-primary" />
                                    <p className="font-semibold">In-Person</p>
                                    <p className="text-sm text-muted-foreground">₹{doctor.in_person_consultation_fee || 500}</p>
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Date Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle>2. Select Date</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(newDate) => {
                                    if (newDate) {
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        if (newDate >= today) {
                                            setDate(newDate);
                                            setSelectedTime(null);
                                        }
                                    }
                                }}
                                disabled={(date) => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    return date < today;
                                }}
                                className="rounded-md border"
                            />
                        </CardContent>
                    </Card>

                    {/* Time Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle>3. Select Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loadingSlots ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    <span className="ml-2">Loading available slots...</span>
                                </div>
                            ) : availableSlots.length > 0 ? (
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                    {/* Display ALL slots returned from backend - NO frontend filtering */}
                                    {availableSlots.map((slot, index) => {
                                        // Debug: Log first few slots being rendered
                                        if (index < 3) {
                                            console.log('[Booking Page] Rendering slot:', {
                                                time: slot.start_time,
                                                status: slot.status
                                            });
                                        }
                                        return (
                                            <button
                                                key={slot.start_time}
                                                onClick={() => setSelectedTime(slot.start_time)}
                                                className={`p-3 border-2 rounded-lg text-center transition-all ${
                                                    selectedTime === slot.start_time
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <Clock className="h-4 w-4 mx-auto mb-1" />
                                                <p className="text-sm font-medium">{formatTimeTo12Hour(slot.start_time)}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No available slots for this date. Please select another date.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Reason for Visit */}
                    <Card>
                        <CardHeader>
                            <CardTitle>4. Reason for Visit</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="Describe your symptoms or reason for consultation..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={4}
                                className="resize-none"
                            />
                            <p className="text-sm text-muted-foreground mt-2">{reason.length}/500 characters</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Summary */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24">
                        <Card>
                            <CardHeader>
                                <CardTitle>Appointment Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Type</span>
                                        <span className="font-medium capitalize">
                                            {consultationType === 'video' ? 'Video Call' : 'In-Person'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Date</span>
                                        <span className="font-medium">
                                            {date ? format(date, 'EEE, MMM d, yyyy') : 'Not selected'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Time</span>
                                        <span className="font-medium">
                                            {selectedTime ? formatTimeTo12Hour(selectedTime) : 'Not selected'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t pt-3">
                                        <span className="text-muted-foreground">Consultation Fee</span>
                                        <span className="font-bold text-lg">
                                            ₹{consultationType === 'video' 
                                                ? (doctor.video_consultation_fee || 500)
                                                : (doctor.in_person_consultation_fee || 500)}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground text-center">
                                    Payment will be processed after appointment confirmation.
                                </p>
                                <Button
                                    onClick={handleBooking}
                                    disabled={!date || !selectedTime || !reason.trim() || submitting}
                                    className="w-full bg-gradient-to-r from-primary-blue to-primary-purple hover:opacity-90"
                                    size="lg"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Booking...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Confirm Booking
                                        </>
                                    )}
                                </Button>
                                <p className="text-xs text-center text-muted-foreground">
                                    By booking, you agree to our Terms of Service.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            </div>
        </div>
    )
}
