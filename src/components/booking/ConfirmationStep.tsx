"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Calendar, Download, Video, MapPin } from "lucide-react"
import Link from "next/link"
import { useBookingStore } from "@/store/bookingStore"
import { format } from "date-fns"

export function ConfirmationStep() {
    const { consultationType, selectedDate, selectedSlot, patientName } = useBookingStore()
    const [appointmentId, setAppointmentId] = useState("")

    useEffect(() => {
        setAppointmentId(`APT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`)
    }, [])

    return (
        <div className="space-y-8 max-w-2xl mx-auto text-center">
            {/* Success Animation */}
            <div className="space-y-4">
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-green-600">Appointment Confirmed!</h2>
                    <p className="text-muted-foreground">Your appointment has been successfully booked</p>
                </div>
            </div>

            {/* Appointment Details Card */}
            <Card className="border-green-200">
                <CardContent className="p-6 space-y-6">
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Appointment ID</p>
                        <p className="text-2xl font-bold text-green-700">{appointmentId}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 text-left">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Date & Time</p>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="font-semibold">{selectedDate ? format(selectedDate, "MMM d, yyyy") : "Date"}</p>
                                    <p className="text-sm text-muted-foreground">{selectedSlot || "Time"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Consultation Type</p>
                            <div className="flex items-center gap-2">
                                {consultationType === 'in-person' ? (
                                    <MapPin className="h-5 w-5 text-primary" />
                                ) : (
                                    <Video className="h-5 w-5 text-primary" />
                                )}
                                <div>
                                    <p className="font-semibold">
                                        {consultationType === 'zoom' ? 'Zoom Video Call' :
                                            consultationType === 'meet' ? 'Google Meet' :
                                                'In-Person Visit'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">30 minutes</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Patient Name</p>
                            <p className="font-semibold">{patientName}</p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Doctor</p>
                            <p className="font-semibold">Dr. Sarah Johnson</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Add to Calendar
                </Button>
                <Button variant="outline" size="lg" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download Receipt
                </Button>
            </div>

            {/* Next Steps */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6 text-left space-y-3">
                    <h3 className="font-semibold text-blue-900">What&apos;s Next?</h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>You will receive a confirmation email and SMS shortly</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>{consultationType === 'in-person'
                                ? 'Visit the clinic 10 minutes before your appointment'
                                : 'Join the video call 5 minutes before the scheduled time'}</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>You can reschedule or cancel up to 2 hours before the appointment</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/patient/appointments">
                    <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary-blue to-primary-purple">
                        View My Appointments
                    </Button>
                </Link>
                <Link href="/doctors">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                        Book Another Appointment
                    </Button>
                </Link>
            </div>
        </div>
    )
}
