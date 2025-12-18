"use client"

import { Search, MapPin, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export function Hero() {
    const [date, setDate] = useState<Date>()

    return (
        <section className="relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-20 md:py-32">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Book Your Doctor Appointment <br />
                        <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary-blue to-primary-purple">in Minutes</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Connect with top specialists, book appointments instantly, and manage your health journey with ease.
                    </p>

                    {/* Search Box */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 items-center max-w-3xl mx-auto border border-gray-100 dark:border-gray-700">
                        <div className="flex-1 w-full relative">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input placeholder="Search doctors, clinics..." className="pl-10 border-0 shadow-none focus-visible:ring-0 bg-transparent" />
                        </div>
                        <div className="h-8 w-px bg-gray-200 hidden md:block" />
                        <div className="flex-1 w-full relative">
                            <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input placeholder="Location" className="pl-10 border-0 shadow-none focus-visible:ring-0 bg-transparent" />
                        </div>
                        <div className="h-8 w-px bg-gray-200 hidden md:block" />
                        <div className="w-full md:w-auto">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"ghost"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal hover:bg-transparent",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Button size="lg" className="w-full md:w-auto rounded-xl bg-gradient-to-r from-primary-blue to-primary-purple hover:opacity-90 transition-opacity text-white font-semibold">
                            Search
                        </Button>
                    </div>

                    {/* Trust Indicators */}
                    <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-muted-foreground pt-8">
                        <div className="flex items-center gap-2">
                            <span className="text-primary font-bold text-lg">10,000+</span> Doctors
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-primary font-bold text-lg">50,000+</span> Happy Patients
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-primary font-bold text-lg">4.8★</span> Average Rating
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
