"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    ArrowLeft,
    Loader2,
    User,
    Phone,
    Mail,
    MapPin,
    GraduationCap,
    Award,
    Star,
    Calendar,
    CheckCircle,
    XCircle
} from "lucide-react"
import { adminService } from "@/services/adminService"
import { Doctor } from "@/services/doctorService"
import { appointmentService } from "@/services/appointmentService"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

export default function AdminDoctorDetailPage() {
    const params = useParams()
    const router = useRouter()
    const doctorId = params.id as string
    const [doctor, setDoctor] = useState<Doctor | null>(null)
    const [appointments, setAppointments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        if (doctorId) {
            fetchDoctorData()
        }
    }, [doctorId])

    const fetchDoctorData = async () => {
        try {
            const doctorData = await adminService.getDoctorById(doctorId)
            setDoctor(doctorData)

            // Fetch doctor's appointments
            try {
                const allAppointments = await adminService.getAllAppointments()
                const doctorAppointments = allAppointments.filter(apt => apt.doctor_id === doctorId)
                setAppointments(doctorAppointments)
            } catch (error) {
                console.error('Failed to fetch appointments:', error)
                setAppointments([])
            }
        } catch (error: any) {
            console.error('Failed to fetch doctor:', error)
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to load doctor details",
                variant: "destructive",
            })
            router.push('/admin/doctors')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A"
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-100 text-green-700">Active</Badge>
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
            case 'suspended':
                return <Badge className="bg-red-100 text-red-700">Suspended</Badge>
            default:
                return <Badge>{status}</Badge>
        }
    }

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading doctor details...</span>
            </div>
        )
    }

    if (!doctor) {
        return (
            <div className="p-8">
                <Link href="/admin/doctors">
                    <Button variant="outline" className="mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Doctors
                    </Button>
                </Link>
                <p className="text-lg">Doctor not found</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/admin/doctors">
                        <Button variant="ghost" className="mb-2">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Doctors
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold">Doctor Profile</h1>
                    <p className="text-muted-foreground">ID: {doctor.id.substring(0, 8)}</p>
                </div>
                <div className="flex gap-2">
                    {getStatusBadge(doctor.status)}
                    {doctor.status === 'pending' && (
                        <Button 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={async () => {
                                try {
                                    await adminService.verifyDoctor(doctor.id)
                                    toast({
                                        title: "Success",
                                        description: "Doctor verified successfully",
                                    })
                                    fetchDoctorData()
                                } catch (error: any) {
                                    toast({
                                        title: "Error",
                                        description: error.response?.data?.detail || "Failed to verify doctor",
                                        variant: "destructive",
                                    })
                                }
                            }}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                        </Button>
                    )}
                    {doctor.status === 'active' && (
                        <Button 
                            variant="destructive"
                            onClick={async () => {
                                try {
                                    await adminService.suspendDoctor(doctor.id)
                                    toast({
                                        title: "Success",
                                        description: "Doctor suspended successfully",
                                    })
                                    fetchDoctorData()
                                } catch (error: any) {
                                    toast({
                                        title: "Error",
                                        description: error.response?.data?.detail || "Failed to suspend doctor",
                                        variant: "destructive",
                                    })
                                }
                            }}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Suspend
                        </Button>
                    )}
                    {doctor.status === 'suspended' && (
                        <Button 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={async () => {
                                try {
                                    await adminService.verifyDoctor(doctor.id)
                                    toast({
                                        title: "Success",
                                        description: "Doctor reactivated successfully",
                                    })
                                    fetchDoctorData()
                                } catch (error: any) {
                                    toast({
                                        title: "Error",
                                        description: error.response?.data?.detail || "Failed to reactivate doctor",
                                        variant: "destructive",
                                    })
                                }
                            }}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Reactivate
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
                {/* Left Sidebar */}
                <div className="space-y-6">
                    {/* Doctor Card */}
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex flex-col items-center text-center">
                                <Avatar className="h-24 w-24 mb-3">
                                    <AvatarImage src={doctor.avatar_url} />
                                    <AvatarFallback>{doctor.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <h3 className="font-semibold text-lg">{doctor.full_name}</h3>
                                <p className="text-sm text-muted-foreground">{doctor.specialties?.[0] || 'General'}</p>
                                {doctor.average_rating && doctor.average_rating > 0 && (
                                    <div className="flex items-center gap-1 mt-2">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        <span className="font-semibold">{doctor.average_rating.toFixed(1)}</span>
                                        <span className="text-sm text-muted-foreground">({doctor.total_reviews} reviews)</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 text-sm pt-4 border-t">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Phone:</span>
                                    <span className="font-medium">{doctor.phone}</span>
                                </div>
                                {doctor.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Email:</span>
                                        <span className="font-medium text-xs">{doctor.email}</span>
                                    </div>
                                )}
                                {doctor.clinic_address && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div className="flex-1">
                                            <span className="text-muted-foreground">Clinic: </span>
                                            <span className="font-medium text-xs">{doctor.clinic_name || 'N/A'}</span>
                                            <p className="text-xs text-muted-foreground mt-1">{doctor.clinic_address}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Statistics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Total Appointments:</span>
                                <span className="font-semibold">{appointments.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Experience:</span>
                                <span className="font-semibold">{doctor.experience_years} years</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    <Tabs defaultValue="details" className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="details">
                                <User className="h-4 w-4 mr-2" />
                                Details
                            </TabsTrigger>
                            <TabsTrigger value="appointments">
                                <Calendar className="h-4 w-4 mr-2" />
                                Appointments ({appointments.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="details">
                            <div className="space-y-6">
                                {/* Professional Information */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Professional Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <span className="text-sm text-muted-foreground">Registration Number:</span>
                                            <p className="font-medium">{doctor.registration_number}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-muted-foreground">Qualification:</span>
                                            <p className="font-medium">{doctor.qualification}</p>
                                        </div>
                                        {doctor.specialties && doctor.specialties.length > 0 && (
                                            <div>
                                                <span className="text-sm text-muted-foreground">Specialties:</span>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {doctor.specialties.map((spec, index) => (
                                                        <Badge key={index} variant="outline">{spec}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {doctor.education && (
                                            <div>
                                                <span className="text-sm text-muted-foreground">Education:</span>
                                                <p className="font-medium">{doctor.education}</p>
                                            </div>
                                        )}
                                        {doctor.bio && (
                                            <div>
                                                <span className="text-sm text-muted-foreground">Bio:</span>
                                                <p className="mt-1">{doctor.bio}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Consultation Fees */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Consultation Fees</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Video Consultation:</span>
                                            <span className="font-semibold">₹{doctor.video_consultation_fee || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">In-Person Consultation:</span>
                                            <span className="font-semibold">₹{doctor.in_person_consultation_fee || 0}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="appointments">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Appointment History</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {appointments.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No appointments found
                                        </p>
                                    ) : (
                                        appointments.map((appointment) => (
                                            <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="flex-1">
                                                    <p className="font-semibold">
                                                        {appointment.patient?.full_name || "Unknown Patient"}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                        <span>{formatDate(appointment.appointment_date)}</span>
                                                        <span>{typeof appointment.appointment_time === 'string' ? appointment.appointment_time : appointment.appointment_time?.substring(0, 5) || 'N/A'}</span>
                                                        <Badge className={appointment.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                                                            {appointment.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <Link href={`/admin/appointments/${appointment.id}`}>
                                                    <Button variant="outline" size="sm">
                                                        View Details
                                                    </Button>
                                                </Link>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}

