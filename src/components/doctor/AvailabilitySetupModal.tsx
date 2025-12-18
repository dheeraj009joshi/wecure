"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import availabilityService, { DayAvailability } from '@/services/availabilityService';
import { Loader2 } from "lucide-react"

interface AvailabilitySetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const weekDays = ["monday", "tuesday", "wednesday", "thursday", "friday"]

export function AvailabilitySetupModal({ isOpen, onClose, onSuccess }: AvailabilitySetupModalProps) {
    const [startTime, setStartTime] = useState("09:00")
    const [endTime, setEndTime] = useState("17:00")
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const handleSave = async () => {
        if (!startTime || !endTime) {
            toast({
                title: "Error",
                description: "Please select both start and end times",
                variant: "destructive"
            })
            return
        }

        setLoading(true)
        try {
            // Create availability for Mon-Fri
            const promises = weekDays.map(day => {
                const availability: DayAvailability = {
                    day_of_week: day,
                    is_available: true,
                    slots: [{ start_time: startTime, end_time: endTime }]
                }
                return availabilityService.updateAvailability(availability)
            })

            await Promise.all(promises)

            toast({
                title: "Success",
                description: "Availability schedule created successfully!",
            })
            onSuccess()
            onClose()
        } catch (error) {
            console.error('Failed to save availability:', error)
            toast({
                title: "Error",
                description: "Failed to save availability. Please try again.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Setup Your Availability</DialogTitle>
                    <DialogDescription>
                        Welcome! Let's set up your weekly schedule. You can customize this later in the Availability tab.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-4">
                        <h4 className="font-medium text-sm text-muted-foreground">Default Schedule (Mon-Fri)</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startTime">Start Time</Label>
                                <Input
                                    id="startTime"
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endTime">End Time</Label>
                                <Input
                                    id="endTime"
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Skip for now
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-gradient-to-r from-primary-blue to-primary-purple">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Schedule"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
