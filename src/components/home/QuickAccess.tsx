import { UserSearch, Video, FlaskConical, Ambulance } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const items = [
    { icon: UserSearch, label: "Find a Specialist", color: "text-blue-500", bg: "bg-blue-50" },
    { icon: Video, label: "Video Consultation", color: "text-purple-500", bg: "bg-purple-50" },
    { icon: FlaskConical, label: "Book Lab Tests", color: "text-green-500", bg: "bg-green-50" },
    { icon: Ambulance, label: "Emergency Care", color: "text-red-500", bg: "bg-red-50" },
]

export function QuickAccess() {
    return (
        <section className="py-12 container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {items.map((item, index) => (
                    <Card key={index} className="hover:shadow-lg transition-all cursor-pointer border-none shadow-sm group">
                        <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-4">
                            <div className={`p-4 rounded-full ${item.bg} group-hover:scale-110 transition-transform`}>
                                <item.icon className={`h-8 w-8 ${item.color}`} />
                            </div>
                            <h3 className="font-semibold">{item.label}</h3>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    )
}
