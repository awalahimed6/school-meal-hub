import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Star, MessageSquare } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { SignedImage } from "@/components/ui/signed-image";

interface StudentVoiceFeedProps {
  showHeader?: boolean;
  limit?: number;
}

const mealLabels: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

const mealEmojis: Record<string, string> = {
  breakfast: "🥐",
  lunch: "🍔",
  dinner: "🍝",
};

export const StudentVoiceFeed = ({ showHeader = true, limit = 6 }: StudentVoiceFeedProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: publicRatings, isLoading } = useQuery({
    queryKey: ["public-ratings", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meal_ratings")
        .select(`
          id,
          rating,
          comment,
          meal_type,
          meal_date,
          image_url,
          created_at,
          student_id
        `)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });

  const { data: allLikes } = useQuery({
    queryKey: ["all-likes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback_likes")
        .select("rating_id, user_id");
      if (error) throw error;
      return data;
    },
  });

  const toggleLike = useMutation({
    mutationFn: async (ratingId: string) => {
      if (!user) {
        toast.info("Please login to like feedback");
        navigate("/auth");
        throw new Error("Please login to like feedback");
      }
      const { data, error } = await supabase.rpc("toggle_like" as any, {
        _rating_id: ratingId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-likes"] });
    },
    onError: (error) => {
      if (error.message !== "Please login to like feedback") {
        toast.error("Failed to update like");
      }
    },
  });

  const getLikeCount = (ratingId: string) => {
    return allLikes?.filter((like) => like.rating_id === ratingId).length || 0;
  };

  const hasUserLiked = (ratingId: string) => {
    return allLikes?.some(
      (like) => like.rating_id === ratingId && like.user_id === user?.id
    ) || false;
  };

  const handleLikeClick = (ratingId: string) => {
    if (!user) {
      toast.info("Please login to like feedback");
      navigate("/auth");
      return;
    }
    toggleLike.mutate(ratingId);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[160px] rounded-3xl shimmer" />
        ))}
      </div>
    );
  }

  if (!publicRatings || publicRatings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground page-enter">
        <span className="text-4xl block mb-3">💬</span>
        <p className="font-medium">No public feedback yet.</p>
        <p className="text-sm mt-1">Be the first to share your thoughts!</p>
      </div>
    );
  }

  const content = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
      {publicRatings.map((rating) => (
        <Card
          key={rating.id}
          className="border-0 shadow-md card-hover overflow-hidden group"
        >
          <CardContent className="p-4 space-y-3">
            {/* Header with meal type + stars */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{mealEmojis[rating.meal_type] || "🍽️"}</span>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {mealLabels[rating.meal_type] || rating.meal_type}
                  </span>
                  <p className="text-[10px] text-muted-foreground/60">
                    {format(new Date(rating.meal_date), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      star <= rating.rating
                        ? "fill-warning text-warning"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Comment */}
            {rating.comment && (
              <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                "{rating.comment}"
              </p>
            )}

            {/* Image */}
            {rating.image_url && (
              <SignedImage
                storedUrl={rating.image_url}
                alt="Meal photo"
                className="rounded-xl w-full h-32 object-cover"
              />
            )}

            {/* Like Button */}
            <div className="flex items-center justify-between pt-1 border-t border-border/50">
              <button
                onClick={() => handleLikeClick(rating.id)}
                className="flex items-center gap-2 text-sm group/like py-1"
              >
                <Heart
                  className={`h-4.5 w-4.5 transition-all duration-300 ${
                    hasUserLiked(rating.id)
                      ? "fill-destructive text-destructive scale-110"
                      : "text-muted-foreground group-hover/like:text-destructive group-hover/like:scale-110"
                  }`}
                />
                <span className="text-xs font-semibold text-muted-foreground">
                  {getLikeCount(rating.id)}
                </span>
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (!showHeader) {
    return content;
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <MessageSquare className="mx-auto mb-2 h-12 w-12 text-primary" />
        <CardTitle className="text-2xl">Student Voice</CardTitle>
        <CardDescription>
          See what students are saying about their meals
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};
