'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, UserCog, Calendar, DollarSign, TrendingUp, AlertCircle } from "lucide-react"
import { adminService, AdminStats } from '@/services/adminService';
import { Doctor } from '@/services/doctorService';
import { useToast } from "@/components/ui/use-toast"
import Link from 'next/link';

export default function AdminDashboard() {
    const { toast } = useToast();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [pendingDoctors, setPendingDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, doctorsData] = await Promise.all([
                    adminService.getStats(),
                    adminService.getPendingDoctors()
                ]);
                setStats(statsData);
                setPendingDoctors(doctorsData);
        } catch (error: any) {
            console.error('Failed to fetch admin data:', error);
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to load dashboard data",
                variant: "destructive",
            });
        } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps


    const handleApprove = async (doctorId: string) => {
        try {
            await adminService.verifyDoctor(doctorId);
            toast({
                title: "Success",
                description: "Doctor verified successfully",
            });
            // Refresh list
            const updatedDoctors = await adminService.getPendingDoctors();
            setPendingDoctors(updatedDoctors);
            // Refresh stats
            const updatedStats = await adminService.getStats();
            setStats(updatedStats);
        } catch (error: any) {
            console.error('Failed to verify doctor:', error);
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to verify doctor",
                variant: "destructive",
            });
        }
    };

    const statCards = [
        {
            title: "Total Patients",
            value: stats?.total_patients || 0,
            icon: Users,
            color: "bg-blue-500",
        },
        {
            title: "Total Doctors",
            value: stats?.total_doctors || 0,
            icon: UserCog,
            color: "bg-green-500",
        },
        {
            title: "Total Appointments",
            value: stats?.total_appointments || 0,
            icon: Calendar,
            color: "bg-purple-500",
        },
        {
            title: "Pending Approvals",
            value: stats?.pending_doctors || 0,
            icon: AlertCircle,
            color: "bg-orange-500",
        },
    ];

    if (loading) {
        return <div className="p-8 text-center">Loading admin dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Platform overview and management</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                        <Card key={index}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-2 rounded-lg ${stat.color}`}>
                                        <Icon className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">{stat.title}</p>
                                <p className="text-3xl font-bold mt-1">{stat.value}</p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Pending Approvals */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Pending Doctor Approvals</CardTitle>
                        <Badge variant="secondary">{pendingDoctors.length} Pending</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {pendingDoctors.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">No pending approvals.</p>
                        ) : (
                            pendingDoctors.map((doctor) => (
                                <div key={doctor.id} className="space-y-3 pb-4 border-b last:border-0">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={doctor.avatar_url} />
                                            <AvatarFallback>{doctor.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm">{doctor.full_name}</p>
                                            <p className="text-xs text-muted-foreground">{doctor.specialties?.[0] || 'General'}</p>
                                            <p className="text-xs text-muted-foreground">ID: {doctor.id}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                            onClick={() => handleApprove(doctor.id)}
                                        >
                                            Approve
                                        </Button>
                                        <Link href={`/admin/doctors/${doctor.id}`} className="flex-1">
                                            <Button size="sm" variant="outline" className="w-full">
                                                Review Profile
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            )))}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4">
                            <Link href="/admin/doctors">
                                <Button variant="outline" className="w-full h-auto py-4 justify-start gap-4">
                                    <UserCog className="h-5 w-5" />
                                    <div className="text-left">
                                        <div className="font-semibold">Manage Doctors</div>
                                        <div className="text-xs text-muted-foreground">View and verify doctors</div>
                                    </div>
                                </Button>
                            </Link>
                            <Link href="/admin/patients">
                                <Button variant="outline" className="w-full h-auto py-4 justify-start gap-4">
                                    <Users className="h-5 w-5" />
                                    <div className="text-left">
                                        <div className="font-semibold">Manage Patients</div>
                                        <div className="text-xs text-muted-foreground">View registered patients</div>
                                    </div>
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
