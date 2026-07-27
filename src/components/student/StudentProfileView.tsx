import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, GraduationCap, Hash, Users } from "lucide-react";
import { StudentSettings } from "./StudentSettings";

export const StudentProfileView = () => {
  const { user } = useAuth();

  const { data: student, isLoading } = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 pb-24">
        <Skeleton className="h-32 w-32 rounded-full mx-auto" />
        <Skeleton className="h-12 w-48 mx-auto" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-[24px]" />
          <Skeleton className="h-32 rounded-[24px]" />
          <Skeleton className="h-32 rounded-[24px]" />
          <Skeleton className="h-32 rounded-[24px]" />
        </div>
      </div>
    );
  }

  if (!student) {
    return <div className="text-center py-12">No profile found</div>;
  }

  return (
    <div className="space-y-8 pb-24">
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <Avatar className="h-28 w-28 border-2 border-border shadow-xs relative">
            <AvatarImage src={student.profile_image || undefined} />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground font-semibold">
              {student.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{student.full_name}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="rounded-lg border border-border/80 shadow-xs">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide font-medium">Gender</span>
            </div>
            <p className="text-xl font-bold text-foreground">{student.sex}</p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border/80 shadow-xs">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide font-medium">Grade</span>
            </div>
            <p className="text-xl font-bold text-foreground">{student.grade}</p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border/80 shadow-xs">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide font-medium">Student ID</span>
            </div>
            <p className="text-lg font-bold font-mono text-foreground">{student.student_id}</p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border/80 shadow-xs">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide font-medium">Status</span>
            </div>
            <Badge variant={student.status === "active" ? "default" : "secondary"} className="text-xs">
              {student.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {(student.allergies || student.dietary_needs) && (
        <div className="space-y-4">
          {student.allergies && (
            <Card className="rounded-lg border border-border bg-card shadow-xs">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground mb-1 text-sm uppercase tracking-wide">⚠️ Allergies</h3>
                <p className="text-muted-foreground text-sm">{student.allergies}</p>
              </CardContent>
            </Card>
          )}
          
          {student.dietary_needs && (
            <Card className="rounded-lg border border-border bg-card shadow-xs">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground mb-1 text-sm uppercase tracking-wide">🍽️ Dietary Needs</h3>
                <p className="text-muted-foreground text-sm">{student.dietary_needs}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <StudentSettings />
    </div>
  );
};
