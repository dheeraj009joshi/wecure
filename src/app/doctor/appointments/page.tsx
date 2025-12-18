'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Search, Filter, Video, MapPin, Check, X, CheckCircle, MoreHorizontal } from "lucide-react"
import { appointmentService } from '@/services/appointmentService';
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [filteredAppointments, setFilteredAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const { toast } = useToast();
    const router = useRouter();

    const fetchAppointments = async () => {
        try {
            const data = await appointmentService.getDoctorAppointments();
            setAppointments(data);
            setFilteredAppointments(data);
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
            toast({
                title: "Error",
                description: "Failed to load appointments",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    useEffect(() => {
        let result = appointments;

        // Filter by status
        if (statusFilter !== "all") {
            result = result.filter(apt => apt.status === statusFilter);
        }

        // Filter by search query (patient name or ID)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(apt =>
                apt.patient?.full_name?.toLowerCase().includes(query) ||
                apt.patient_id.toLowerCase().includes(query) ||
                apt.appointment_number?.toLowerCase().includes(query)
            );
        }

        setFilteredAppointments(result);
    }, [appointments, searchQuery, statusFilter]);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await appointmentService.updateStatus(id, newStatus);
            toast({
                title: "Success",
                description: `Appointment ${newStatus} successfully`,
            });
            fetchAppointments(); // Refresh list
        } catch (error) {
            console.error('Failed to update status:', error);
            toast({
                title: "Error",
                description: "Failed to update appointment status",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return <div className="p-8">Loading appointments...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
                    <p className="text-muted-foreground">
                        Manage your patient appointments
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => toast({ description: "Calendar view coming soon!" })}>
                        <Calendar className="mr-2 h-4 w-4" />
                        Calendar View
                    </Button>
                    <Button onClick={() => toast({ description: "Please ask patients to book via the patient portal." })}>
                        New Appointment
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search patients..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setStatusFilter("all")}>All</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("pending")}>Pending</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("confirmed")}>Confirmed</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("completed")}>Completed</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter("cancelled")}>Cancelled</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Patient</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAppointments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No appointments found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAppointments.map((appointment) => (
                                <TableRow key={appointment.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={appointment.patient?.avatar} />
                                                <AvatarFallback>{appointment.patient?.full_name?.charAt(0) || "P"}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{appointment.patient?.full_name || "Unknown Patient"}</div>
                                                <div className="text-xs text-muted-foreground">ID: {appointment.patient_id.substring(0, 8)}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{appointment.appointment_date?.split('T')[0] || appointment.appointment_date}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {typeof appointment.appointment_time === 'string' 
                                                    ? appointment.appointment_time 
                                                    : appointment.appointment_time?.substring(0, 5) || 'N/A'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            {appointment.appointment_type === 'video' ? (
                                                <>
                                                    <Video className="h-4 w-4 text-primary" />
                                                    <span>Video</span>
                                                </>
                                            ) : (
                                                <>
                                                    <MapPin className="h-4 w-4 text-primary" />
                                                    <span>In-Person</span>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            appointment.status === 'confirmed' ? 'default' :
                                                appointment.status === 'pending' ? 'secondary' :
                                                    appointment.status === 'cancelled' ? 'destructive' : 'outline'
                                        }>
                                            {appointment.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {appointment.status === 'pending' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                                                        title="Accept"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                                                        title="Reject"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                            {appointment.status === 'confirmed' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Complete
                                                </Button>
                                            )}
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => router.push(`/doctor/appointments/${appointment.id}`)}
                                            >
                                                View Details
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
