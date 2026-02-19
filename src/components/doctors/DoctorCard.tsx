import { Star, MapPin, Video, Calendar, Heart, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Doctor } from '@/services/doctorService';

export { type Doctor };

export function DoctorCard({ doctor }: { doctor: Doctor }) {
    return (
        <div className="bg-card rounded-xl border p-6 hover:shadow-lg transition-shadow flex flex-col md:flex-row gap-6">
            {/* Image & Basic Info */}
            <div className="flex gap-4 md:w-1/3">
                <div className="relative">
                    <Avatar className="h-24 w-24 rounded-xl">
                        <AvatarImage src={doctor.avatar_url} className="object-cover" />
                        <AvatarFallback className="rounded-xl text-2xl">{doctor.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-sm">
                        <div className="bg-green-100 p-1 rounded-full">
                            <Video className="h-3 w-3 text-green-700" />
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-lg leading-tight">{doctor.full_name}</h3>
                    <p className="text-primary font-medium text-sm">{doctor.specialties?.[0]}</p>
                    <p className="text-muted-foreground text-xs mt-1">{doctor.experience_years || 0} Years Exp.</p>

                    <div className="flex items-center gap-1 mt-2">
                        <div className="flex bg-yellow-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-yellow-700 items-center">
                            <Star className="h-3 w-3 fill-yellow-700 mr-0.5" />
                            {doctor.average_rating?.toFixed(1) || 'New'}
                        </div>
                        <span className="text-[10px] text-muted-foreground">({doctor.total_reviews || 0} reviews)</span>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="flex-1 grid grid-cols-2 gap-4 text-sm border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                <div>
                    <p className="text-muted-foreground text-xs mb-1">Location</p>
                    <div className="flex items-start gap-1">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                        <span className="font-medium">Online & Clinic</span>
                    </div>
                </div>
                <div>
                    <p className="text-muted-foreground text-xs mb-1">Next Available</p>
                    <div className="flex items-start gap-1">
                        <Calendar className="h-3.5 w-3.5 text-green-600 mt-0.5" />
                        <span className="font-medium text-green-600">Today, 2:00 PM</span>
                    </div>
                </div>
                <div>
                    <p className="text-muted-foreground text-xs mb-1">Clinic</p>
                    <p className="font-medium">Sahayak Health</p>
                </div>
                <div>
                    <p className="text-muted-foreground text-xs mb-1">Consultation Fee</p>
                    <p className="font-bold text-primary">₹{doctor.video_consultation_fee || 500}</p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 justify-center md:w-48 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                <Link href={`/doctors/${doctor.id}`} className="w-full">
                    <Button variant="outline" className="w-full">View Profile</Button>
                </Link>
                <Link href={`/book/${doctor.id}`} className="w-full">
                    <Button className="w-full bg-gradient-to-r from-primary-blue to-primary-purple text-white shadow-md hover:opacity-90">Book Now</Button>
                </Link>
            </div>
        </div>
    )
}
