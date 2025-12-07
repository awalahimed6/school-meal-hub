import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { toast } from "sonner";

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

  // Subscribe to real-time public voice feedback
  useEffect(() => {
    if (!user?.id) return;

    // Create notification sound
    const playNotificationSound = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 600;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
      } catch (error) {
        console.log("Could not play notification sound:", error);
      }
    };

    const channel = supabase
      .channel("voice-feedback-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "meal_ratings",
        },
        (payload) => {
          // Only notify for public feedback
          if (payload.new.is_public) {
            console.log("New public voice feedback received:", payload);

            // Play notification sound
            playNotificationSound();

            // Show toast notification
            toast.info("New Student Voice", {
              description: payload.new.comment 
                ? payload.new.comment.substring(0, 50) + (payload.new.comment.length > 50 ? "..." : "")
                : "A student shared feedback about a meal",
              duration: 5000,
              action: {
                label: "View",
                onClick: () => {},
              },
            });

            // Invalidate queries to update unread count and feed
            queryClient.invalidateQueries({ queryKey: ["unread-voice"] });
            queryClient.invalidateQueries({ queryKey: ["public-ratings"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return { unreadCount, markAsRead };
};
