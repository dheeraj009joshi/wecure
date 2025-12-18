import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MoreHorizontal, Video, MapPin, Phone } from "lucide-react"

interface Appointment {
    id: string;
    patient_id: string;
    appointment_time: string;
    status: string;
    appointment_type: string;
    reason?: string;
    // Optional fields if we join data, otherwise we use placeholders
    patient_name?: string;
    patient_avatar?: string;
}

interface TodayScheduleProps {
    appointments: Appointment[];
}

export function TodaySchedule({ appointments }: TodayScheduleProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-700 hover:bg-green-100';
            case 'pending': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100';
            case 'cancelled': return 'bg-red-100 text-red-700 hover:bg-red-100';
            default: return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
        }
    };

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>
                    You have {appointments.length} appointments scheduled for today.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {appointments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No appointments for today.</p>
                    ) : (
                        appointments.map((appointment) => (
                            <div key={appointment.id} className="flex items-center">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={appointment.patient_avatar || "/avatars/01.png"} alt="Avatar" />
                                    <AvatarFallback>P</AvatarFallback>
                                </Avatar>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">{appointment.patient_name || `Patient ${appointment.patient_id.substring(0, 8)}...`}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {appointment.reason || "General Consultation"}
                                    </p>
                                </div>
                                <div className="ml-auto flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        {appointment.appointment_type === 'video' ? (
                                            <Video className="h-4 w-4" />
                                        ) : (
                                            <MapPin className="h-4 w-4" />
                                        )}
                                        {appointment.appointment_time}
                                    </div>
                                    <Badge className={getStatusColor(appointment.status)}>
                                        {appointment.status}
                                    </Badge>

                                    {appointment.status === 'confirmed' && appointment.appointment_type === 'video' && (
                                        <Button size="sm" variant="outline" className="h-8">
                                            <Video className="h-3 w-3 mr-2" />
                                            Join
                                        </Button>
                                    )}

                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
