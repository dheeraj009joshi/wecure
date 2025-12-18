"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, Video, MapPin } from "lucide-react"
import { adminService } from "@/services/adminService"
import { Appointment } from "@/services/appointmentService"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminAppointments() {
    const { toast } = useToast()
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        today: 0,
        completed: 0,
        cancelled: 0,
        upcoming: 0
    })
    const [activeTab, setActiveTab] = useState("all")

    const fetchData = async () => {
        setLoading(true)
        try {
            const allAppointments = await adminService.getAllAppointments()
            setAppointments(allAppointments)

            // Calculate stats
            const today = new Date().toISOString().split('T')[0]
            const todayCount = allAppointments.filter(apt => 
                apt.appointment_date === today
            ).length
            const completedCount = allAppointments.filter(apt => 
                apt.status === 'completed'
            ).length
            const cancelledCount = allAppointments.filter(apt => 
                apt.status === 'cancelled'
            ).length
            const upcomingCount = allAppointments.filter(apt => 
                apt.status === 'pending' || apt.status === 'confirmed'
            ).length

            setStats({
                today: todayCount,
                completed: completedCount,
                cancelled: cancelledCount,
                upcoming: upcomingCount
            })
        } catch (error: any) {
            console.error('Failed to fetch appointments:', error)
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to load appointments",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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
        return timeString
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

    const filteredAppointments = activeTab === "all" 
        ? appointments 
        : appointments.filter(apt => {
            if (activeTab === "upcoming") {
                return apt.status === 'pending' || apt.status === 'confirmed'
            }
            return apt.status === activeTab
        })

    if (loading) {
        return <div className="p-8 text-center">Loading appointments...</div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Appointment Management</h1>
                <p className="text-muted-foreground">Monitor all appointments on the platform</p>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">Today&apos;s Appointments</p>
                        <p className="text-3xl font-bold mt-2">{stats.today}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">Completed</p>
                        <p className="text-3xl font-bold mt-2">{stats.completed}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">Cancelled</p>
                        <p className="text-3xl font-bold mt-2">{stats.cancelled}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">Upcoming</p>
                        <p className="text-3xl font-bold mt-2">{stats.upcoming}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Appointments List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList>
                            <TabsTrigger value="all">All ({appointments.length})</TabsTrigger>
                            <TabsTrigger value="upcoming">Upcoming ({stats.upcoming})</TabsTrigger>
                            <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
                            <TabsTrigger value="cancelled">Cancelled ({stats.cancelled})</TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeTab} className="mt-6">
                            <div className="space-y-4">
                                {filteredAppointments.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <p>No appointments found</p>
                                    </div>
                                ) : (
                                    filteredAppointments.map((appointment) => (
                                        <div key={appointment.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="flex -space-x-2">
                                                    <Avatar className="h-10 w-10 border-2 border-background">
                                                        <AvatarImage src={appointment.patient?.avatar_url} />
                                                        <AvatarFallback>{appointment.patient?.full_name?.[0] || "P"}</AvatarFallback>
                                                    </Avatar>
                                                    <Avatar className="h-10 w-10 border-2 border-background">
                                                        <AvatarImage src={appointment.doctor?.avatar_url} />
                                                        <AvatarFallback>{appointment.doctor?.full_name?.[0] || "D"}</AvatarFallback>
                                                    </Avatar>
                                                </div>

                                                <div className="flex-1">
                                                    <p className="font-semibold">
                                                        {appointment.patient?.full_name || "Unknown"} → {appointment.doctor?.full_name || "Unknown"}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>{formatDate(appointment.appointment_date)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            <span>{formatTime(appointment.appointment_time)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {appointment.appointment_type === "video" ? (
                                                                <>
                                                                    <Video className="h-3 w-3" />
                                                                    <span>Video</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <MapPin className="h-3 w-3" />
                                                                    <span>In-Person</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <Badge className={getStatusBadgeClass(appointment.status || '')}>
                                                    {appointment.status}
                                                </Badge>

                                                <Link href={`/admin/appointments/${appointment.id}`}>
                                                    <Button variant="outline" size="sm">View Details</Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
