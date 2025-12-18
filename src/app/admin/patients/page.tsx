"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MoreVertical } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { adminService } from "@/services/adminService"
import { Patient } from "@/services/patientService"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

export default function AdminPatients() {
    const { toast } = useToast()
    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [patientAppointmentCounts, setPatientAppointmentCounts] = useState<{ [key: string]: number }>({})

    const fetchData = async () => {
        setLoading(true)
        try {
            const patientsData = await adminService.getAllPatients(searchQuery || undefined)
            setPatients(patientsData)

            // Fetch appointment counts for each patient from admin appointments
            const counts: { [key: string]: number } = {}
            try {
                const allAppointments = await adminService.getAllAppointments()
                patientsData.forEach(patient => {
                    counts[patient.id] = allAppointments.filter(apt => apt.patient_id === patient.id).length
                })
            } catch (error) {
                // If we can't fetch appointments, set all to 0
                patientsData.forEach(patient => {
                    counts[patient.id] = 0
                })
            }
            setPatientAppointmentCounts(counts)
        } catch (error: any) {
            console.error('Failed to fetch patients:', error)
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to load patients",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery])

    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A"
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    if (loading) {
        return <div className="p-8 text-center">Loading patients...</div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Patient Management</h1>
                <p className="text-muted-foreground">View and manage all patients</p>
            </div>

            {/* Search */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search patients..." 
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Patient List */}
            <div className="space-y-4">
                {patients.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No patients found</p>
                    </div>
                ) : (
                    patients.map((patient) => (
                        <Card key={patient.id}>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={patient.avatar_url} />
                                        <AvatarFallback>{patient.full_name?.[0] || "P"}</AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-semibold text-lg">{patient.full_name}</h3>
                                                <p className="text-sm text-muted-foreground">{patient.phone || 'N/A'}</p>
                                                <p className="text-sm text-muted-foreground">{patient.phone}</p>
                                            </div>
                                            <Badge className="bg-green-100 text-green-700">Active</Badge>
                                        </div>

                                        <div className="flex items-center gap-6 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Appointments: </span>
                                                <span className="font-semibold">{patientAppointmentCounts[patient.id] || 0}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Joined: </span>
                                                <span className="font-semibold">{formatDate(patient.created_at)}</span>
                                            </div>
                                            {patient.date_of_birth && (
                                                <div>
                                                    <span className="text-muted-foreground">DOB: </span>
                                                    <span className="font-semibold">{formatDate(patient.date_of_birth)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Link href={`/admin/patients/${patient.id}`}>
                                            <Button variant="outline">View Details</Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
