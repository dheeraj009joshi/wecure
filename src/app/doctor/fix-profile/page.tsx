"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export default function FixProfilePage() {
    const [result, setResult] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const fixDoctorProfile = async () => {
        setLoading(true)
        try {
            const response = await api.post('/utils/fix-doctor-profile')
            setResult(response.data)
            toast({
                title: "Success",
                description: response.data.message,
            })
        } catch (error: any) {
            console.error(error)
            setResult({ error: error.response?.data || error.message })
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to create profile",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-4xl p-8">
            <h1 className="text-3xl font-bold">Fix Doctor Profile</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Create Missing Doctor Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        If you're seeing "Doctor profile not found" errors, click this button to create your doctor profile automatically.
                    </p>

                    <Button onClick={fixDoctorProfile} disabled={loading} size="lg">
                        {loading ? "Creating Profile..." : "Create Doctor Profile"}
                    </Button>

                    {result && (
                        <div className="mt-4">
                            <strong>Result:</strong>
                            <pre className="bg-muted p-4 mt-2 rounded text-sm overflow-auto">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
