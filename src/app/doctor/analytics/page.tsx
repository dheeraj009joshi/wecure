"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, TrendingUp, Users, Calendar } from "lucide-react"
import { analyticsService } from "@/services/analyticsService"
import { useToast } from "@/components/ui/use-toast"

export default function DoctorAnalytics() {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const data = await analyticsService.getDoctorAnalytics();
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            toast({
                title: "Error",
                description: "Failed to load analytics data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8">Loading analytics...</div>;
    }

    if (!analytics) {
        return <div className="p-8">No analytics data available</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Analytics & Revenue</h1>
                <p className="text-muted-foreground">Track your performance and earnings</p>
            </div>

            {/* Revenue Overview */}
            <div className="grid gap-6 md:grid-cols-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 rounded-lg bg-green-500">
                                <DollarSign className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">This Month</p>
                        <p className="text-3xl font-bold mt-1">₹{analytics.revenue?.this_month?.toLocaleString() || 0}</p>
                        <p className="text-xs text-green-600 mt-2">
                            Total: ₹{analytics.revenue?.total?.toLocaleString() || 0}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 rounded-lg bg-blue-500">
                                <Calendar className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Total Consultations</p>
                        <p className="text-3xl font-bold mt-1">{analytics.appointments?.total || 0}</p>
                        <p className="text-xs text-blue-600 mt-2">
                            Completed: {analytics.appointments?.completed || 0}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 rounded-lg bg-purple-500">
                                <Users className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Total Patients</p>
                        <p className="text-3xl font-bold mt-1">{analytics.patients?.total || 0}</p>
                        <p className="text-xs text-purple-600 mt-2">
                            New this month: {analytics.patients?.new_this_month || 0}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 rounded-lg bg-orange-500">
                                <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Avg. Rating</p>
                        <p className="text-3xl font-bold mt-1">{analytics.rating?.toFixed(1) || '0.0'}</p>
                        <p className="text-xs text-orange-600 mt-2">Based on reviews</p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Analytics */}
            <Tabs defaultValue="revenue">
                <TabsList>
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                    <TabsTrigger value="appointments">Appointments</TabsTrigger>
                    <TabsTrigger value="patients">Patients</TabsTrigger>
                </TabsList>

                <TabsContent value="revenue" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue Trends</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-center justify-center text-muted-foreground">
                                <p>Revenue chart would be displayed here</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="appointments">
                    <Card>
                        <CardHeader>
                            <CardTitle>Appointment Statistics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-center justify-center text-muted-foreground">
                                <p>Appointment statistics would be displayed here</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="patients">
                    <Card>
                        <CardHeader>
                            <CardTitle>Patient Demographics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-center justify-center text-muted-foreground">
                                <p>Patient demographics would be displayed here</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
