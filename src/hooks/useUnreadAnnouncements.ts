import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";
import { toast } from "sonner";

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

  // Subscribe to real-time announcement changes
  useEffect(() => {
    if (!user?.id) return;

    // Create notification sound
    const playNotificationSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    };

    const channel = supabase
      .channel("announcements-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "announcements",
        },
        (payload) => {
          console.log("New announcement received:", payload);
          
          // Play notification sound
          try {
            playNotificationSound();
          } catch (error) {
            console.log("Could not play notification sound:", error);
          }
          
          // Show toast notification with dismiss action
          toast.info("New Announcement", {
            description: payload.new.title,
            duration: 5000,
            action: {
              label: "Dismiss",
              onClick: () => {},
            },
          });

          // Invalidate queries to update unread count
          queryClient.invalidateQueries({ queryKey: ["unread-announcements"] });
          queryClient.invalidateQueries({ queryKey: ["student-announcements"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return {
    unreadCount,
    markAsRead: markAsRead.mutate,
  };
};
