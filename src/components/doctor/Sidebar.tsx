"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Calendar,
    Clock,
    Users,
    User,
    BarChart3,
    Star,
    LogOut,
    Menu,
    UserCircle,
    TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthStore } from "@/store/authStore"
import { useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const navigation = [
    { name: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
    { name: "Appointments", href: "/doctor/appointments", icon: Calendar },
    { name: "Availability", href: "/doctor/availability", icon: Clock },
    { name: "Patients", href: "/doctor/patients", icon: Users },
    { name: "Profile", href: "/doctor/profile", icon: UserCircle },
    { name: "Analytics", href: "/doctor/analytics", icon: TrendingUp },
    { name: "Reviews", href: "/doctor/reviews", icon: Star },
]

export function DoctorSidebar() {
    const pathname = usePathname()
    const { user, logout } = useAuthStore()
    const router = useRouter()

    const handleLogout = () => {
        logout()
        router.push("/login")
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b">
                <Link href="/doctor/dashboard" className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-gradient-to-r from-primary-blue to-primary-purple rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">W</span>
                    </div>
                    <span className="font-bold text-xl bg-gradient-to-r from-primary-blue to-primary-purple bg-clip-text text-transparent">
                        WeCure
                    </span>
                </Link>
                <p className="text-xs text-muted-foreground mt-2">Doctor Portal</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {navigation.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                isActive
                                    ? "bg-gradient-to-r from-primary-blue to-primary-purple text-white shadow-md"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span>{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback>{user?.name?.[0] || "D"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user?.name || "Doctor"}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    )

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r bg-background">
                <SidebarContent />
            </div>

            {/* Mobile Sidebar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b bg-background p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-gradient-to-r from-primary-blue to-primary-purple rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">W</span>
                    </div>
                    <span className="font-bold text-lg bg-gradient-to-r from-primary-blue to-primary-purple bg-clip-text text-transparent">
                        WeCure
                    </span>
                </div>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0">
                        <SidebarContent />
                    </SheetContent>
                </Sheet>
            </div>
        </>
    )
}
