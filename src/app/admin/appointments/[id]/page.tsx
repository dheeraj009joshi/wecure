"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import {
    Calendar,
    Clock,
    Video,
    MapPin,
    Phone,
    FileText,
    Pill,
    ArrowLeft,
    Loader2
} from "lucide-react"
import { adminService } from "@/services/adminService"
import { Appointment } from "@/services/appointmentService"
import { prescriptionService } from "@/services/prescriptionService"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

export default function AdminAppointmentDetailPage() {
    const params = useParams()
    const router = useRouter()
    const appointmentId = params.id as string
    const [appointment, setAppointment] = useState<Appointment | null>(null)
    const [prescriptions, setPrescriptions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        if (appointmentId) {
            fetchAppointment()
        }
    }, [appointmentId])

    const fetchAppointment = async () => {
        try {
            const [appointmentData, prescriptionsData] = await Promise.all([
                adminService.getAppointmentById(appointmentId),
                prescriptionService.getAll(appointmentId).catch(() => [])
            ])
            
            setAppointment(appointmentData)
            setPrescriptions(prescriptionsData)
        } catch (error: any) {
            console.error('Failed to fetch appointment:', error)
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to load appointment details",
                variant: "destructive",
            })
            router.push('/admin/appointments')
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

    const formatTime = (timeString?: string) => {
        if (!timeString) return "N/A"
        return timeString.substring(0, 5)
    }

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'completed':
                return "bg-green-100 text-green-700"
            case 'cancelled':
                return "bg-red-100 text-red-700"
            case 'scheduled':
            case 'confirmed':
                return "bg-blue-100 text-blue-700"
            default:
                return "bg-gray-100 text-gray-700"
        }
    }

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading appointment details...</span>
            </div>
        )
    }

    if (!appointment) {
        return (
            <div className="p-8">
                <Link href="/admin/appointments">
                    <Button variant="outline" className="mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Appointments
                    </Button>
                </Link>
                <p className="text-lg">Appointment not found</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/admin/appointments">
                        <Button variant="ghost" className="mb-2">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Appointments
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold">Appointment Details</h1>
                    <p className="text-muted-foreground">ID: {appointment.appointment_number || appointment.id.substring(0, 8)}</p>
                </div>
                <Badge className={getStatusBadgeClass(appointment.status || '')}>
                    {appointment.status}
                </Badge>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Sidebar - Patient & Doctor Info */}
                <div className="space-y-6">
                    {/* Patient Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Patient Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={appointment.patient?.avatar_url} />
                                    <AvatarFallback>{appointment.patient?.full_name?.[0] || "P"}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold">{appointment.patient?.full_name || "Unknown"}</h3>
                                    <p className="text-sm text-muted-foreground">{appointment.patient?.phone || "N/A"}</p>
                                    {appointment.patient?.email && (
                                        <p className="text-sm text-muted-foreground">{appointment.patient.email}</p>
                                    )}
                                </div>
                            </div>
                            <Link href={`/admin/patients/${appointment.patient_id}`}>
                                <Button variant="outline" className="w-full">
                                    View Patient Profile
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Doctor Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Doctor Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={appointment.doctor?.avatar_url} />
                                    <AvatarFallback>{appointment.doctor?.full_name?.[0] || "D"}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold">{appointment.doctor?.full_name || "Unknown"}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {appointment.doctor?.specialties?.[0] || "General"}
                                    </p>
                                </div>
                            </div>
                            <Link href={`/admin/doctors/${appointment.doctor_id}`}>
                                <Button variant="outline" className="w-full">
                                    View Doctor Profile
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Appointment Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Appointment Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Date:</span>
                                <span className="font-medium">{formatDate(appointment.appointment_date)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Time:</span>
                                <span className="font-medium">{formatTime(appointment.appointment_time)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                {appointment.appointment_type === "video" ? (
                                    <Video className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className="text-muted-foreground">Type:</span>
                                <span className="font-medium">
                                    {appointment.appointment_type === "video" ? "Video Consultation" : "In-Person"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="details" className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="details">
                                <FileText className="h-4 w-4 mr-2" />
                                Details
                            </TabsTrigger>
                            <TabsTrigger value="prescriptions">
                                <Pill className="h-4 w-4 mr-2" />
                                Prescriptions ({prescriptions.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="details">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Appointment Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Chief Complaint */}
                                    {appointment.chief_complaint && (
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">Chief Complaint</Label>
                                            <p className="mt-1">{appointment.chief_complaint}</p>
                                        </div>
                                    )}

                                    {/* Symptoms */}
                                    {appointment.symptoms && appointment.symptoms.length > 0 && (
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">Symptoms</Label>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {appointment.symptoms.map((symptom: string, index: number) => (
                                                    <Badge key={index} variant="outline">{symptom}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Diagnosis */}
                                    {appointment.diagnosis && (
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">Diagnosis</Label>
                                            <p className="mt-1">{appointment.diagnosis}</p>
                                        </div>
                                    )}

                                    {/* Consultation Notes */}
                                    {appointment.consultation_notes && (
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">Consultation Notes</Label>
                                            <p className="mt-1 whitespace-pre-wrap">{appointment.consultation_notes}</p>
                                        </div>
                                    )}

                                    {/* Vital Signs */}
                                    {(appointment.blood_pressure || appointment.heart_rate || appointment.temperature || appointment.weight) && (
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground mb-3 block">Vital Signs</Label>
                                            <div className="grid grid-cols-2 gap-4">
                                                {appointment.blood_pressure && (
                                                    <div>
                                                        <span className="text-sm text-muted-foreground">Blood Pressure:</span>
                                                        <p className="font-medium">{appointment.blood_pressure}</p>
                                                    </div>
                                                )}
                                                {appointment.heart_rate && (
                                                    <div>
                                                        <span className="text-sm text-muted-foreground">Heart Rate:</span>
                                                        <p className="font-medium">{appointment.heart_rate} bpm</p>
                                                    </div>
                                                )}
                                                {appointment.temperature && (
                                                    <div>
                                                        <span className="text-sm text-muted-foreground">Temperature:</span>
                                                        <p className="font-medium">{appointment.temperature}°F</p>
                                                    </div>
                                                )}
                                                {appointment.weight && (
                                                    <div>
                                                        <span className="text-sm text-muted-foreground">Weight:</span>
                                                        <p className="font-medium">{appointment.weight} kg</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {!appointment.chief_complaint && !appointment.diagnosis && !appointment.consultation_notes && (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No additional details available
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="prescriptions">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Prescriptions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {prescriptions.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No prescriptions found for this appointment
                                        </p>
                                    ) : (
                                        prescriptions.map((prescription) => (
                                            <div key={prescription.id} className="p-4 border rounded-lg">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <p className="font-semibold">Prescription {prescription.prescription_number}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatDate(prescription.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                                {prescription.instructions && (
                                                    <p className="text-sm text-muted-foreground mb-3">
                                                        Instructions: {prescription.instructions}
                                                    </p>
                                                )}
                                                <div className="space-y-2">
                                                    {prescription.medicines?.map((med: any, index: number) => (
                                                        <div key={index} className="flex items-center gap-4 text-sm p-2 bg-muted/50 rounded">
                                                            <Pill className="h-4 w-4 text-primary" />
                                                            <span className="font-medium flex-1">{med.name}</span>
                                                            <span className="text-muted-foreground">{med.dosage}</span>
                                                            <span className="text-muted-foreground">{med.frequency}</span>
                                                            <span className="text-muted-foreground">{med.duration}</span>
                                                        </div>
                                                    ))}
                                                </div>
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

