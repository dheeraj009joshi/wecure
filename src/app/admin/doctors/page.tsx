'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Filter, MoreVertical, CheckCircle, XCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { doctorService, Doctor } from '@/services/doctorService';
import { adminService } from '@/services/adminService';
import { useToast } from "@/components/ui/use-toast"
import Link from 'next/link';

export default function AdminDoctors() {
    const { toast } = useToast();
    const [activeDoctors, setActiveDoctors] = useState<Doctor[]>([]);
    const [pendingDoctors, setPendingDoctors] = useState<Doctor[]>([]);
    const [suspendedDoctors, setSuspendedDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("active");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [active, pending, suspended] = await Promise.all([
                adminService.getAllDoctors("active", searchQuery || undefined),
                adminService.getPendingDoctors(),
                adminService.getAllDoctors("suspended", searchQuery || undefined)
            ]);
            setActiveDoctors(active);
            setPendingDoctors(pending);
            setSuspendedDoctors(suspended);
        } catch (error: any) {
            console.error('Failed to fetch doctors:', error);
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to load doctors",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]); // Refetch when search changes

    const handleApprove = async (doctorId: string) => {
        try {
            await adminService.verifyDoctor(doctorId);
            toast({
                title: "Success",
                description: "Doctor verified and activated successfully",
            });
            fetchData(); // Refresh lists
        } catch (error: any) {
            console.error('Failed to verify doctor:', error);
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to verify doctor",
                variant: "destructive",
            });
        }
    };

    const handleSuspend = async (doctorId: string) => {
        try {
            await adminService.suspendDoctor(doctorId);
            toast({
                title: "Success",
                description: "Doctor suspended successfully",
            });
            fetchData(); // Refresh lists
        } catch (error: any) {
            console.error('Failed to suspend doctor:', error);
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to suspend doctor",
                variant: "destructive",
            });
        }
    };

    const handleReject = async (doctorId: string) => {
        // Rejecting a pending doctor means suspending them
        try {
            await adminService.suspendDoctor(doctorId);
            toast({
                title: "Success",
                description: "Doctor application rejected",
            });
            fetchData(); // Refresh lists
        } catch (error: any) {
            console.error('Failed to reject doctor:', error);
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to reject doctor",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading doctors...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Doctor Management</h1>
                <p className="text-muted-foreground">Manage and verify doctors on the platform</p>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search doctors..." 
                        className="pl-9" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="active">Active ({activeDoctors.length})</TabsTrigger>
                    <TabsTrigger value="pending">Pending ({pendingDoctors.length})</TabsTrigger>
                    <TabsTrigger value="suspended">Suspended ({suspendedDoctors.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-6 space-y-4">
                    {activeDoctors.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No active doctors found.</p>
                    ) : (
                        activeDoctors.map((doctor) => (
                            <Card key={doctor.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-16 w-16">
                                            <AvatarImage src={doctor.avatar_url} />
                                            <AvatarFallback>{doctor.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-lg">{doctor.full_name}</h3>
                                                    <p className="text-sm text-muted-foreground">{doctor.specialties?.[0]}</p>
                                                </div>
                                                <Badge className="bg-green-100 text-green-700">Active</Badge>
                                            </div>

                                            <div className="flex items-center gap-6 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">Rating: </span>
                                                    <span className="font-semibold">{doctor.average_rating?.toFixed(1) || 'New'} ⭐</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Reviews: </span>
                                                    <span className="font-semibold">{doctor.total_reviews || 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Link href={`/admin/doctors/${doctor.id}`}>
                                            <Button variant="outline">View Profile</Button>
                                            </Link>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem 
                                                        className="text-destructive"
                                                        onClick={() => handleSuspend(doctor.id)}
                                                    >
                                                        Suspend Doctor
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )))}
                </TabsContent>

                <TabsContent value="pending" className="mt-6 space-y-4">
                    {pendingDoctors.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No pending doctor approvals.</p>
                    ) : (
                        pendingDoctors.map((doctor) => (
                            <Card key={doctor.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-16 w-16">
                                            <AvatarFallback>{doctor.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg">{doctor.full_name}</h3>
                                            <p className="text-sm text-muted-foreground">{doctor.specialties?.[0]}</p>
                                            <p className="text-xs text-muted-foreground mt-1">ID: {doctor.id}</p>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => handleApprove(doctor.id)}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Approve
                                            </Button>
                                            <Button 
                                                variant="destructive"
                                                onClick={() => handleReject(doctor.id)}
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )))}
                </TabsContent>

                <TabsContent value="suspended" className="mt-6 space-y-4">
                    {suspendedDoctors.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No suspended doctors</p>
                    </div>
                    ) : (
                        suspendedDoctors.map((doctor) => (
                            <Card key={doctor.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-16 w-16">
                                            <AvatarImage src={doctor.avatar_url} />
                                            <AvatarFallback>{doctor.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-lg">{doctor.full_name}</h3>
                                                    <p className="text-sm text-muted-foreground">{doctor.specialties?.[0]}</p>
                                                </div>
                                                <Badge className="bg-red-100 text-red-700">Suspended</Badge>
                                            </div>

                                            <div className="flex items-center gap-6 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">Rating: </span>
                                                    <span className="font-semibold">{doctor.average_rating?.toFixed(1) || 'N/A'} ⭐</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Reviews: </span>
                                                    <span className="font-semibold">{doctor.total_reviews || 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Link href={`/admin/doctors/${doctor.id}`}>
                                                <Button variant="outline">View Profile</Button>
                                            </Link>
                                            <Button 
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => handleApprove(doctor.id)}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Reactivate
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
