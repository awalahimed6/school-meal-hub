import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { SignedAvatar } from "@/components/ui/signed-image";
import { Badge } from "@/components/ui/badge";
import { User, GraduationCap, Hash, Users, AlertTriangle, UtensilsCrossed } from "lucide-react";
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
        <Skeleton className="h-28 w-28 rounded-full mx-auto" />
        <Skeleton className="h-8 w-40 mx-auto" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!student) {
    return <div className="text-center py-12 text-muted-foreground">No profile found</div>;
  }

  const initials = student.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6 pb-24">
      {/* Profile Header */}
      <div className="text-center space-y-3">
        <div className="relative inline-block">
          <div className="absolute -inset-2 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full blur-xl opacity-50" />
          <SignedAvatar
            src={student.profile_image}
            className="h-28 w-28 border-[3px] border-primary/20 ring-4 ring-primary/5 relative"
            fallback={
              <span className="text-2xl font-bold bg-gradient-to-br from-primary to-secondary text-primary-foreground w-full h-full flex items-center justify-center">
                {initials}
              </span>
            }
          />
          <Badge className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] px-2 ${
            student.status === 'active' 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-destructive hover:bg-destructive/90'
          }`}>
            {student.status}
          </Badge>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground">{student.full_name}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium uppercase tracking-wider">Gender</span>
            </div>
            <p className="text-lg font-bold text-foreground">{student.sex}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium uppercase tracking-wider">Grade</span>
            </div>
            <p className="text-lg font-bold text-foreground">{student.grade}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium uppercase tracking-wider">Student ID</span>
            </div>
            <p className="text-base font-bold text-foreground">{student.student_id}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium uppercase tracking-wider">Status</span>
            </div>
            <Badge variant={student.status === "active" ? "default" : "secondary"} className="text-xs mt-1">
              {student.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Allergies & Dietary */}
      {(student.allergies || student.dietary_needs) && (
        <div className="space-y-3">
          {student.allergies && (
            <Card className="border-0 shadow-md bg-destructive/5">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-destructive uppercase tracking-wider">Allergies</p>
                  <p className="text-sm text-foreground mt-0.5">{student.allergies}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {student.dietary_needs && (
            <Card className="border-0 shadow-md bg-secondary/5">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <UtensilsCrossed className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Dietary Needs</p>
                  <p className="text-sm text-foreground mt-0.5">{student.dietary_needs}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Settings */}
      <StudentSettings />
    </div>
  );
};
