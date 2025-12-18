"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { addDays, format, isSameDay, startOfToday } from "date-fns"

export function AvailabilityCalendar() {
    const [selectedDate, setSelectedDate] = useState<Date>(startOfToday())
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
    const [startIndex, setStartIndex] = useState(0)

    const today = startOfToday()
    const days = Array.from({ length: 14 }, (_, i) => addDays(today, i))
    const visibleDays = days.slice(startIndex, startIndex + 4)

    const nextDays = () => {
        if (startIndex + 4 < days.length) setStartIndex(startIndex + 1)
    }

    const prevDays = () => {
        if (startIndex > 0) setStartIndex(startIndex - 1)
    }

    // Mock slots
    const morningSlots = ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"]
    const afternoonSlots = ["02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"]
    const eveningSlots = ["06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM"]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Select Date & Time</h3>
                <div className="flex space-x-2">
                    <Button variant="outline" size="icon" onClick={prevDays} disabled={startIndex === 0}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextDays} disabled={startIndex + 4 >= days.length}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Date Strip */}
            <div className="grid grid-cols-4 gap-2">
                {visibleDays.map((date) => (
                    <button
                        key={date.toString()}
                        onClick={() => {
                            setSelectedDate(date)
                            setSelectedSlot(null)
                        }}
                        className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
                            isSameDay(date, selectedDate)
                                ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-2"
                                : "bg-card hover:border-primary/50"
                        )}
                    >
                        <span className="text-xs font-medium uppercase">{format(date, "EEE")}</span>
                        <span className="text-lg font-bold">{format(date, "d")}</span>
                        <span className="text-xs opacity-70">{format(date, "MMM")}</span>
                    </button>
                ))}
            </div>

            {/* Slots */}
            <div className="space-y-4">
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <span>Morning</span>
                        <span className="h-px flex-1 bg-border"></span>
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {morningSlots.map(slot => (
                            <Button
                                key={slot}
                                variant={selectedSlot === slot ? "default" : "outline"}
                                className={cn("text-xs", selectedSlot === slot && "bg-green-600 hover:bg-green-700")}
                                onClick={() => setSelectedSlot(slot)}
                            >
                                {slot}
                            </Button>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <span>Afternoon</span>
                        <span className="h-px flex-1 bg-border"></span>
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {afternoonSlots.map(slot => (
                            <Button
                                key={slot}
                                variant={selectedSlot === slot ? "default" : "outline"}
                                className={cn("text-xs", selectedSlot === slot && "bg-green-600 hover:bg-green-700")}
                                onClick={() => setSelectedSlot(slot)}
                            >
                                {slot}
                            </Button>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <span>Evening</span>
                        <span className="h-px flex-1 bg-border"></span>
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {eveningSlots.map(slot => (
                            <Button
                                key={slot}
                                variant={selectedSlot === slot ? "default" : "outline"}
                                className={cn("text-xs", selectedSlot === slot && "bg-green-600 hover:bg-green-700")}
                                onClick={() => setSelectedSlot(slot)}
                            >
                                {slot}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
