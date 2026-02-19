"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Bell, Menu, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/store/authStore"

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 mx-auto">
        {/* Logo */}
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block text-2xl bg-gradient-to-r from-primary-blue to-primary-purple bg-clip-text text-transparent">Sahayak</span>
          </Link>
          {/* Main Nav */}
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/" className="transition-colors hover:text-primary text-foreground/80">Home</Link>
            <Link href="/doctors" className="transition-colors hover:text-primary text-foreground/60">Find Doctors</Link>
            {isAuthenticated && (
              <>
                <Link href="/patient/appointments" className="transition-colors hover:text-primary text-foreground/60">My Appointments</Link>
                <Link href="/patient/history" className="transition-colors hover:text-primary text-foreground/60">Medical History</Link>
              </>
            )}
          </nav>
        </div>

        {/* Mobile Menu Trigger */}
        <Button variant="ghost" className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>

        {/* Search Bar */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search doctors, specialties..." className="pl-8 w-full md:w-[300px] lg:w-[400px] rounded-full bg-muted/50" />
            </div>
          </div>

          {/* Right Actions */}
          <nav className="flex items-center space-x-2">
            {/* Emergency Button */}
            <Button variant="destructive" size="sm" className="hidden md:flex gap-2 rounded-full shadow-md hover:shadow-lg transition-all">
              <Phone className="h-4 w-4" />
              <span>Emergency</span>
            </Button>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute top-1 right-1 h-2 w-2 p-0 flex items-center justify-center bg-red-500 rounded-full animate-pulse"></Badge>
                </Button>

                {/* Profile */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full border border-border">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.avatar} alt={user?.full_name || user?.email} />
                        <AvatarFallback>{user?.full_name?.[0] || user?.email?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.full_name || user?.email || "User"}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/patient/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/patient/appointments">My Appointments</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/login">
                <Button className="bg-gradient-to-r from-primary-blue to-primary-purple">
                  Sign In
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
