'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, Plus, X, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import availabilityService, { DayAvailability, TimeSlot } from '@/services/availabilityService';
import { useToast } from "@/components/ui/use-toast"

const weekDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
const dayLabels: { [key: string]: string } = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday"
}

// Utility function to check if two time ranges overlap
const timeRangesOverlap = (range1: { start: string; end: string }, range2: { start: string; end: string }): boolean => {
    const start1 = range1.start;
    const end1 = range1.end;
    const start2 = range2.start;
    const end2 = range2.end;
    
    return (start1 <= start2 && start2 < end1) || (start2 <= start1 && start1 < end2);
};

// Utility function to merge overlapping time ranges
const mergeTimeRanges = (ranges: { start_time: string; end_time: string }[]): { start_time: string; end_time: string }[] => {
    if (ranges.length === 0) return [];
    
    // Sort by start time
    const sorted = [...ranges].sort((a, b) => a.start_time.localeCompare(b.start_time));
    const merged: { start_time: string; end_time: string }[] = [];
    
    let current = { ...sorted[0] };
    
    for (let i = 1; i < sorted.length; i++) {
        const next = sorted[i];
        
        // If current range overlaps or is adjacent to next range, merge them
        // Overlap: current.start <= next.start < current.end OR next.start <= current.start < next.end
        // Adjacent: current.end === next.start (touching)
        if (current.end_time >= next.start_time) {
            // Merge: extend current range to include next (take the maximum end time)
            current.end_time = current.end_time > next.end_time ? current.end_time : next.end_time;
        } else {
            // No overlap, save current and move to next
            merged.push(current);
            current = { ...next };
        }
    }
    
    merged.push(current);
    return merged;
};

// Utility function to check if a slot already exists
const slotExists = (existingSlots: TimeSlot[], newStart: string, newEnd: string): boolean => {
    return existingSlots.some(slot => 
        slot.start_time === newStart && slot.end_time === newEnd
    );
};

// Utility function to check if a time range overlaps with existing slots
const hasOverlap = (existingSlots: TimeSlot[], newStart: string, newEnd: string): boolean => {
    // Convert existing slots to ranges for comparison
    const existingRanges = existingSlots.map(slot => ({
        start: slot.start_time,
        end: slot.end_time
    }));
    
    const newRange = { start: newStart, end: newEnd };
    
    return existingRanges.some(range => timeRangesOverlap(range, newRange));
};

export default function DoctorAvailability() {
    const [availability, setAvailability] = useState<{ [key: string]: DayAvailability }>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
    const [newSlot, setNewSlot] = useState<{ [key: string]: { start: string, end: string } }>({});
    const { toast } = useToast();

    useEffect(() => {
        fetchAvailability();
    }, []);

    const fetchAvailability = async () => {
        try {
            const data = await availabilityService.getAvailability();
            const availabilityMap: { [key: string]: DayAvailability } = {};

            data.forEach(day => {
                availabilityMap[day.day_of_week] = day;
            });

            // Initialize days that don't have data
            weekDays.forEach(day => {
                if (!availabilityMap[day]) {
                    availabilityMap[day] = {
                        day_of_week: day,
                        is_available: false,
                        slots: []
                    };
                }
            });

            setAvailability(availabilityMap);
        } catch (error) {
            console.error('Failed to fetch availability:', error);
            toast({
                title: "Error",
                description: "Failed to load availability data",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleDay = async (day: string, enabled: boolean) => {
        setSaving(prev => ({ ...prev, [day]: true }));
        try {
            // If disabling, just set availability with empty time ranges
            if (!enabled) {
                await availabilityService.setAvailability(day, false, []);
            } else {
                // If enabling and we have existing slots, convert them to time ranges
                const existingSlots = availability[day]?.slots || [];
                if (existingSlots.length > 0) {
                    // Convert slots to time ranges and merge overlapping ones
                    const timeRanges: { start_time: string; end_time: string }[] = existingSlots.map(slot => ({
                        start_time: slot.start_time,
                        end_time: slot.end_time
                    }));
                    
                    // Merge overlapping ranges
                    const mergedRanges = mergeTimeRanges(timeRanges);

                    await availabilityService.setAvailability(day, true, mergedRanges);
                } else {
                    // No slots, just enable the day
                    await availabilityService.setAvailability(day, true, []);
                }
            }
            
            // Always refresh after any change to ensure state is up to date
            await fetchAvailability();

            toast({
                title: "Success",
                description: `${dayLabels[day]} has been ${enabled ? 'enabled' : 'disabled'}`,
            });
        } catch (error: any) {
            console.error('Failed to update availability:', error);
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to update availability",
                variant: "destructive"
            });
        } finally {
            setSaving(prev => ({ ...prev, [day]: false }));
        }
    };

    const handleAddSlot = async (day: string) => {
        const slot = newSlot[day];
        if (!slot || !slot.start || !slot.end) {
            toast({
                title: "Error",
                description: "Please enter both start and end times",
                variant: "destructive"
            });
            return;
        }

        // Validate time range
        if (slot.start >= slot.end) {
            toast({
                title: "Error",
                description: "End time must be after start time",
                variant: "destructive"
            });
            return;
        }

        const existingSlots = availability[day]?.slots || [];
        
        // Check for exact duplicate slot
        if (slotExists(existingSlots, slot.start, slot.end)) {
            toast({
                title: "Duplicate Slot",
                description: `Time slot ${slot.start} - ${slot.end} already exists for ${dayLabels[day]}`,
                variant: "destructive"
            });
            return;
        }

        // Check if the new slot is completely contained within an existing slot
        const isContained = existingSlots.some(existing => 
            existing.start_time <= slot.start && existing.end_time >= slot.end
        );
        
        if (isContained) {
            toast({
                title: "Slot Already Covered",
                description: `Time slot ${slot.start} - ${slot.end} is already covered by existing slots on ${dayLabels[day]}`,
                variant: "destructive"
            });
            return;
        }

        // Check for overlapping slots - if overlapping, we'll merge them intelligently
        if (hasOverlap(existingSlots, slot.start, slot.end)) {
            // Merge overlapping ranges intelligently
            const allRanges = [
                ...existingSlots.map(s => ({ start_time: s.start_time, end_time: s.end_time })),
                { start_time: slot.start, end_time: slot.end }
            ];
            
            const mergedRanges = mergeTimeRanges(allRanges);
            
            setSaving(prev => ({ ...prev, [day]: true }));
            try {
                await availabilityService.setAvailability(day, true, mergedRanges);
                
                // Always refresh after any change to ensure state is up to date
                await fetchAvailability();

                setNewSlot(prev => ({ ...prev, [day]: { start: '', end: '' } }));

                // Show merged ranges in a user-friendly format
                const mergedDisplay = mergedRanges.map(r => `${r.start_time} - ${r.end_time}`).join(', ');
                toast({
                    title: "Slots Merged Successfully",
                    description: `Time slots merged on ${dayLabels[day]}. New schedule: ${mergedDisplay}`,
                });
            } catch (error: any) {
                console.error('Failed to merge slots:', error);
                toast({
                    title: "Error",
                    description: error.response?.data?.detail || "Failed to merge time slots",
                    variant: "destructive"
                });
            } finally {
                setSaving(prev => ({ ...prev, [day]: false }));
            }
        } else {
            // No overlap, add as new slot
            setSaving(prev => ({ ...prev, [day]: true }));
            try {
                await availabilityService.addSlot(day, slot.start, slot.end);
                
                // Always refresh after any change to ensure state is up to date
                await fetchAvailability();

                setNewSlot(prev => ({ ...prev, [day]: { start: '', end: '' } }));

                toast({
                    title: "Slot Added Successfully",
                    description: `Time slot ${slot.start} - ${slot.end} added to ${dayLabels[day]}`,
                });
            } catch (error: any) {
                console.error('Failed to add slot:', error);
                toast({
                    title: "Error",
                    description: error.response?.data?.detail || "Failed to add time slot",
                    variant: "destructive"
                });
            } finally {
                setSaving(prev => ({ ...prev, [day]: false }));
            }
        }
    };

    const handleRemoveSlot = async (day: string, slotIndex: number) => {
        const slotToRemove = availability[day].slots[slotIndex];
        if (!slotToRemove) {
            toast({
                title: "Error",
                description: "Slot not found",
                variant: "destructive"
            });
            return;
        }

        setSaving(prev => ({ ...prev, [day]: true }));
        try {
            await availabilityService.removeSlot(day, slotToRemove.start_time);
            
            // Always refresh after any change to ensure state is up to date
            await fetchAvailability();

            toast({
                title: "Success",
                description: `Time slot ${slotToRemove.start_time} - ${slotToRemove.end_time} removed from ${dayLabels[day]}`,
            });
        } catch (error: any) {
            console.error('Failed to remove slot:', error);
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to remove time slot",
                variant: "destructive"
            });
        } finally {
            setSaving(prev => ({ ...prev, [day]: false }));
        }
    };

    if (loading) {
        return <div className="p-8">Loading availability...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Availability Management</h1>
                    <p className="text-muted-foreground">Set your working hours and manage your schedule</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={fetchAvailability}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Weekly Schedule */}
            <Card>
                <CardHeader>
                    <CardTitle>Weekly Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {weekDays.map((day) => (
                        <div key={day} className="flex flex-col gap-3 p-4 border rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Switch
                                        checked={availability[day]?.is_available || false}
                                        onCheckedChange={(checked) => handleToggleDay(day, checked)}
                                        disabled={saving[day]}
                                    />
                                    <Label className="font-semibold text-lg">{dayLabels[day]}</Label>
                                    {saving[day] && (
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    )}
                                </div>
                            </div>

                            {availability[day]?.is_available && (
                                <div className="flex flex-col gap-3 mt-2">
                                    {/* Existing Slots Display */}
                                    {availability[day]?.slots && availability[day].slots.length > 0 ? (
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-muted-foreground">
                                                All Time Slots ({availability[day].slots.length} total):
                                            </Label>
                                            <div className="p-3 bg-muted/30 rounded-lg border">
                                                <div className="flex flex-wrap gap-2 max-h-[400px] overflow-y-auto overflow-x-hidden">
                                                    {availability[day].slots.map((slot, index) => (
                                                        <Badge 
                                                            key={`${slot.start_time}-${slot.end_time}-${index}`}
                                                            variant={
                                                                slot.status === 'booked' ? 'default' : 
                                                                slot.status === 'past' ? 'secondary' :
                                                                'outline'
                                                            } 
                                                            className="flex items-center gap-2 px-3 py-1.5 shrink-0"
                                                        >
                                                            <Clock className="h-3 w-3 shrink-0" />
                                                            <span className="font-medium whitespace-nowrap">
                                                {slot.start_time} - {slot.end_time}
                                                            </span>
                                                            {slot.status === 'booked' && (
                                                                <span className="text-xs opacity-75 ml-1 shrink-0">(Booked)</span>
                                                            )}
                                                            {slot.status === 'past' && (
                                                                <span className="text-xs opacity-75 ml-1 shrink-0">(Past)</span>
                                                            )}
                                                            {slot.status !== 'booked' && slot.status !== 'past' && (
                                                <X
                                                                    className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors ml-1 shrink-0"
                                                                    onClick={() => !saving[day] && handleRemoveSlot(day, index)}
                                                />
                                                            )}
                                            </Badge>
                                        ))}
                                    </div>
                                                {availability[day].slots.length > 12 && (
                                                    <p className="text-xs text-muted-foreground mt-2 text-center">
                                                        Scroll to see all {availability[day].slots.length} slots
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground ml-11">No time slots added yet. Add your first time slot below.</p>
                                    )}

                                    {/* Add New Slot */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Add New Time Slot:</Label>
                                    <div className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg">
                                        <Input
                                            type="time"
                                            placeholder="Start"
                                            value={newSlot[day]?.start || ''}
                                            onChange={(e) => setNewSlot(prev => ({
                                                ...prev,
                                                [day]: { ...prev[day], start: e.target.value }
                                            }))}
                                            className="w-32"
                                                disabled={saving[day]}
                                        />
                                            <span className="text-muted-foreground">to</span>
                                        <Input
                                            type="time"
                                            placeholder="End"
                                            value={newSlot[day]?.end || ''}
                                            onChange={(e) => setNewSlot(prev => ({
                                                ...prev,
                                                [day]: { ...prev[day], end: e.target.value }
                                            }))}
                                            className="w-32"
                                                disabled={saving[day]}
                                        />
                                        <Button
                                            size="sm"
                                            onClick={() => handleAddSlot(day)}
                                            className="gap-1"
                                                disabled={saving[day]}
                                            >
                                                {saving[day] ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Adding...
                                                    </>
                                                ) : (
                                                    <>
                                            <Plus className="h-4 w-4" />
                                            Add Slot
                                                    </>
                                                )}
                                        </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground ml-1">
                                            💡 Tip: Overlapping slots will be automatically merged (e.g., 10:00-15:00 + 14:00-19:00 = 10:00-19:00). Duplicate slots will be prevented.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!availability[day]?.is_available && (
                                <p className="text-sm text-muted-foreground ml-11">Not available</p>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold mb-2">Set Break Time</h3>
                        <p className="text-sm text-muted-foreground mb-4">Configure your lunch and break hours</p>
                        <Button variant="outline" size="sm" onClick={() => toast({ description: "To set a break, simply add two separate time slots (e.g., 9-1 and 2-5)." })}>Configure</Button>
                    </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50/50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold mb-2">Block Days</h3>
                        <p className="text-sm text-muted-foreground mb-4">Mark holidays or unavailable dates</p>
                        <Button variant="outline" size="sm" onClick={() => toast({ description: "Holiday management feature coming soon." })}>Manage</Button>
                    </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50/50">
                    <CardContent className="p-6">
                        <h3 className="font-semibold mb-2">Emergency Off</h3>
                        <p className="text-sm text-muted-foreground mb-4">Quick disable for emergencies</p>
                        <Button variant="outline" size="sm" onClick={() => toast({ description: "Emergency off feature coming soon. Please disable days manually for now." })}>Toggle</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
