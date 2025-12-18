"use client"

import { useAuthStore } from "@/store/authStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DebugPage() {
    const { user, token, isAuthenticated } = useAuthStore()

    const checkLocalStorage = () => {
        const stored = localStorage.getItem('auth-storage')
        console.log('LocalStorage auth-storage:', stored)
        if (stored) {
            console.log('Parsed:', JSON.parse(stored))
        }
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <h1 className="text-3xl font-bold">Auth Debug Info</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Auth State</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}
                    </div>
                    <div>
                        <strong>User:</strong>
                        <pre className="bg-muted p-4 mt-2 rounded text-sm overflow-auto">
                            {JSON.stringify(user, null, 2)}
                        </pre>
                    </div>
                    <div>
                        <strong>Token:</strong>
                        <pre className="bg-muted p-4 mt-2 rounded text-sm overflow-auto break-all">
                            {token || 'No token stored'}
                        </pre>
                    </div>
                    <Button onClick={checkLocalStorage}>
                        Check LocalStorage (See Console)
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
