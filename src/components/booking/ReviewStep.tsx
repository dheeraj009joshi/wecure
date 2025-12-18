"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useBookingStore } from "@/store/bookingStore"
import { format } from "date-fns"
import { Video, MapPin, Calendar, Clock, User, FileText, Edit } from "lucide-react"
import { useState } from "react"

interface ReviewStepProps {
    onEdit?: (step: number) => void
}

export function ReviewStep({ onEdit }: ReviewStepProps) {
    const { consultationType, selectedDate, selectedSlot, patientName, patientAge, patientGender, symptoms } = useBookingStore()
    const [agreedToTerms, setAgreedToTerms] = useState(false)

    const consultationFee = 1500
    const platformFee = 50
    const gst = (consultationFee + platformFee) * 0.18
    const total = consultationFee + platformFee + gst

    const getConsultationIcon = () => {
        switch (consultationType) {
            case 'zoom':
                return { icon: Video, label: 'Zoom Video Call' }
            case 'meet':
                return { icon: Video, label: 'Google Meet' }
            case 'in-person':
                return { icon: MapPin, label: 'In-Person Visit' }
            default:
                return { icon: Calendar, label: 'Not Selected' }
        }
    }

    const ConsultIcon = getConsultationIcon().icon

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Review & Confirm</h2>
                <p className="text-muted-foreground">Please review your appointment details</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Appointment Details */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-lg">Appointment Details</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => onEdit?.(0)} className="h-8 px-2">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            <ConsultIcon className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                                <p className="font-medium">{getConsultationIcon().label}</p>
                                <p className="text-sm text-muted-foreground">30 minutes</p>
                            </div>
                        </div>

                        <Separator />

                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                                <p className="font-medium">{selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Not selected"}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {selectedSlot || "Not selected"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Patient Details */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-lg">Patient Information</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => onEdit?.(2)} className="h-8 px-2">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                                <p className="font-medium">{patientName || "Not provided"}</p>
                                <p className="text-sm text-muted-foreground">{patientAge} years, {patientGender}</p>
                            </div>
                        </div>

                        <Separator />

                        <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                                <p className="font-medium text-sm">Primary Concern</p>
                                <p className="text-sm text-muted-foreground">{symptoms || "Not provided"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payment Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Consultation Fee</span>
                        <span className="font-medium">₹{consultationFee}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform Fee</span>
                        <span className="font-medium">₹{platformFee}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">GST (18%)</span>
                        <span className="font-medium">₹{gst.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg">
                        <span className="font-bold">Total Amount</span>
                        <span className="font-bold text-primary">₹{total.toFixed(2)}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Terms & Conditions */}
            <div className="flex items-start space-x-2 bg-muted/30 p-4 rounded-lg">
                <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)} />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                    I agree to the <span className="text-primary underline">Terms & Conditions</span> and <span className="text-primary underline">Privacy Policy</span>. I understand the cancellation and refund policies.
                </Label>
            </div>
        </div>
    )
}
