import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Stat {
    title: string
    value: string
    change: string
    trend: "up" | "down"
    icon: React.ElementType
    iconColor: string
}

export function StatsCards({ stats }: { stats: Stat[] }) {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
                const Icon = stat.icon
                const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown
                return (
                    <Card key={index} className="overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={cn("p-2 rounded-lg", stat.iconColor)}>
                                    <Icon className="h-5 w-5 text-white" />
                                </div>
                                <div
                                    className={cn(
                                        "flex items-center gap-1 text-xs font-medium",
                                        stat.trend === "up" ? "text-green-600" : "text-red-600"
                                    )}
                                >
                                    <TrendIcon className="h-3 w-3" />
                                    <span>{stat.change}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{stat.title}</p>
                                <p className="text-3xl font-bold mt-1">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
