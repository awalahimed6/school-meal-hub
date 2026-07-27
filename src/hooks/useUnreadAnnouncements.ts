import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";
import { toast } from "sonner";

// Get notification preferences from localStorage
const getNotificationPreferences = () => {
  try {
    const stored = localStorage.getItem("notification-preferences");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return { soundEnabled: true, toastEnabled: true };
};

export const useUnreadAnnouncements = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get student data
  const { data: student } = useQuery({
    queryKey: ["student-data", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("students")
        .select("id, last_checked_announcements")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get dismissed announcements
  const { data: dismissals } = useQuery({
    queryKey: ["dismissed-announcements", student?.id],
    queryFn: async () => {
      if (!student?.id) return [];
      const { data, error } = await supabase
        .from("student_announcement_dismissals")
        .select("announcement_id")
        .eq("student_id", student.id);

      if (error) throw error;
      return data.map((d) => d.announcement_id);
    },
    enabled: !!student?.id,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-announcements", user?.id, dismissals],
    queryFn: async () => {
      if (!user?.id || !student) return 0;

      // Get all announcements created after last check
      const { data: announcements } = await supabase
        .from("announcements")
        .select("id")
        .gt(
          "created_at",
          student.last_checked_announcements || new Date(0).toISOString()
        );

      if (!announcements) return 0;

      // Filter out dismissed announcements
      const unreadAnnouncementIds = announcements
        .map((a) => a.id)
        .filter((id) => !dismissals?.includes(id));

      return unreadAnnouncementIds.length;
    },
    enabled: !!user?.id && !!student && !!dismissals,
  });

  const markAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;

      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

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
      const prefs = getNotificationPreferences();
      if (!prefs.soundEnabled) return;

      try {
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
      } catch (error) {
        console.log("Could not play notification sound:", error);
      }
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
          
          // Play notification sound (respects preferences internally)
          playNotificationSound();
          
          // Show toast notification if enabled
          const prefs = getNotificationPreferences();
          if (prefs.toastEnabled) {
            toast.info("New Announcement", {
              description: payload.new.title,
              duration: 5000,
              action: {
                label: "Dismiss",
                onClick: () => {},
              },
            });
          }

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
