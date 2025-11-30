import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export const StudentAnnouncements = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get student ID
  const { data: student } = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .single();

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

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["student-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  // Dismiss announcement mutation
  const dismissAnnouncement = useMutation({
    mutationFn: async (announcementId: string) => {
      if (!student?.id) throw new Error("Student not found");

      const { error } = await supabase
        .from("student_announcement_dismissals")
        .insert({
          student_id: student.id,
          announcement_id: announcementId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Announcement dismissed");
      queryClient.invalidateQueries({ queryKey: ["dismissed-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["unread-announcements"] });
    },
    onError: () => {
      toast.error("Failed to dismiss announcement");
    },
  });

  // Filter out dismissed announcements
  const visibleAnnouncements = announcements?.filter(
    (announcement) => !dismissals?.includes(announcement.id)
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!visibleAnnouncements || visibleAnnouncements.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">No announcements yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visibleAnnouncements.map((announcement) => (
        <Card key={announcement.id}>
          <CardContent className="pt-6 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={() => dismissAnnouncement.mutate(announcement.id)}
              disabled={dismissAnnouncement.isPending}
            >
              <X className="h-4 w-4" />
            </Button>
            <h3 className="mb-2 font-semibold pr-8">{announcement.title}</h3>
            <p className="mb-2 text-sm text-muted-foreground">
              {announcement.content}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(announcement.created_at), "MMM d, yyyy")}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
