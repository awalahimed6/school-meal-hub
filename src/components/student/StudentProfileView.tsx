import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, GraduationCap, Hash, Users } from "lucide-react";

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
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-full animate-pulse opacity-20 blur-xl"></div>
          <Avatar className="h-32 w-32 border-4 border-primary relative">
            <AvatarImage src={student.profile_image || undefined} />
            <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-purple-600 text-white">
              {student.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary">
            Pro
          </Badge>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold">{student.full_name}</h2>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="rounded-[24px] shadow-lg border-0">
          <CardContent className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">Gender</span>
            </div>
            <p className="text-2xl font-bold">{student.sex}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] shadow-lg border-0">
          <CardContent className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              <span className="text-sm">Grade</span>
            </div>
            <p className="text-2xl font-bold">{student.grade}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] shadow-lg border-0">
          <CardContent className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="h-4 w-4" />
              <span className="text-sm">Student ID</span>
            </div>
            <p className="text-xl font-bold">{student.student_id}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] shadow-lg border-0">
          <CardContent className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="text-sm">Status</span>
            </div>
            <Badge variant={student.status === "active" ? "default" : "secondary"} className="text-sm">
              {student.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {(student.allergies || student.dietary_needs) && (
        <div className="space-y-4">
          {student.allergies && (
            <Card className="rounded-[24px] shadow-lg border-0 bg-red-50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-red-900 mb-2">⚠️ Allergies</h3>
                <p className="text-red-800">{student.allergies}</p>
              </CardContent>
            </Card>
          )}
          
          {student.dietary_needs && (
            <Card className="rounded-[24px] shadow-lg border-0 bg-blue-50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-blue-900 mb-2">🍽️ Dietary Needs</h3>
                <p className="text-blue-800">{student.dietary_needs}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
