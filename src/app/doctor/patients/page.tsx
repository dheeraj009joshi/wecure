'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Filter } from "lucide-react"
import Link from "next/link"
import { appointmentService } from '@/services/appointmentService';
import { useToast } from "@/components/ui/use-toast"

export default function DoctorPatients() {
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            // Get all doctor's appointments
            const appointments = await appointmentService.getDoctorAppointments();

            // Extract unique patients with their details
            const uniquePatients = new Map();
            appointments.forEach((apt: any) => {
                if (!uniquePatients.has(apt.patient_id)) {
                    uniquePatients.set(apt.patient_id, {
                        id: apt.patient_id,
                        patient_id: apt.patient_id,
                        full_name: apt.patient?.full_name || 'Unknown Patient',
                        phone: apt.patient?.phone || 'N/A',
                        email: apt.patient?.email,
                        avatar_url: apt.patient?.avatar_url,
                        date_of_birth: apt.patient?.date_of_birth,
                        gender: apt.patient?.gender,
                        appointments: [apt]
                    });
                } else {
                    uniquePatients.get(apt.patient_id).appointments.push(apt);
                }
            });

            const patientsList = Array.from(uniquePatients.values()).map(p => {
                const sortedAppointments = p.appointments.sort((a: any, b: any) => {
                    const dateA = a.appointment_date?.split('T')[0] || a.appointment_date;
                    const dateB = b.appointment_date?.split('T')[0] || b.appointment_date;
                    return new Date(dateB).getTime() - new Date(dateA).getTime();
                });
                return {
                    ...p,
                    totalVisits: p.appointments.length,
                    lastVisit: sortedAppointments[0]?.appointment_date?.split('T')[0] || sortedAppointments[0]?.appointment_date
                };
            });

            setPatients(patientsList);
        } catch (error) {
            console.error('Failed to fetch patients:', error);
            toast({
                title: "Error",
                description: "Failed to load patients",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredPatients = patients.filter(p =>
        p.patient_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return <div className="p-8">Loading patients...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Patients</h1>
                <p className="text-muted-foreground">View and manage your patient records</p>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search patients by name, ID, or phone..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                </Button>
            </div>

            {/* Patient List */}
            <div className="grid gap-4">
                {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => (
                        <Card key={patient.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={patient.avatar_url} />
                                        <AvatarFallback>{patient.full_name?.charAt(0) || 'P'}</AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-semibold text-lg">{patient.full_name}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    ID: {patient.patient_id.substring(0, 8)}... • {patient.phone}
                                                </p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {patient.totalVisits} appointment{patient.totalVisits !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                            <Badge variant="outline">{patient.totalVisits} visits</Badge>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>Last visit: {patient.lastVisit || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Link href={`/doctor/patients/${patient.id}`}>
                                            <Button>View Records</Button>
                                        </Link>
                                        <Button variant="outline" onClick={() => toast({ description: "Messaging feature coming soon." })}>Message</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card>
                        <CardContent className="p-12 text-center text-muted-foreground">
                            <p>No patients found</p>
                            <p className="text-sm mt-2">Patients will appear here once they book appointments with you</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
