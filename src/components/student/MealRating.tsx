import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type MealType = "breakfast" | "lunch" | "dinner";

const MealRatingSection = ({
  mealType,
  studentId,
  today,
}: {
  mealType: MealType;
  studentId: string;
  today: string;
}) => {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");

  const mealLabels = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
  };

  // Check if student ate this meal today
  const { data: todayMeal, isLoading: loadingMeal } = useQuery({
    queryKey: ["today-meal", studentId, today, mealType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("student_id", studentId)
        .eq("meal_date", today)
        .eq("meal_type", mealType)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  // Check if already rated
  const { data: existingRating, isLoading: loadingRating } = useQuery({
    queryKey: ["meal-rating", studentId, today, mealType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meal_ratings")
        .select("*")
        .eq("student_id", studentId)
        .eq("meal_date", today)
        .eq("meal_type", mealType)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  const submitRating = useMutation({
    mutationFn: async () => {
      if (!studentId || rating === 0) return;

      const { error } = await supabase.from("meal_ratings").insert({
        student_id: studentId,
        meal_date: today,
        meal_type: mealType,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Thank you for your feedback!");
      queryClient.invalidateQueries({ queryKey: ["meal-rating"] });
      setRating(0);
      setComment("");
    },
    onError: () => {
      toast.error("Failed to submit rating");
    },
  });

  if (loadingMeal || loadingRating) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!todayMeal) {
    return null;
  }

  if (existingRating) {
    return (
      <div className="space-y-2 p-4 rounded-lg bg-muted/50">
        <p className="text-sm font-medium">{mealLabels[mealType]}</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-5 w-5 ${
                star <= existingRating.rating
                  ? "fill-warning text-warning"
                  : "text-muted-foreground"
              }`}
            />
          ))}
        </div>
        {existingRating.comment && (
          <p className="text-sm text-muted-foreground italic">
            "{existingRating.comment}"
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          You rated this meal. Thank you!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 rounded-lg border">
      <div>
        <p className="text-sm font-medium mb-2">
          How was today's {mealLabels[mealType].toLowerCase()}?
        </p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-6 w-6 cursor-pointer ${
                  star <= (hoveredRating || rating)
                    ? "fill-warning text-warning"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Textarea
          placeholder="Tell us what you thought (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="resize-none"
          rows={3}
        />
      </div>

      <Button
        onClick={() => submitRating.mutate()}
        disabled={rating === 0 || submitRating.isPending}
        className="w-full"
      >
        {submitRating.isPending ? "Submitting..." : "Submit Rating"}
      </Button>
    </div>
  );
};

export const MealRating = () => {
  const { user } = useAuth();

  // Get student ID
  const { data: student } = useQuery({
    queryKey: ["student", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get recent meals (last 3 days) to handle timezone issues
  const { data: recentMeals, isLoading } = useQuery({
    queryKey: ["recent-meals", student?.id],
    queryFn: async () => {
      const threeDaysAgo = format(
        new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        "yyyy-MM-dd"
      );
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("student_id", student?.id)
        .gte("meal_date", threeDaysAgo)
        .order("meal_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!student?.id,
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!recentMeals || recentMeals.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        You haven't had any recent meals to rate.
      </div>
    );
  }

  // Get the most recent meal date
  const latestMealDate = recentMeals[0].meal_date;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-2">
        Rating meals from {format(new Date(latestMealDate), "MMMM d, yyyy")}
      </p>
      {(["breakfast", "lunch", "dinner"] as MealType[]).map((mealType) => (
        <MealRatingSection
          key={mealType}
          mealType={mealType}
          studentId={student!.id}
          today={latestMealDate}
        />
      ))}
    </div>
  );
};
