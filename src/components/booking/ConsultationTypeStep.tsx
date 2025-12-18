"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video, MapPin, Check } from "lucide-react"
import { useBookingStore } from "@/store/bookingStore"
import { cn } from "@/lib/utils"

const consultationTypes = [
    {
        id: 'zoom' as const,
        name: 'Zoom Video Call',
        icon: Video,
        duration: '30 mins',
        description: 'Works on desktop & mobile',
        gradient: 'from-blue-500 to-cyan-500'
    },
    {
        id: 'meet' as const,
        name: 'Google Meet',
        icon: Video,
        duration: '30 mins',
        description: 'Works on desktop & mobile',
        gradient: 'from-green-500 to-emerald-500'
    },
    {
        id: 'in-person' as const,
        name: 'In-Person Visit',
        icon: MapPin,
        duration: '45 mins',
        description: 'Visit clinic directly',
        gradient: 'from-purple-500 to-pink-500'
    }
]

export function ConsultationTypeStep() {
    const { consultationType, setConsultationType } = useBookingStore()

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Select Consultation Type</h2>
                <p className="text-muted-foreground">Choose how you'd like to consult with the doctor</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {consultationTypes.map((type) => (
                    <Card
                        key={type.id}
                        className={cn(
                            "cursor-pointer transition-all hover:shadow-lg border-2",
                            consultationType === type.id
                                ? "border-primary ring-2 ring-primary ring-offset-2"
                                : "border-border hover:border-primary/50"
                        )}
                        onClick={() => setConsultationType(type.id)}
                    >
                        <CardContent className="p-6 space-y-4">
                            <div className={cn("h-16 w-16 rounded-full bg-gradient-to-br flex items-center justify-center mx-auto", type.gradient)}>
                                <type.icon className="h-8 w-8 text-white" />
                            </div>

                            <div className="text-center space-y-1">
                                <h3 className="font-semibold text-lg">{type.name}</h3>
                                <p className="text-sm text-primary font-medium">{type.duration}</p>
                                <p className="text-xs text-muted-foreground">{type.description}</p>
                            </div>

                            {consultationType === type.id && (
                                <div className="flex justify-center">
                                    <div className="bg-primary rounded-full p-1">
                                        <Check className="h-4 w-4 text-primary-foreground" />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
