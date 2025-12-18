'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, MapPin, Star, Video, Award, Languages } from "lucide-react"
import Link from "next/link"
import { doctorService, Doctor } from '@/services/doctorService';
import { reviewService, Review } from '@/services/reviewService';
import { useToast } from "@/components/ui/use-toast"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function DoctorDetailsPage() {
    const params = useParams<{ id: string }>();
    const { toast } = useToast();
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const fetchingDoctorRef = useRef(false);
    const hasFetchedDoctorRef = useRef(false);
    const fetchingReviewsRef = useRef(false);
    const hasFetchedReviewsRef = useRef(false);

    useEffect(() => {
        if (!params.id) {
            setLoading(false);
            return;
        }
        
        // Prevent multiple calls
        if (hasFetchedDoctorRef.current || fetchingDoctorRef.current) return;
        
        let isMounted = true;
        let timeoutId: NodeJS.Timeout | null = null;
        hasFetchedDoctorRef.current = true;
        fetchingDoctorRef.current = true;
        
        // Safety timeout - always clear loading after 15 seconds
        timeoutId = setTimeout(() => {
            if (isMounted) {
                console.warn('[Doctor Details] API timeout - clearing loading state');
                setLoading(false);
                setDoctor(null);
                fetchingDoctorRef.current = false;
                toast({
                    title: "Timeout",
                    description: "Request took too long. Please try again.",
                    variant: "destructive",
                });
            }
        }, 15000);
        
        const fetchDoctor = async () => {
            try {
                setLoading(true);
                const data = await doctorService.getById(params.id);
                
                // Clear timeout on success
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                
                if (isMounted) {
                    // Handle empty or null response - always clear loading
                    if (data && Object.keys(data).length > 0) {
                        setDoctor(data);
                    } else {
                        console.warn('[Doctor Details] Empty or invalid doctor response:', data);
                        setDoctor(null);
                    }
                    setLoading(false);
                    fetchingDoctorRef.current = false;
                }
            } catch (error: any) {
                console.error('Failed to fetch doctor:', error);
                
                // Clear timeout on error
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                
                if (isMounted) {
                    setDoctor(null);
                    setLoading(false);
                    fetchingDoctorRef.current = false;
                    toast({
                        title: "Error",
                        description: error.response?.data?.detail || error.message || "Failed to load doctor details",
                        variant: "destructive",
                    });
                }
            }
        };
        fetchDoctor();
        
        return () => {
            isMounted = false;
            fetchingDoctorRef.current = false;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [params.id]);

    useEffect(() => {
        if (!params.id) {
            setReviewsLoading(false);
            return;
        }
        
        // Prevent multiple calls
        if (hasFetchedReviewsRef.current || fetchingReviewsRef.current) return;
        
        let isMounted = true;
        let timeoutId: NodeJS.Timeout | null = null;
        hasFetchedReviewsRef.current = true;
        fetchingReviewsRef.current = true;
        
        // Safety timeout for reviews (shorter since it's less critical)
        timeoutId = setTimeout(() => {
            if (isMounted) {
                console.warn('[Reviews] API timeout - clearing loading state');
                setReviewsLoading(false);
                setReviews([]);
                fetchingReviewsRef.current = false;
            }
        }, 10000);
        
        const fetchReviews = async () => {
            try {
                setReviewsLoading(true);
                const data = await reviewService.getDoctorReviews(params.id);
                
                // Clear timeout on success
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                
                if (isMounted) {
                    // Always set to array, even if empty or null
                    setReviews(Array.isArray(data) ? data : []);
                    setReviewsLoading(false);
                    fetchingReviewsRef.current = false;
                }
            } catch (error: any) {
                console.error('Failed to fetch reviews:', error);
                
                // Clear timeout on error
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                
                if (isMounted) {
                    setReviews([]);
                    setReviewsLoading(false);
                    fetchingReviewsRef.current = false;
                    // Don't show toast for reviews - it's not critical
                }
            }
        };
        fetchReviews();
        
        return () => {
            isMounted = false;
            fetchingReviewsRef.current = false;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">Loading doctor profile...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!doctor) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
                    <p className="text-lg text-muted-foreground">Doctor not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Profile Info */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Header Card */}
                    <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
                        <CardContent className="p-8">
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <Avatar className="h-32 w-32 border-4 border-white shadow-md">
                                    <AvatarImage src={doctor.avatar_url} />
                                    <AvatarFallback className="text-2xl">{doctor.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>

                                <div className="flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <h1 className="text-3xl font-bold text-gray-900">{doctor.full_name}</h1>
                                            <p className="text-lg text-primary font-medium">{doctor.specialties?.[0]}</p>
                                        </div>
                                        <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm">
                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                            <span className="font-bold">{doctor.average_rating?.toFixed(1) || 'New'}</span>
                                            <span className="text-muted-foreground text-sm">({doctor.total_reviews || 0} reviews)</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-4">
                                        <div className="flex items-center gap-1">
                                            <Award className="h-4 w-4" />
                                            <span>{doctor.experience_years || 0} Years Exp.</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Languages className="h-4 w-4" />
                                            <span>English, Hindi</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            <span>Online & Clinic</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs: About, Reviews, etc. */}
                    <Tabs defaultValue="about" className="w-full">
                        <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-xl">
                            <TabsTrigger value="about" className="rounded-lg py-2 px-4">About</TabsTrigger>
                            <TabsTrigger value="services" className="rounded-lg py-2 px-4">Services</TabsTrigger>
                            <TabsTrigger value="reviews" className="rounded-lg py-2 px-4">Reviews</TabsTrigger>
                        </TabsList>

                        <TabsContent value="about" className="mt-6 space-y-6">
                            <Card>
                                <CardHeader><CardTitle>About Doctor</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-muted-foreground leading-relaxed">{doctor.bio || "No bio available."}</p>

                                    <div className="grid md:grid-cols-2 gap-6 pt-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">Education</h4>
                                            <p className="text-sm text-muted-foreground">{doctor.qualification || 'Not specified'}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2">Registration</h4>
                                            <p className="text-sm text-muted-foreground">{doctor.registration_number || 'Not specified'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="services" className="mt-6">
                            <Card>
                                <CardHeader><CardTitle>Services & Specializations</CardTitle></CardHeader>
                                <CardContent>
                                    <ul className="grid md:grid-cols-2 gap-2 list-disc list-inside text-muted-foreground">
                                        {doctor.specialties?.map((spec, index) => (
                                            <li key={index}>{spec}</li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="reviews" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Patient Reviews ({reviews.length})</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {reviewsLoading ? (
                                        <div className="text-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                                            <p className="text-muted-foreground">Loading reviews...</p>
                                        </div>
                                    ) : reviews.length > 0 ? (
                                        <div className="space-y-6">
                                            {reviews.map((review) => (
                                                <div key={review.id} className="border-b pb-6 last:border-0">
                                                    <div className="flex items-start gap-4">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={review.patient?.avatar_url} />
                                                            <AvatarFallback>
                                                                {review.patient?.full_name?.charAt(0) || 'P'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className="font-semibold">
                                                                    {review.patient?.full_name || 'Anonymous Patient'}
                                                                </p>
                                                                <div className="flex items-center gap-1">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <Star
                                                                            key={i}
                                                                            className={`h-4 w-4 ${
                                                                                i < review.rating
                                                                                    ? 'fill-yellow-400 text-yellow-400'
                                                                                    : 'text-gray-300'
                                                                            }`}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {review.comment && (
                                                                <p className="text-sm text-muted-foreground mt-2">
                                                                    {review.comment}
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-muted-foreground mt-2">
                                                                {new Date(review.created_at).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-muted-foreground">No reviews yet.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Column: Booking Card */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        <Card className="border-primary/20 shadow-lg">
                            <CardHeader className="bg-primary/5 pb-4">
                                <CardTitle className="text-lg flex justify-between items-center">
                                    <span>Book Appointment</span>
                                    <span className="text-primary font-bold">₹{doctor.video_consultation_fee || 500}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {/* Consultation Type */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium">Consultation Type</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="border rounded-lg p-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1 ring-2 ring-primary bg-primary/5">
                                            <Video className="h-5 w-5 mx-auto text-primary" />
                                            <p className="font-medium text-sm">Video</p>
                                            <p className="text-xs text-muted-foreground">30 mins</p>
                                        </div>
                                        <div className="border rounded-lg p-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center space-y-1">
                                            <MapPin className="h-5 w-5 mx-auto text-muted-foreground" />
                                            <p className="font-medium text-sm">In-Clinic</p>
                                            <p className="text-xs text-muted-foreground">Wait time: 15m</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action */}
                                <Link href={`/book/${doctor.id}`} className="block">
                                    <Button className="w-full bg-gradient-to-r from-primary-blue to-primary-purple hover:opacity-90 text-white h-12 text-lg shadow-lg shadow-blue-500/20">
                                        Book Appointment
                                    </Button>
                                </Link>

                                <p className="text-xs text-center text-muted-foreground">
                                    No booking fee • 100% Secure Payment
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
