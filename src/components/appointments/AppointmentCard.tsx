import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, Video, MapPin, Download, MoreVertical } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface Appointment {
    id: string
    doctorName: string
    doctorSpecialty: string
    doctorImage: string
    date: string
    time: string
    type: 'video' | 'in-person'
    status: 'upcoming' | 'completed' | 'cancelled'
    patientName?: string
    clinic?: string
}

export function AppointmentCard({ appointment }: { appointment: Appointment }) {
    const isUpcoming = appointment.status === 'upcoming'
    const isCompleted = appointment.status === 'completed'

    return (
        <Card className={isCompleted ? 'opacity-75' : ''}>
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Doctor Info */}
                    <div className="flex gap-4 flex-1">
                        <Avatar className="h-16 w-16 rounded-xl">
                            <AvatarImage src={appointment.doctorImage} />
                            <AvatarFallback>{appointment.doctorName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="font-semibold text-lg">{appointment.doctorName}</h3>
                                    <p className="text-sm text-muted-foreground">{appointment.doctorSpecialty}</p>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>View Details</DropdownMenuItem>
                                        {isUpcoming && <DropdownMenuItem>Reschedule</DropdownMenuItem>}
                                        {isUpcoming && <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>}
                                        {isCompleted && <DropdownMenuItem>Download Prescription</DropdownMenuItem>}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{appointment.date}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{appointment.time}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {appointment.type === 'video' ? (
                                        <>
                                            <Video className="h-4 w-4 text-primary" />
                                            <span>Video Call</span>
                                        </>
                                    ) : (
                                        <>
                                            <MapPin className="h-4 w-4 text-primary" />
                                            <span>{appointment.clinic}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {appointment.patientName && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    Patient: {appointment.patientName}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex md:flex-col gap-3 items-end justify-between md:justify-start border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                        <Badge
                            className={
                                appointment.status === 'upcoming'
                                    ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                    : appointment.status === 'completed'
                                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                            }
                        >
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </Badge>

                        <div className="flex md:flex-col gap-2 w-full md:w-auto">
                            {isUpcoming && appointment.type === 'video' && (
                                <Button className="w-full md:w-auto bg-green-600 hover:bg-green-700 gap-2 animate-pulse">
                                    <Video className="h-4 w-4" />
                                    Join Call
                                </Button>
                            )}
                            {isUpcoming && appointment.type === 'in-person' && (
                                <Button variant="outline" className="w-full md:w-auto">
                                    Get Directions
                                </Button>
                            )}
                            {isCompleted && (
                                <Button variant="outline" className="w-full md:w-auto gap-2">
                                    <Download className="h-4 w-4" />
                                    Prescription
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
