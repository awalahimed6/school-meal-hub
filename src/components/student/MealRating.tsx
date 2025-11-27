import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const MealRating = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");

  const today = format(new Date(), "yyyy-MM-dd");

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

  // Check if student ate lunch today
  const { data: todayMeal, isLoading: loadingMeal } = useQuery({
    queryKey: ["today-meal", student?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("student_id", student?.id)
        .eq("meal_date", today)
        .eq("meal_type", "lunch")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!student?.id,
  });

  // Check if already rated
  const { data: existingRating, isLoading: loadingRating } = useQuery({
    queryKey: ["meal-rating", student?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meal_ratings")
        .select("*")
        .eq("student_id", student?.id)
        .eq("meal_date", today)
        .eq("meal_type", "lunch")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!student?.id,
  });

  const submitRating = useMutation({
    mutationFn: async () => {
      if (!student?.id || rating === 0) return;

      const { error } = await supabase.from("meal_ratings").insert({
        student_id: student.id,
        meal_date: today,
        meal_type: "lunch",
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
    return (
      <div className="text-sm text-muted-foreground">
        You didn't have lunch today yet.
      </div>
    );
  }

  if (existingRating) {
    return (
      <div className="space-y-2">
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
          You rated today's lunch. Thank you!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">How was today's lunch?</p>
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
