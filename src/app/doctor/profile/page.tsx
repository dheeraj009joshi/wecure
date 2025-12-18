"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, Save, Loader2 } from "lucide-react"
import { doctorService, Doctor } from "@/services/doctorService"
import { useToast } from "@/components/ui/use-toast"
import { useAuthStore } from "@/store/authStore"

export default function DoctorProfile() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<Partial<Doctor>>({});
    const { toast } = useToast();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await doctorService.getProfile();
            setProfile(data);
        } catch (error) {
            console.error("Failed to fetch profile:", error);
            toast({
                title: "Error",
                description: "Failed to load profile data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await doctorService.updateProfile(profile);
            toast({
                title: "Success",
                description: "Your profile has been updated successfully!",
            });
        } catch (error: any) {
            console.error("Failed to update profile:", error);
            toast({
                title: "Error",
                description: error.response?.data?.detail || "Failed to update profile. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof Doctor, value: any) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return <div className="p-8">Loading profile...</div>;
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold">Profile Settings</h1>
                <p className="text-muted-foreground">Manage your professional information</p>
            </div>

            {/* Profile Photo */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile Photo</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={profile.avatar_url} />
                            <AvatarFallback>{profile.full_name?.charAt(0) || "D"}</AvatarFallback>
                        </Avatar>
                        <Button variant="outline" onClick={() => toast({ description: "Photo upload coming soon" })}>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload New Photo
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={profile.full_name || ''}
                                onChange={(e) => handleChange('full_name', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="specialty">Specialties (comma separated)</Label>
                            <Input
                                id="specialty"
                                value={profile.specialties?.join(', ') || ''}
                                onChange={(e) => handleChange('specialties', e.target.value.split(',').map(s => s.trim()))}
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={user?.email || ''} disabled className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={profile.phone || ''}
                                onChange={(e) => handleChange('phone', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            rows={4}
                            value={profile.bio || ''}
                            onChange={(e) => handleChange('bio', e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Professional Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Professional Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="registration">Registration Number</Label>
                            <Input
                                id="registration"
                                value={profile.registration_number || ''}
                                onChange={(e) => handleChange('registration_number', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="experience">Years of Experience</Label>
                            <Input
                                id="experience"
                                type="number"
                                value={profile.experience_years || 0}
                                onChange={(e) => handleChange('experience_years', parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="education">Education</Label>
                        <Textarea
                            id="education"
                            rows={3}
                            value={profile.education || ''}
                            onChange={(e) => handleChange('education', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="clinic">Clinic Address</Label>
                        <Textarea
                            id="clinic"
                            rows={2}
                            value={profile.clinic_address || ''}
                            onChange={(e) => handleChange('clinic_address', e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Consultation Fees */}
            <Card>
                <CardHeader>
                    <CardTitle>Consultation Fees (₹)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="video-fee">Video Consultation</Label>
                            <Input
                                id="video-fee"
                                type="number"
                                value={profile.video_consultation_fee || 0}
                                onChange={(e) => handleChange('video_consultation_fee', parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="inperson-fee">In-Person Consultation</Label>
                            <Input
                                id="inperson-fee"
                                type="number"
                                value={profile.in_person_consultation_fee || 0}
                                onChange={(e) => handleChange('in_person_consultation_fee', parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    size="lg"
                    className="bg-gradient-to-r from-primary-blue to-primary-purple"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
        </div>
    )
}
