"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, ThumbsUp } from "lucide-react"
import { reviewService } from "@/services/reviewService"
import { doctorService } from "@/services/doctorService"
import { useToast } from "@/components/ui/use-toast"

export default function DoctorReviews() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [reviewsData, profileData] = await Promise.all([
                reviewService.getMyReviews(),
                doctorService.getProfile()
            ]);
            setReviews(reviewsData);
            setProfile(profileData);
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
            toast({
                title: "Error",
                description: "Failed to load reviews",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Calculate rating distribution
    const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
        rating,
        count: reviews.filter(r => r.rating === rating).length
    }));

    const totalReviews = reviews.length;
    const averageRating = profile?.average_rating || 0;

    if (loading) {
        return <div className="p-8">Loading reviews...</div>;
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold">Reviews & Ratings</h1>
                <p className="text-muted-foreground">See what your patients are saying</p>
            </div>

            {/* Overall Rating */}
            <Card>
                <CardContent className="p-8">
                    <div className="flex items-center gap-8">
                        <div className="text-center">
                            <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
                            <div className="flex items-center justify-center gap-1 my-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                        key={star} 
                                        className={`h-5 w-5 ${
                                            star <= Math.round(averageRating) 
                                                ? 'fill-yellow-400 text-yellow-400' 
                                                : 'text-gray-300'
                                        }`} 
                                    />
                                ))}
                            </div>
                            <p className="text-sm text-muted-foreground">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
                        </div>

                        <div className="flex-1 space-y-2">
                            {ratingDistribution.map(({ rating, count }) => {
                                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                                return (
                                    <div key={rating} className="flex items-center gap-3">
                                        <span className="text-sm w-12">{rating} star</span>
                                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-yellow-400"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-muted-foreground w-12 text-right">
                                            {count}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Individual Reviews */}
            <div className="space-y-4">
                {reviews.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center text-muted-foreground">
                            <p>No reviews yet</p>
                            <p className="text-sm mt-2">Reviews will appear here once patients rate your services</p>
                        </CardContent>
                    </Card>
                ) : (
                    reviews.map((review) => {
                        const reviewDate = new Date(review.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        });
                        return (
                            <Card key={review.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={review.patient?.avatar_url} />
                                            <AvatarFallback>
                                                {review.patient?.full_name?.charAt(0) || 'P'}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="font-semibold">
                                                        {review.patient?.full_name || 'Anonymous Patient'}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="flex items-center gap-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className={`h-4 w-4 ${
                                                                        i < review.rating
                                                                            ? 'fill-yellow-400 text-yellow-400'
                                                                            : 'text-muted-foreground'
                                                                    }`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-sm text-muted-foreground">{reviewDate}</span>
                                                    </div>
                                                </div>
                                                <Badge variant="outline">Verified</Badge>
                                            </div>

                                            {review.comment && (
                                                <p className="text-sm text-muted-foreground mb-3">{review.comment}</p>
                                            )}

                                            {!review.comment && (
                                                <p className="text-sm text-muted-foreground mb-3 italic">No comment provided</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    )
}
