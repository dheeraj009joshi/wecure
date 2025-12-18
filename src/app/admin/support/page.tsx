"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, AlertCircle, Star } from "lucide-react"

const tickets = [
    { id: "TICK-001", user: "John Doe", subject: "Payment issue", priority: "high", status: "open", date: "Dec 1, 2025" },
    { id: "TICK-002", user: "Sarah W.", subject: "Cannot book appointment", priority: "medium", status: "in-progress", date: "Dec 1, 2025" },
]

const reports = [
    { id: "REP-001", reporter: "Patient123", reported: "Dr. XYZ", reason: "Inappropriate behavior", date: "Nov 30, 2025", status: "pending" },
]

const reviews = [
    { id: "REV-001", patient: "John Doe", doctor: "Dr. Sarah Johnson", rating: 1, comment: "Very rude", date: "Dec 1, 2025", flagged: true },
]

export default function AdminSupport() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Support & Moderation</h1>
                <p className="text-muted-foreground">Handle support tickets, reports, and review moderation</p>
            </div>

            <Tabs defaultValue="tickets">
                <TabsList>
                    <TabsTrigger value="tickets">Support Tickets ({tickets.length})</TabsTrigger>
                    <TabsTrigger value="reports">Reports ({reports.length})</TabsTrigger>
                    <TabsTrigger value="reviews">Flagged Reviews ({reviews.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="tickets" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Open Tickets</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {tickets.map((ticket) => (
                                <div key={ticket.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                    <MessageSquare className="h-10 w-10 text-primary" />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-semibold">{ticket.subject}</p>
                                            <Badge className={ticket.priority === "high" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}>
                                                {ticket.priority}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>{ticket.id}</span>
                                            <span>{ticket.user}</span>
                                            <span>{ticket.date}</span>
                                        </div>
                                    </div>
                                    <Button>View & Respond</Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reports" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Reports</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {reports.map((report) => (
                                <div key={report.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                    <AlertCircle className="h-10 w-10 text-destructive" />
                                    <div className="flex-1">
                                        <p className="font-semibold">{report.reason}</p>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                            <span>{report.id}</span>
                                            <span>Reporter: {report.reporter}</span>
                                            <span>Reported: {report.reported}</span>
                                            <span>{report.date}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="destructive">Take Action</Button>
                                        <Button variant="outline">Investigate</Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reviews" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Flagged Reviews</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {reviews.map((review) => (
                                <div key={review.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                    <Star className="h-10 w-10 text-yellow-500" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold">{review.patient} → {review.doctor}</span>
                                            <div className="flex">
                                                {[...Array(review.rating)].map((_, i) => (
                                                    <span key={i} className="text-yellow-400">★</span>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-sm mb-2">&quot;{review.comment}&quot;</p>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>{review.date}</span>
                                            <Badge className="bg-red-100 text-red-700">Flagged</Badge>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="destructive">Remove</Button>
                                        <Button variant="outline">Allow</Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
