import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useUnreadVoice = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch student's last_checked_voice timestamp
  const { data: studentData } = useQuery({
    queryKey: ["student-voice-check", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("students")
        .select("id, last_checked_voice")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Count public voice feedback created after last_checked_voice
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-voice", studentData?.id, studentData?.last_checked_voice],
    queryFn: async () => {
      if (!studentData) return 0;

      const lastChecked = studentData.last_checked_voice || new Date(0).toISOString();

      const { count, error } = await supabase
        .from("meal_ratings")
        .select("*", { count: "exact", head: true })
        .eq("is_public", true)
        .gt("created_at", lastChecked);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!studentData?.id,
  });

  // Mark voice as read by updating last_checked_voice
  const { mutate: markAsRead } = useMutation({
    mutationFn: async () => {
      if (!studentData?.id) return;
      const { error } = await supabase
        .from("students")
        .update({ last_checked_voice: new Date().toISOString() })
        .eq("id", studentData.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unread-voice"] });
      queryClient.invalidateQueries({ queryKey: ["student-voice-check"] });
    },
  });

  return { unreadCount, markAsRead };
};
