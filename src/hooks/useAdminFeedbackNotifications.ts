import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { toast } from "sonner";

export const useAdminFeedbackNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Store last checked timestamp in localStorage for admin
  const getLastChecked = () => {
    try {
      const stored = localStorage.getItem(`admin-feedback-last-checked-${user?.id}`);
      return stored || new Date(0).toISOString();
    } catch {
      return new Date(0).toISOString();
    }
  };

  // Count new feedback since last checked
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["admin-unread-feedback", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const lastChecked = getLastChecked();

      const { count, error } = await supabase
        .from("meal_ratings")
        .select("*", { count: "exact", head: true })
        .gt("created_at", lastChecked);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Fetch recent feedback for the dropdown
  const { data: recentFeedback = [] } = useQuery({
    queryKey: ["admin-recent-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meal_ratings")
        .select("*, students(full_name, student_id)")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const markAsRead = () => {
    if (!user?.id) return;
    localStorage.setItem(`admin-feedback-last-checked-${user.id}`, new Date().toISOString());
    queryClient.invalidateQueries({ queryKey: ["admin-unread-feedback"] });
  };

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("admin-feedback-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "meal_ratings",
        },
        (payload) => {
          toast.info("New Student Feedback", {
            description: payload.new.comment
              ? payload.new.comment.substring(0, 60) + (payload.new.comment.length > 60 ? "..." : "")
              : `${payload.new.meal_type} rated ${payload.new.rating}/5`,
            duration: 5000,
          });
          queryClient.invalidateQueries({ queryKey: ["admin-unread-feedback"] });
          queryClient.invalidateQueries({ queryKey: ["admin-recent-feedback"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return { unreadCount, recentFeedback, markAsRead };
};
