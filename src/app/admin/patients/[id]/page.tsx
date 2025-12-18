"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Calendar,
    FileText,
    Pill,
    ActivitySquare,
    Download,
    MessageSquare,
    Loader2,
    ArrowLeft
} from "lucide-react"
import { adminService } from "@/services/adminService"
import { Patient } from "@/services/patientService"
import { Appointment } from "@/services/appointmentService"
import { prescriptionService } from "@/services/prescriptionService"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

export default function AdminPatientDetailPage() {
    const params = useParams()
    const patientId = params.id as string
    const [patient, setPatient] = useState<Patient | null>(null)
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [prescriptions, setPrescriptions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        if (patientId) {
            fetchPatientData()
        }
    }, [patientId])

    const fetchPatientData = async () => {
        try {
            const [patientData, appointmentsData] = await Promise.all([
                adminService.getPatientById(patientId),
                adminService.getPatientAppointments(patientId)
            ])
            
            setPatient(patientData)
            setAppointments(appointmentsData)

            // Get prescriptions for this patient
            try {
                const allPrescriptions = await prescriptionService.getPatientPrescriptions(patientId)
                setPrescriptions(allPrescriptions)
            } catch (error) {
                console.error('Failed to fetch prescriptions:', error)
                setPrescriptions([])
            }
        } catch (error: any) {
            console.error('Failed to fetch patient data:', error)
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to load patient data",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const calculateAge = (dateOfBirth?: string) => {
        if (!dateOfBirth) return null
        const today = new Date()
        const birthDate = new Date(dateOfBirth)
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        return age
    }

    const formatDate = (date: string | undefined) => {
        if (!date) return 'N/A'
        const d = new Date(date.split('T')[0])
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading patient record...</span>
            </div>
        )
    }

    if (!patient) {
        return (
            <div className="p-8">
                <Link href="/admin/patients">
                    <Button variant="outline" className="mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Patients
                    </Button>
                </Link>
                <p className="text-lg">Patient not found</p>
            </div>
        )
    }

    const patientAge = calculateAge(patient.date_of_birth)
    const sortedAppointments = [...appointments].sort((a, b) => {
        const dateA = a.appointment_date?.split('T')[0] || a.appointment_date
        const dateB = b.appointment_date?.split('T')[0] || b.appointment_date
        return new Date(dateB).getTime() - new Date(dateA).getTime()
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/admin/patients">
                        <Button variant="ghost" className="mb-2">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Patients
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold">Patient Record</h1>
                    <p className="text-muted-foreground">ID: {patient.id?.substring(0, 8) || patientId.substring(0, 8)}</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => toast({ description: "Messaging feature coming soon." })}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Message
                    </Button>
                    <Button variant="outline" onClick={() => toast({ description: "Export feature coming soon." })}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Record
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
                {/* Left Sidebar - Patient Info */}
                <div className="space-y-6">
                    {/* Patient Card */}
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex flex-col items-center text-center">
                                <Avatar className="h-24 w-24 mb-3">
                                    <AvatarImage src={patient.avatar_url} />
                                    <AvatarFallback>{patient.full_name?.charAt(0) || 'P'}</AvatarFallback>
                                </Avatar>
                                <h3 className="font-semibold text-lg">{patient.full_name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {patientAge ? `${patientAge} years` : ''} • {patient.gender || 'N/A'}
                                </p>
                                {patient.blood_group && (
                                    <Badge className="mt-2">{patient.blood_group}</Badge>
                                )}
                            </div>

                            <div className="space-y-2 text-sm pt-4 border-t">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Phone:</span>
                                    <span className="font-medium">{patient.phone || 'N/A'}</span>
                                </div>
                                {patient.address && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Address:</span>
                                        <span className="font-medium text-xs">{patient.address}</span>
                                    </div>
                                )}
                                {patient.created_at && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Registered:</span>
                                        <span className="font-medium">{formatDate(patient.created_at)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 pt-4 border-t">
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium">Total Visits:</span>
                                    <span className="text-sm font-bold text-primary">{appointments.length}</span>
                                </div>
                                {sortedAppointments.length > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">Last Visit:</span>
                                        <span className="text-sm">{formatDate(sortedAppointments[0].appointment_date)}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Allergies */}
                    {patient.allergies && patient.allergies.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Allergies</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {patient.allergies.map((allergy: string, index: number) => (
                                        <Badge key={index} variant="destructive">{allergy}</Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Medical History */}
                    {patient.chronic_conditions && patient.chronic_conditions.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Medical History</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {patient.chronic_conditions.map((condition: string, index: number) => (
                                    <div key={index} className="text-sm">
                                        <p className="font-medium">{condition}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    <Tabs defaultValue="appointments" className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="appointments">
                                <Calendar className="h-4 w-4 mr-2" />
                                Appointments ({appointments.length})
                            </TabsTrigger>
                            <TabsTrigger value="prescriptions">
                                <Pill className="h-4 w-4 mr-2" />
                                Prescriptions ({prescriptions.length})
                            </TabsTrigger>
                            <TabsTrigger value="vitals">
                                <ActivitySquare className="h-4 w-4 mr-2" />
                                Vital Trends
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="appointments">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Appointment History</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {sortedAppointments.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No appointments found
                                        </p>
                                    ) : (
                                        sortedAppointments.map((appointment) => (
                                            <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="flex-1">
                                                    <p className="font-semibold">
                                                        {appointment.chief_complaint || 'No complaint provided'}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                        <span>ID: {appointment.appointment_number || appointment.id.substring(0, 8)}</span>
                                                        <span>{formatDate(appointment.appointment_date)}</span>
                                                        <span>
                                                            {appointment.appointment_time ? appointment.appointment_time.substring(0, 5) : 'N/A'}
                                                        </span>
                                                        {appointment.doctor && (
                                                            <span>Dr. {appointment.doctor.full_name}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge className={`${
                                                        appointment.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                                        appointment.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {appointment.status}
                                                    </Badge>
                                                    <Link href={`/admin/appointments?appointment=${appointment.id}`}>
                                                        <Button variant="outline" size="sm">
                                                            View Details
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="prescriptions">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Prescription History</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {prescriptions.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No prescriptions found
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
                                                    <Button variant="outline" size="sm" onClick={() => toast({ description: "Download feature coming soon" })}>
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Download
                                                    </Button>
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

                        <TabsContent value="vitals">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Vital Signs Trends</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {sortedAppointments.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No vital signs data available
                                        </p>
                                    ) : (
                                        <>
                                            {sortedAppointments.some(apt => apt.blood_pressure) && (
                                                <div>
                                                    <h4 className="font-semibold mb-3">Blood Pressure</h4>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {sortedAppointments
                                                            .filter(apt => apt.blood_pressure)
                                                            .slice(0, 4)
                                                            .map((apt, index) => (
                                                                <div key={index} className="flex-1 min-w-[120px] p-3 border rounded text-center">
                                                                    <p className="text-sm text-muted-foreground">Visit {index + 1}</p>
                                                                    <p className="font-bold text-lg mt-1">{apt.blood_pressure}</p>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}

                                            {sortedAppointments.some(apt => apt.heart_rate) && (
                                                <div>
                                                    <h4 className="font-semibold mb-3">Heart Rate (bpm)</h4>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {sortedAppointments
                                                            .filter(apt => apt.heart_rate)
                                                            .slice(0, 4)
                                                            .map((apt, index) => (
                                                                <div key={index} className="flex-1 min-w-[120px] p-3 border rounded text-center">
                                                                    <p className="text-sm text-muted-foreground">Visit {index + 1}</p>
                                                                    <p className="font-bold text-lg mt-1">{apt.heart_rate}</p>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}

                                            {sortedAppointments.some(apt => apt.weight) && (
                                                <div>
                                                    <h4 className="font-semibold mb-3">Weight (kg)</h4>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {sortedAppointments
                                                            .filter(apt => apt.weight)
                                                            .slice(0, 4)
                                                            .map((apt, index) => (
                                                                <div key={index} className="flex-1 min-w-[120px] p-3 border rounded text-center">
                                                                    <p className="text-sm text-muted-foreground">Visit {index + 1}</p>
                                                                    <p className="font-bold text-lg mt-1">{apt.weight}</p>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            )}

                                            {!sortedAppointments.some(apt => apt.blood_pressure || apt.heart_rate || apt.weight) && (
                                                <p className="text-sm text-muted-foreground text-center py-8">
                                                    No vital signs recorded yet
                                                </p>
                                            )}
                                        </>
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

