import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Star, MessageSquare } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

interface StudentVoiceFeedProps {
  showHeader?: boolean;
  limit?: number;
}

const mealLabels: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

export const StudentVoiceFeed = ({ showHeader = true, limit = 6 }: StudentVoiceFeedProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch public ratings for Student Voice
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

  // Fetch likes for all public ratings
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

  // Toggle like mutation
  const toggleLike = useMutation({
    mutationFn: async (ratingId: string) => {
      if (!user) {
        toast.info("Please login to like feedback");
        navigate("/auth");
        throw new Error("Please login to like feedback");
      }

      const { data, error } = await supabase.rpc("toggle_like", {
        _rating_id: ratingId,
        _user_id: user.id,
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

  // Helper functions for likes
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
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading feedback...</div>
      </div>
    );
  }

  if (!publicRatings || publicRatings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No public feedback yet. Be the first to share your thoughts!
      </div>
    );
  }

  const content = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {publicRatings.map((rating) => (
        <div
          key={rating.id}
          className="rounded-lg border p-4 space-y-3 hover:shadow-md transition-shadow bg-card"
        >
          {/* Rating Stars */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= rating.rating
                    ? "fill-warning text-warning"
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>

          {/* Comment */}
          {rating.comment && (
            <p className="text-sm text-foreground line-clamp-3">
              "{rating.comment}"
            </p>
          )}

          {/* Image if present */}
          {rating.image_url && (
            <img
              src={rating.image_url}
              alt="Meal photo"
              className="rounded-lg w-full h-32 object-cover"
            />
          )}

          {/* Meal Type & Date */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="capitalize font-medium">
              {mealLabels[rating.meal_type] || rating.meal_type}
            </span>
            <span>
              {format(new Date(rating.meal_date), "MMM d, yyyy")}
            </span>
          </div>

          {/* Like Button */}
          <button
            onClick={() => handleLikeClick(rating.id)}
            className="flex items-center gap-2 text-sm group"
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                hasUserLiked(rating.id)
                  ? "fill-destructive text-destructive"
                  : "text-muted-foreground group-hover:text-destructive"
              }`}
            />
            <span className="text-muted-foreground">
              {getLikeCount(rating.id)}
            </span>
          </button>
        </div>
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
