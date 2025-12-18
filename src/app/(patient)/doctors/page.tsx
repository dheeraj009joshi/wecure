'use client';

import { useMemo, useState, useCallback } from 'react';
import { DoctorCard } from "@/components/doctors/DoctorCard"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { doctorService, Doctor } from '@/services/doctorService';
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useApiCall } from '@/hooks/useApiCall';

export default function DoctorsPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    // Memoize the API function
    const fetchDoctors = useCallback(
        () => doctorService.getAll(),
        []
    );

    // Use the useApiCall hook for proper loading/error handling
    const {
        data: doctorsData,
        loading,
        error,
        execute: refetch,
    } = useApiCall<Doctor[]>(fetchDoctors, {
        immediate: true,
        timeout: 10000,
    });

    // Ensure doctors is always an array
    const doctors = useMemo(() => {
        return Array.isArray(doctorsData) ? doctorsData : [];
    }, [doctorsData]);

    const filteredDoctors = useMemo(() => {
        return doctors.filter(doc =>
            doc.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.specialties?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [doctors, searchTerm]);

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Find a Doctor</h1>
                    <p className="text-muted-foreground">Book appointments with the best doctors</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-muted/50 rounded-xl">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, specialty, or clinic..."
                        className="pl-10 h-11 bg-background"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Select defaultValue="relevance">
                        <SelectTrigger className="w-[180px] h-11 bg-background">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="relevance">Relevance</SelectItem>
                            <SelectItem value="rating">Rating: High to Low</SelectItem>
                            <SelectItem value="experience">Experience: High to Low</SelectItem>
                            <SelectItem value="fee-low">Fee: Low to High</SelectItem>
                            <SelectItem value="fee-high">Fee: High to Low</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">Loading doctors...</span>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className="text-destructive mb-4">{error}</p>
                        <Button onClick={() => refetch()}>Retry</Button>
                    </div>
                ) : filteredDoctors.length > 0 ? (
                    <div className="grid gap-6">
                        {filteredDoctors.map((doctor) => (
                            <DoctorCard key={doctor.id} doctor={doctor} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        No doctors found matching your search.
                    </div>
                )}
            </div>
            </div>
        </div>
    )
}
