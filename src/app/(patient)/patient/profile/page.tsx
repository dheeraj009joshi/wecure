'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { patientService, Patient } from '@/services/patientService';
import { appointmentService } from '@/services/appointmentService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Loader2, Save, AlertCircle, Upload, Camera } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PatientProfile() {
    const { user } = useAuthStore();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Patient>>({});
    const { toast } = useToast();
    const hasFetchedRef = useRef(false);
    const fetchingRef = useRef(false);

    useEffect(() => {
        if (!user || hasFetchedRef.current || fetchingRef.current) {
            if (!user) {
                setLoading(false);
            }
            return;
        }

        let isMounted = true;
        hasFetchedRef.current = true;
        fetchingRef.current = true;
        let timeoutId: NodeJS.Timeout | null = null;

        // Safety timeout - always clear loading after 15 seconds
        timeoutId = setTimeout(() => {
            if (isMounted) {
                console.warn('[Profile] API timeout - clearing loading state');
                setLoading(false);
                setPatient(null);
                setStats({ total: 0, upcoming: 0, completed: 0 });
                toast({
                    title: "Timeout",
                    description: "Request took too long. Please try again.",
                    variant: "destructive",
                });
            }
        }, 15000);

        const fetchProfile = async () => {
            try {
                setLoading(true);
                const [patientData, appointments] = await Promise.all([
                    patientService.getProfile(),
                    appointmentService.getPatientAppointments()
                ]);
                
                // Clear timeout on success
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                
                if (!isMounted) return;
                
                setPatient(patientData);
                setFormData(patientData);
                
                const appointmentsData = Array.isArray(appointments) ? appointments : [];
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const upcoming = appointmentsData.filter((apt: any) => {
                    const aptDate = new Date(apt.appointment_date);
                    aptDate.setHours(0, 0, 0, 0);
                    return aptDate >= today && apt.status !== 'cancelled' && apt.status !== 'completed';
                });
                const completed = appointmentsData.filter((apt: any) => apt.status === 'completed');
                
                if (isMounted) {
                    setStats({
                        total: appointmentsData.length,
                        upcoming: upcoming.length,
                        completed: completed.length
                    });
                    setLoading(false);
                    fetchingRef.current = false;
                }
            } catch (error: any) {
                console.error('Failed to fetch profile:', error);
                
                // Clear timeout on error
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                
                if (isMounted) {
                    // Handle 404 "Patient profile not found" gracefully
                    if (error.response?.status === 404 || error.code === 'ECONNABORTED') {
                        // Show friendly message instead of error toast
                        setPatient(null);
                        setStats({ total: 0, upcoming: 0, completed: 0 });
                    } else {
                        toast({
                            title: "Error",
                            description: error.response?.data?.detail || error.message || "Failed to load profile",
                            variant: "destructive",
                        });
                    }
                    setLoading(false);
                    fetchingRef.current = false;
                }
            }
        };

        fetchProfile();

        return () => {
            isMounted = false;
            fetchingRef.current = false;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [user?.id]);

    const handleSave = async () => {
        try {
            setSaving(true);
            const updated = await patientService.updateProfile(formData);
            setPatient(updated);
            setIsEditing(false);
            toast({
                title: "Success",
                description: "Profile updated successfully",
            });
        } catch (error: any) {
            console.error('Failed to update profile:', error);
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to update profile",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Card>
                        <CardContent className="p-8 text-center">
                            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-lg">Please log in to view your profile.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">Loading profile...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold mb-8">My Profile</h1>

                <div className="grid gap-6">
                {/* Profile Header */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={patient?.avatar_url} />
                                    <AvatarFallback className="text-2xl">
                                        {patient?.full_name?.substring(0, 2).toUpperCase() || user.email.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                {isEditing && (
                                    <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                                        <Camera className="h-4 w-4" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                
                                                // For now, we'll use a simple approach: convert to base64 or URL
                                                // In production, this should upload to Azure and get the URL
                                                const reader = new FileReader();
                                                reader.onloadend = async () => {
                                                    try {
                                                        // For now, store as data URL (in production, upload to Azure)
                                                        const dataUrl = reader.result as string;
                                                        const updated = await patientService.updateProfile({ avatar_url: dataUrl });
                                                        setPatient(updated);
                                                        setFormData(updated);
                                                        toast({
                                                            title: "Success",
                                                            description: "Profile picture updated successfully",
                                                        });
                                                    } catch (error: any) {
                                                        toast({
                                                            title: "Error",
                                                            description: error.response?.data?.detail || "Failed to update profile picture",
                                                            variant: "destructive",
                                                        });
                                                    }
                                                };
                                                reader.readAsDataURL(file);
                                            }}
                                        />
                                    </label>
                                )}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold">{patient?.full_name || 'Patient'}</h2>
                                <p className="text-muted-foreground">{user.email}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Personal Information */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Personal Information</CardTitle>
                            {!isEditing ? (
                                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => {
                                        setIsEditing(false);
                                        setFormData(patient || {});
                                    }}>Cancel</Button>
                                    <Button onClick={handleSave} disabled={saving}>
                                        {saving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="fullName"
                                        value={formData.full_name || ''}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        readOnly={!isEditing}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <Input id="email" value={user.email} readOnly />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        value={formData.phone || ''}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        readOnly={!isEditing}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                <Input
                                    id="dateOfBirth"
                                    type="date"
                                    value={formData.date_of_birth || ''}
                                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                    readOnly={!isEditing}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                {isEditing ? (
                                    <Select
                                        value={formData.gender || ''}
                                        onValueChange={(value) => setFormData({ ...formData, gender: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input value={formData.gender || 'Not provided'} readOnly />
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bloodGroup">Blood Group</Label>
                                {isEditing ? (
                                    <Select
                                        value={formData.blood_group || ''}
                                        onValueChange={(value) => setFormData({ ...formData, blood_group: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select blood group" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="A+">A+</SelectItem>
                                            <SelectItem value="A-">A-</SelectItem>
                                            <SelectItem value="B+">B+</SelectItem>
                                            <SelectItem value="B-">B-</SelectItem>
                                            <SelectItem value="AB+">AB+</SelectItem>
                                            <SelectItem value="AB-">AB-</SelectItem>
                                            <SelectItem value="O+">O+</SelectItem>
                                            <SelectItem value="O-">O-</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input value={formData.blood_group || 'Not provided'} readOnly />
                                )}
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    value={formData.address || ''}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    readOnly={!isEditing}
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={formData.city || ''}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    readOnly={!isEditing}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input
                                    id="state"
                                    value={formData.state || ''}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    readOnly={!isEditing}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>Account Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-muted rounded-lg">
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Total Appointments</p>
                            </div>
                            <div className="text-center p-4 bg-muted rounded-lg">
                                <p className="text-2xl font-bold">{stats.upcoming}</p>
                                <p className="text-sm text-muted-foreground">Upcoming</p>
                            </div>
                            <div className="text-center p-4 bg-muted rounded-lg">
                                <p className="text-2xl font-bold">{stats.completed}</p>
                                <p className="text-sm text-muted-foreground">Completed</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                </div>
            </div>
        </div>
    );
}
