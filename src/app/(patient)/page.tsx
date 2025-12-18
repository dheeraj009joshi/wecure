'use client';

import { useEffect } from 'react';
import { Hero } from "@/components/home/Hero"
import { QuickAccess } from "@/components/home/QuickAccess"
import { Specialties } from "@/components/home/Specialties"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, Video, MapPin, Loader2, AlertCircle, CheckCircle2, CalendarCheck } from "lucide-react"
import Link from "next/link"
import { useAuthStore } from '@/store/authStore';
import { useToast } from "@/components/ui/use-toast";
import { useAppointments } from '@/hooks/useAppointments';

export default function Home() {
  const { user } = useAuthStore();
  const { toast } = useToast();

  // Fetch appointments and calculate stats (only if user is logged in)
  const {
    stats,
    loading: appointmentsLoading,
    error: appointmentsError,
    refetch: refetchAppointments,
    upcomingAppointments: allUpcoming,
  } = useAppointments({ immediate: !!user });

  // Get first 2 upcoming appointments for dashboard
  const upcomingAppointments = allUpcoming.slice(0, 2);

  // Safety: Force clear loading after 12 seconds if still loading
  useEffect(() => {
    if (!user || !appointmentsLoading) return;
    
    const safetyTimeout = setTimeout(() => {
      console.warn('[Dashboard] Safety timeout - loading state stuck, forcing clear');
      // Force a refetch which will clear loading
      refetchAppointments();
    }, 12000);

    return () => clearTimeout(safetyTimeout);
  }, [appointmentsLoading, user, refetchAppointments]);


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
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
      pending: {
        label: 'Pending',
        className: 'bg-yellow-100 text-yellow-700',
      },
      confirmed: {
        label: 'Confirmed',
        className: 'bg-blue-100 text-blue-700',
      },
      completed: {
        label: 'Completed',
        className: 'bg-green-100 text-green-700',
      },
      cancelled: {
        label: 'Cancelled',
        className: 'bg-red-100 text-red-700',
      },
    };
    const variant = variants[status] || variants['pending'];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const handleRetry = () => {
    refetchAppointments();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto flex flex-col space-y-8 pb-10 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section with Stats and Upcoming Appointments */}
        {user && (
          <div className="pt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">
                  Welcome back, {user.name || user.email}
                </h1>
                <p className="text-muted-foreground">
                  Here's what's coming up for you.
                </p>
              </div>
              <Link href="/patient/appointments">
                <Button variant="outline">View All Appointments</Button>
              </Link>
            </div>

            {/* Stats Cards */}
            {!appointmentsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Appointments
                        </p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                      </div>
                      <CalendarCheck className="h-8 w-8 text-primary opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Upcoming</p>
                        <p className="text-2xl font-bold">{stats.upcoming}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-blue-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Completed</p>
                        <p className="text-2xl font-bold">{stats.completed}</p>
                      </div>
                      <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <p className="text-2xl font-bold">{stats.pending}</p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Upcoming Appointments */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">
                Upcoming Appointments
              </h2>

              {appointmentsLoading ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Loading your schedule...</p>
                  </CardContent>
                </Card>
              ) : appointmentsError ? (
                <Card className="border-destructive">
                  <CardContent className="p-8 text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
                    <p className="text-destructive mb-4">{appointmentsError}</p>
                    <Button onClick={handleRetry}>Retry</Button>
                  </CardContent>
                </Card>
              ) : upcomingAppointments.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {upcomingAppointments.map((apt) => (
                    <Card
                      key={apt.id}
                      className="border-l-4 border-l-primary hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-start gap-4 flex-1">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={apt.doctor?.avatar_url} />
                              <AvatarFallback>
                                {apt.doctor?.full_name?.charAt(0) || 'D'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">
                                  Dr. {apt.doctor?.full_name || 'Unknown Doctor'}
                                </h3>
                                {getStatusBadge(apt.status)}
                              </div>
                              {apt.doctor?.specialties?.[0] && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {apt.doctor.specialties[0]}
                                </p>
                              )}
                              {apt.chief_complaint && (
                                <p className="text-sm text-muted-foreground mb-3">
                                  {apt.chief_complaint}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span>{formatDate(apt.appointment_date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>{formatTime(apt.appointment_time)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {apt.appointment_type === 'video' ? (
                              <Video className="h-4 w-4 text-primary" />
                            ) : (
                              <MapPin className="h-4 w-4 text-primary" />
                            )}
                            <span className="capitalize">
                              {apt.appointment_type === 'video'
                                ? 'Video Consultation'
                                : 'In-Person'}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Link href="/patient/appointments" className="flex-1">
                            <Button className="w-full" size="sm">
                              View Details
                            </Button>
                          </Link>
                          {apt.appointment_type === 'video' && (
                            <Button variant="outline" size="sm">
                              <Video className="h-4 w-4 mr-2" />
                              Join Call
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-muted/50 border-dashed">
                  <CardContent className="p-8 text-center">
                    <CalendarCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4 text-lg">
                      You have no upcoming appointments.
                    </p>
                    <Link href="/doctors">
                      <Button>Find a Doctor</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {!user && <Hero />}
        <QuickAccess />
        <Specialties />
      </div>
    </div>
  );
}
