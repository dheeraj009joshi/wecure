import { Heart, Brain, Bone, Stethoscope, Baby, Eye, Activity, Smile } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const specialties = [
    { icon: Heart, name: "Cardiology", count: "120+ Doctors" },
    { icon: Brain, name: "Neurology", count: "80+ Doctors" },
    { icon: Bone, name: "Orthopedics", count: "150+ Doctors" },
    { icon: Stethoscope, name: "General Medicine", count: "300+ Doctors" },
    { icon: Baby, name: "Pediatrics", count: "100+ Doctors" },
    { icon: Eye, name: "Ophthalmology", count: "90+ Doctors" },
    { icon: Activity, name: "Gynecology", count: "110+ Doctors" },
    { icon: Smile, name: "Dentistry", count: "200+ Doctors" },
]

export function Specialties() {
    return (
        <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Top Specialties</h2>
                        <p className="text-muted-foreground">Consult with experts across various fields</p>
                    </div>
                    <button className="text-primary font-medium hover:underline">View All</button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {specialties.map((spec, index) => (
                        <Card key={index} className="hover:border-primary/50 transition-colors cursor-pointer group">
                            <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                                <spec.icon className="h-10 w-10 text-primary mb-2 group-hover:scale-110 transition-transform" />
                                <h3 className="font-semibold text-lg">{spec.name}</h3>
                                <p className="text-sm text-muted-foreground">{spec.count}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}
