"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2 } from "lucide-react"

const specialties = [
    { id: 1, name: "Cardiology", doctors: 42, icon: "❤️" },
    { id: 2, name: "Dermatology", doctors: 38, icon: "🧴" },
    { id: 3, name: "Neurology", doctors: 28, icon: "🧠" },
    { id: 4, name: "Pediatrics", doctors: 52, icon: "👶" },
]

export default function AdminContent() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Content Management</h1>
                <p className="text-muted-foreground">Manage specialties, settings, and platform content</p>
            </div>

            {/* Specialties */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Specialties</CardTitle>
                    <Button className="bg-gradient-to-r from-orange-500 to-red-500">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Specialty
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {specialties.map((specialty) => (
                            <Card key={specialty.id} className="border-2">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-3xl">{specialty.icon}</span>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="font-semibold">{specialty.name}</p>
                                    <p className="text-sm text-muted-foreground">{specialty.doctors} doctors</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Platform Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Platform Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="platform-fee">Platform Fee (%)</Label>
                            <Input id="platform-fee" type="number" defaultValue="15" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="min-consultation">Minimum Consultation Fee (₹)</Label>
                            <Input id="min-consultation" type="number" defaultValue="500" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="maintenance">Maintenance Message</Label>
                        <Textarea
                            id="maintenance"
                            rows={3}
                            placeholder="Message to display during maintenance..."
                        />
                    </div>

                    <Button className="bg-gradient-to-r from-orange-500 to-red-500">
                        Save Settings
                    </Button>
                </CardContent>
            </Card>

            {/* FAQ Management */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>FAQs</CardTitle>
                    <Button variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add FAQ
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No FAQs added yet</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
