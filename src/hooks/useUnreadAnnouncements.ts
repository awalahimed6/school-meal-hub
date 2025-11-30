import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useUnreadAnnouncements = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-announcements", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      // Get student's last check time
      const { data: student } = await supabase
        .from("students")
        .select("last_checked_announcements")
        .eq("user_id", user.id)
        .single();

      if (!student) return 0;

      // Count announcements created after last check
      const { count } = await supabase
        .from("announcements")
        .select("*", { count: "exact", head: true })
        .gt(
          "created_at",
          student.last_checked_announcements || new Date(0).toISOString()
        );

      return count || 0;
    },
    enabled: !!user?.id,
  });

  const markAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;

      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!student) return;

      await supabase
        .from("students")
        .update({ last_checked_announcements: new Date().toISOString() })
        .eq("id", student.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unread-announcements"] });
    },
  });

  return {
    unreadCount,
    markAsRead: markAsRead.mutate,
  };
};
