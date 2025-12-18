"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, TrendingUp, Download } from "lucide-react"

const revenueStats = [
    { title: "Total Revenue", value: "₹12.5M", change: "+23%" },
    { title: "This Month", value: "₹2.1M", change: "+18%" },
    { title: "Platform Fee", value: "₹1.8M", change: "+20%" },
    { title: "Pending Payouts", value: "₹450K", change: "-5%" },
]

const transactions = [
    { id: "TXN001", doctor: "Dr. Sarah Johnson", amount: "₹2,500", fee: "₹375", date: "Dec 1, 2025", status: "completed" },
    { id: "TXN002", doctor: "Dr. Kumar Patel", amount: "₹1,800", fee: "₹270", date: "Dec 1, 2025", status: "completed" },
    { id: "TXN003", doctor: "Dr. Arun Singh", amount: "₹3,200", fee: "₹480", date: "Nov 30, 2025", status: "pending" },
]

export default function AdminRevenue() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Revenue Management</h1>
                    <p className="text-muted-foreground">Track platform revenue and payouts</p>
                </div>
                <Button className="bg-gradient-to-r from-orange-500 to-red-500">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-6 md:grid-cols-4">
                {revenueStats.map((stat, index) => (
                    <Card key={index}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <DollarSign className="h-8 w-8 text-green-600" />
                                <Badge variant="outline" className="text-green-600">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    {stat.change}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{stat.title}</p>
                            <p className="text-3xl font-bold mt-1">{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {transactions.map((txn) => (
                            <div key={txn.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-semibold">{txn.doctor}</p>
                                        <p className="font-bold text-lg">{txn.amount}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span>ID: {txn.id}</span>
                                        <span>Fee: {txn.fee}</span>
                                        <span>{txn.date}</span>
                                    </div>
                                </div>
                                <Badge
                                    className={
                                        txn.status === "completed"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-yellow-100 text-yellow-700"
                                    }
                                >
                                    {txn.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Revenue Chart Placeholder */}
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
        </div>
    )
}
