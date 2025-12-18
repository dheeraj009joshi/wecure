"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { UserRole } from "@/types/auth"
import { Loader2, User, Stethoscope, Shield } from "lucide-react"

const roleConfig = {
    patient: {
        icon: User,
        label: "Patient",
        description: "Book appointments and manage your health",
        redirectTo: "/",
    },
    doctor: {
        icon: Stethoscope,
        label: "Doctor",
        description: "Manage appointments and patient records",
        redirectTo: "/doctor/dashboard",
    },
    admin: {
        icon: Shield,
        label: "Admin",
        description: "Manage platform and users",
        redirectTo: "/admin/dashboard",
    },
}

export default function LoginPage() {
    const [selectedRole, setSelectedRole] = useState<UserRole>("patient")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    const { login, isLoading, clearError } = useAuthStore()
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        clearError() // Clear any previous errors

        try {
            await login({ email, password, role: selectedRole })

            // After login, use the actual role returned from backend
            const loggedInUser = useAuthStore.getState().user
            const role = loggedInUser?.role || selectedRole

            if (role === "patient") {
                router.push(roleConfig.patient.redirectTo)
            } else if (role === "doctor") {
                router.push(roleConfig.doctor.redirectTo)
            } else if (role === "admin") {
                router.push(roleConfig.admin.redirectTo)
            } else {
                // Fallback: go home
                router.push("/")
            }
        } catch (err: any) {
            // Use the error message from the auth store if available
            const authError = useAuthStore.getState().error;
            setError(authError || "Invalid credentials. Please try again.")
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 bg-gradient-to-r from-primary-blue to-primary-purple rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xl">W</span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Welcome to WeCure</CardTitle>
                    <CardDescription>Sign in to your account</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Role Selection */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">I am a:</Label>
                        <Tabs value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                {Object.entries(roleConfig).map(([role, config]) => {
                                    const Icon = config.icon
                                    return (
                                        <TabsTrigger key={role} value={role} className="gap-2">
                                            <Icon className="h-4 w-4" />
                                            <span className="hidden sm:inline">{config.label}</span>
                                        </TabsTrigger>
                                    )
                                })}
                            </TabsList>
                        </Tabs>
                        <p className="text-xs text-muted-foreground text-center">
                            {roleConfig[selectedRole].description}
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-primary-blue to-primary-purple hover:opacity-90"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="text-xs text-center text-muted-foreground bg-muted/50 p-3 rounded-lg space-y-1">
                        <p className="font-medium">Demo Credentials:</p>
                        <p>Email: any@email.com | Password: any</p>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-2">
                    <div className="text-sm text-center text-muted-foreground">
                        {selectedRole === "patient" && (
                            <>
                                Don't have an account?{" "}
                                <Link href="/signup" className="text-primary hover:underline font-medium">
                                    Sign up
                                </Link>
                            </>
                        )}
                        {selectedRole === "doctor" && (
                            <>
                                Not registered?{" "}
                                <Link href="/doctor-signup" className="text-primary hover:underline font-medium">
                                    Apply as Doctor
                                </Link>
                            </>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
