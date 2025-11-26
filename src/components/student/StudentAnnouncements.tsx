import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Bell } from "lucide-react";

export const StudentAnnouncements = () => {
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

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!announcements || announcements.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">No announcements yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((announcement) => (
        <Card key={announcement.id}>
          <CardContent className="pt-6">
            <h3 className="mb-2 font-semibold">{announcement.title}</h3>
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
