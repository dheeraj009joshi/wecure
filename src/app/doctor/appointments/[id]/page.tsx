"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Calendar,
    Clock,
    Video,
    MapPin,
    Phone,
    FileText,
    Pill,
    TestTube,
    Save,
    Send,
    Download,
    Loader2
} from "lucide-react"
import { appointmentService } from "@/services/appointmentService"
import { prescriptionService, Medicine } from "@/services/prescriptionService"
import { useToast } from "@/components/ui/use-toast"

export default function AppointmentDetailPage() {
    const params = useParams()
    const router = useRouter()
    const appointmentId = params.id as string
    const [appointment, setAppointment] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [notes, setNotes] = useState("")
    const [diagnosis, setDiagnosis] = useState("")
    const [vitalSigns, setVitalSigns] = useState({
        blood_pressure: "",
        heart_rate: "",
        temperature: "",
        weight: ""
    })
    const [prescription, setPrescription] = useState<Medicine[]>([
        { name: "", dosage: "", frequency: "", duration: "" }
    ])
    const [instructions, setInstructions] = useState("")
    const [existingPrescription, setExistingPrescription] = useState<any>(null)
    const { toast } = useToast()

    useEffect(() => {
        if (appointmentId) {
            fetchAppointment()
        }
    }, [appointmentId])

    const fetchAppointment = async () => {
        try {
            const data = await appointmentService.getById(appointmentId)
            setAppointment(data)
            setNotes(data.consultation_notes || "")
            setDiagnosis(data.diagnosis || "")
            setVitalSigns({
                blood_pressure: data.blood_pressure || "",
                heart_rate: data.heart_rate || "",
                temperature: data.temperature || "",
                weight: data.weight || ""
            })

            // Check for existing prescription
            const prescriptions = await prescriptionService.getAll(appointmentId)
            if (prescriptions.length > 0) {
                setExistingPrescription(prescriptions[0])
                setPrescription(prescriptions[0].medicines)
                setInstructions(prescriptions[0].instructions || "")
            }
        } catch (error) {
            console.error('Failed to fetch appointment:', error)
            toast({
                title: "Error",
                description: "Failed to load appointment details",
                variant: "destructive",
            })
            router.push('/doctor/appointments')
        } finally {
            setLoading(false)
        }
    }

    const handleSaveNotes = async () => {
        setSaving(true)
        try {
            await appointmentService.update(appointmentId, {
                consultation_notes: notes,
                diagnosis: diagnosis,
                ...vitalSigns
            })
            toast({
                title: "Success",
                description: "Notes saved successfully",
            })
            fetchAppointment()
        } catch (error) {
            console.error('Failed to save notes:', error)
            toast({
                title: "Error",
                description: "Failed to save notes",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    const handleSavePrescription = async () => {
        // Filter out empty medicines
        const validMedicines = prescription.filter(
            med => med.name && med.dosage && med.frequency && med.duration
        )

        if (validMedicines.length === 0) {
            toast({
                title: "Error",
                description: "Please add at least one medicine",
                variant: "destructive",
            })
            return
        }

        setSaving(true)
        try {
            await prescriptionService.create({
                appointment_id: appointmentId,
                medicines: validMedicines,
                instructions: instructions
            })
            toast({
                title: "Success",
                description: "Prescription created successfully",
            })
            fetchAppointment()
        } catch (error: any) {
            console.error('Failed to create prescription:', error)
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to create prescription",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    const handleCompleteAppointment = async () => {
        setSaving(true)
        try {
            await appointmentService.update(appointmentId, {
                status: 'completed',
                consultation_notes: notes,
                diagnosis: diagnosis,
                ...vitalSigns
            })
            toast({
                title: "Success",
                description: "Appointment completed successfully",
            })
            router.push('/doctor/appointments')
        } catch (error) {
            console.error('Failed to complete appointment:', error)
            toast({
                title: "Error",
                description: "Failed to complete appointment",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    const addMedicine = () => {
        setPrescription([...prescription, { name: "", dosage: "", frequency: "", duration: "" }])
    }

    const updateMedicine = (index: number, field: keyof Medicine, value: string) => {
        const updated = [...prescription]
        updated[index] = { ...updated[index], [field]: value }
        setPrescription(updated)
    }

    const removeMedicine = (index: number) => {
        setPrescription(prescription.filter((_, i) => i !== index))
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

    if (loading) {
        return <div className="p-8">Loading appointment details...</div>
    }

    if (!appointment) {
        return <div className="p-8">Appointment not found</div>
    }

    const appointmentDate = appointment.appointment_date?.split('T')[0] || appointment.appointment_date
    const appointmentTime = typeof appointment.appointment_time === 'string' 
        ? appointment.appointment_time 
        : appointment.appointment_time?.substring(0, 5) || 'N/A'
    const patientAge = calculateAge(appointment.patient?.date_of_birth)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Appointment Details</h1>
                    <p className="text-muted-foreground">ID: {appointment.appointment_number || appointment.id}</p>
                </div>
                <div className="flex gap-3">
                    {appointment.appointment_type === "video" && appointment.status === "confirmed" && (
                        <Button className="bg-green-600 hover:bg-green-700">
                            <Video className="h-4 w-4 mr-2" />
                            Join Video Call
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => toast({ description: "Call feature coming soon" })}>
                        <Phone className="h-4 w-4 mr-2" />
                        Call Patient
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column - Patient Info */}
                <div className="space-y-6">
                    {/* Patient Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Patient Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={appointment.patient?.avatar_url} />
                                    <AvatarFallback>
                                        {appointment.patient?.full_name?.charAt(0) || "P"}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-lg">
                                        {appointment.patient?.full_name || "Unknown Patient"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {patientAge ? `${patientAge} years` : ''} • {appointment.patient?.gender || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Phone:</span>
                                    <span className="font-medium">{appointment.patient?.phone || 'N/A'}</span>
                                </div>
                                {appointment.patient?.email && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Email:</span>
                                        <span className="font-medium">{appointment.patient.email}</span>
                                    </div>
                                )}
                            </div>

                            <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => router.push(`/doctor/patients/${appointment.patient_id}`)}
                            >
                                View Full Medical History
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Appointment Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Appointment Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Date</p>
                                    <p className="font-medium">{appointmentDate}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Time</p>
                                    <p className="font-medium">{appointmentTime}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {appointment.appointment_type === "video" ? (
                                    <Video className="h-5 w-5 text-primary" />
                                ) : (
                                    <MapPin className="h-5 w-5 text-primary" />
                                )}
                                <div>
                                    <p className="text-sm text-muted-foreground">Type</p>
                                    <p className="font-medium">
                                        {appointment.appointment_type === "video" ? "Video Consultation" : "In-Person Visit"}
                                    </p>
                                </div>
                            </div>
                            <Badge className={`w-full justify-center ${
                                appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                appointment.status === 'completed' ? 'bg-green-100 text-green-700' :
                                appointment.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                                {appointment.status}
                            </Badge>
                        </CardContent>
                    </Card>

                    {/* Vital Signs */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Vital Signs</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Blood Pressure:</span>
                                <span className="font-medium">{vitalSigns.blood_pressure || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Heart Rate:</span>
                                <span className="font-medium">{vitalSigns.heart_rate || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Temperature:</span>
                                <span className="font-medium">{vitalSigns.temperature || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Weight:</span>
                                <span className="font-medium">{vitalSigns.weight || 'N/A'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Consultation Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Chief Complaint */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Chief Complaint</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">{appointment.chief_complaint || 'No complaint provided'}</p>
                            {appointment.symptoms && appointment.symptoms.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {appointment.symptoms.map((symptom: string, index: number) => (
                                        <Badge key={index} variant="outline">{symptom}</Badge>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tabs for Prescription, Notes, etc */}
                    <Card>
                        <Tabs defaultValue="prescription">
                            <CardHeader>
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="prescription">
                                        <Pill className="h-4 w-4 mr-2" />
                                        Prescription
                                    </TabsTrigger>
                                    <TabsTrigger value="notes">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Notes
                                    </TabsTrigger>
                                    <TabsTrigger value="tests">
                                        <TestTube className="h-4 w-4 mr-2" />
                                        Lab Tests
                                    </TabsTrigger>
                                </TabsList>
                            </CardHeader>

                            <CardContent>
                                <TabsContent value="prescription" className="space-y-4">
                                    {existingPrescription ? (
                                        <div className="text-sm text-muted-foreground mb-4 p-4 bg-muted rounded-lg">
                                            Prescription already created. View in patient records.
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-sm text-muted-foreground mb-4">
                                                Write prescription for the patient
                                            </div>

                                            {prescription.map((med, index) => (
                                                <div key={index} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
                                                    <div className="space-y-2">
                                                        <Label>Medicine Name</Label>
                                                        <Input 
                                                            placeholder="e.g., Aspirin" 
                                                            value={med.name}
                                                            onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Dosage</Label>
                                                        <Input 
                                                            placeholder="e.g., 500mg" 
                                                            value={med.dosage}
                                                            onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Frequency</Label>
                                                        <Input 
                                                            placeholder="e.g., 2x daily" 
                                                            value={med.frequency}
                                                            onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Duration</Label>
                                                        <div className="flex gap-2">
                                                            <Input 
                                                                placeholder="e.g., 7 days" 
                                                                value={med.duration}
                                                                onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                                                            />
                                                            {prescription.length > 1 && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => removeMedicine(index)}
                                                                >
                                                                    ×
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            <Button variant="outline" onClick={addMedicine} className="w-full">
                                                + Add Medicine
                                            </Button>

                                            <div className="space-y-2">
                                                <Label>Instructions</Label>
                                                <Textarea
                                                    placeholder="Additional instructions for the patient..."
                                                    rows={3}
                                                    value={instructions}
                                                    onChange={(e) => setInstructions(e.target.value)}
                                                />
                                            </div>

                                            <div className="flex gap-2 pt-4">
                                                <Button 
                                                    className="flex-1" 
                                                    onClick={handleSavePrescription}
                                                    disabled={saving}
                                                >
                                                    {saving ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="h-4 w-4 mr-2" />
                                                            Save Prescription
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </TabsContent>

                                <TabsContent value="notes" className="space-y-4">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Diagnosis</Label>
                                            <Input
                                                placeholder="Enter diagnosis..."
                                                value={diagnosis}
                                                onChange={(e) => setDiagnosis(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Vital Signs</Label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-xs">Blood Pressure</Label>
                                                    <Input
                                                        placeholder="e.g., 120/80"
                                                        value={vitalSigns.blood_pressure}
                                                        onChange={(e) => setVitalSigns({...vitalSigns, blood_pressure: e.target.value})}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Heart Rate</Label>
                                                    <Input
                                                        placeholder="e.g., 72 bpm"
                                                        value={vitalSigns.heart_rate}
                                                        onChange={(e) => setVitalSigns({...vitalSigns, heart_rate: e.target.value})}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Temperature</Label>
                                                    <Input
                                                        placeholder="e.g., 98.6°F"
                                                        value={vitalSigns.temperature}
                                                        onChange={(e) => setVitalSigns({...vitalSigns, temperature: e.target.value})}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Weight</Label>
                                                    <Input
                                                        placeholder="e.g., 75 kg"
                                                        value={vitalSigns.weight}
                                                        onChange={(e) => setVitalSigns({...vitalSigns, weight: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Consultation Notes</Label>
                                            <Textarea
                                                placeholder="Write your consultation notes here..."
                                                rows={10}
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <Button onClick={handleSaveNotes} disabled={saving}>
                                        {saving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                Save Notes
                                            </>
                                        )}
                                    </Button>
                                </TabsContent>

                                <TabsContent value="tests" className="space-y-4">
                                    <div className="text-sm text-muted-foreground mb-4">
                                        Lab test ordering feature coming soon
                                    </div>
                                </TabsContent>
                            </CardContent>
                        </Tabs>
                    </Card>

                    {/* Action Buttons */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex gap-3">
                                {appointment.status !== 'completed' && (
                                    <Button 
                                        className="flex-1 bg-green-600 hover:bg-green-700" 
                                        onClick={handleCompleteAppointment}
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Completing...
                                            </>
                                        ) : (
                                            'Complete Consultation'
                                        )}
                                    </Button>
                                )}
                                <Button variant="outline" className="flex-1" onClick={() => toast({ description: "Download feature coming soon" })}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Summary
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
