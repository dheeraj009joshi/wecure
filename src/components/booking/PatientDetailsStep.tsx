"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload } from "lucide-react"
import { useBookingStore } from "@/store/bookingStore"
import { useState } from "react"

export function PatientDetailsStep() {
    const { patientName, patientAge, patientGender, relationship, symptoms, setPatientDetails } = useBookingStore()

    const [formData, setFormData] = useState({
        name: patientName,
        age: patientAge,
        gender: patientGender,
        relationship: relationship,
        symptoms: symptoms,
    })

    const handleChange = (field: string, value: string) => {
        const updated = { ...formData, [field]: value }
        setFormData(updated)
        setPatientDetails(updated)
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Patient Details</h2>
                <p className="text-muted-foreground">Tell us about the patient</p>
            </div>

            <div className="bg-card border rounded-xl p-6 space-y-6">
                {/* Booking For */}
                <div className="space-y-3">
                    <Label>Who is this appointment for?</Label>
                    <RadioGroup
                        value={formData.relationship}
                        onValueChange={(value) => handleChange('relationship', value)}
                        className="flex gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="self" id="self" />
                            <Label htmlFor="self" className="font-normal cursor-pointer">Myself</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="other" id="other" />
                            <Label htmlFor="other" className="font-normal cursor-pointer">Someone Else</Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Patient Name */}
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                        id="name"
                        placeholder="Enter full name"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                    />
                </div>

                {/* Age & Gender */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="age">Age *</Label>
                        <Input
                            id="age"
                            type="number"
                            placeholder="Enter age"
                            value={formData.age}
                            onChange={(e) => handleChange('age', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="gender">Gender *</Label>
                        <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                            <SelectTrigger id="gender">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Symptoms */}
                <div className="space-y-2">
                    <Label htmlFor="symptoms">Primary Concern / Symptoms *</Label>
                    <Textarea
                        id="symptoms"
                        placeholder="Describe your symptoms or reason for consultation..."
                        rows={4}
                        value={formData.symptoms}
                        onChange={(e) => handleChange('symptoms', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">This will help the doctor prepare for your consultation</p>
                </div>

                {/* Upload Reports */}
                <div className="space-y-2">
                    <Label>Upload Medical Reports (Optional)</Label>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm font-medium">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 10MB</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
