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
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-28 w-28 rounded-full shimmer" />
          <Skeleton className="h-5 w-32 rounded shimmer" />
          <Skeleton className="h-4 w-48 rounded shimmer" />
        </div>
        <div className="grid grid-cols-2 gap-3 stagger-children">
          <Skeleton className="h-[80px] rounded-3xl shimmer" />
          <Skeleton className="h-[80px] rounded-3xl shimmer" />
          <Skeleton className="h-[80px] rounded-3xl shimmer" />
          <Skeleton className="h-[80px] rounded-3xl shimmer" />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12 text-muted-foreground page-enter">
        <span className="text-4xl block mb-3">👤</span>
        <p className="font-medium">No profile found</p>
      </div>
    );
  }

  const initials = student.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const infoItems = [
    { icon: Users, label: "Gender", value: student.sex, color: "from-secondary/15 to-secondary/5", iconColor: "text-secondary" },
    { icon: GraduationCap, label: "Grade", value: student.grade, color: "from-primary/15 to-primary/5", iconColor: "text-primary" },
    { icon: Hash, label: "Student ID", value: student.student_id, color: "from-accent/15 to-accent/5", iconColor: "text-accent" },
    { icon: User, label: "Status", value: null, badge: student.status, color: "from-muted/80 to-muted/40", iconColor: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6 pb-24 page-enter">
      {/* Profile Header */}
      <div className="text-center space-y-3">
        <div className="relative inline-block">
          <div className="absolute -inset-3 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-2xl opacity-60 animate-glow" />
          <SignedAvatar
            src={student.profile_image}
            className="h-28 w-28 border-[3px] border-primary/20 ring-4 ring-primary/5 relative"
            fallback={
              <span className="text-2xl font-bold bg-gradient-to-br from-primary to-secondary text-primary-foreground w-full h-full flex items-center justify-center">
                {initials}
              </span>
            }
          />
          <Badge className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] px-2.5 shadow-sm ${
            student.status === 'active' 
              ? 'bg-success hover:bg-success/90 text-success-foreground' 
              : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
          }`}>
            {student.status}
          </Badge>
        </div>

        <div className="animate-slide-down-fade">
          <h2 className="text-xl font-bold text-foreground">{student.full_name}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 stagger-children">
        {infoItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="border-0 shadow-md card-hover overflow-hidden">
              <CardContent className={`p-4 space-y-1.5 bg-gradient-to-br ${item.color}`}>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className={`h-3.5 w-3.5 ${item.iconColor}`} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
                </div>
                {item.badge ? (
                  <Badge variant={item.badge === "active" ? "default" : "secondary"} className="text-xs mt-1">
                    {item.badge}
                  </Badge>
                ) : (
                  <p className="text-lg font-bold text-foreground">{item.value}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Allergies & Dietary */}
      {(student.allergies || student.dietary_needs) && (
        <div className="space-y-3 stagger-children">
          {student.allergies && (
            <Card className="border-0 shadow-md card-hover bg-destructive/5 overflow-hidden">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-xs font-bold text-destructive uppercase tracking-wider">Allergies</p>
                  <p className="text-sm text-foreground mt-1">{student.allergies}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {student.dietary_needs && (
            <Card className="border-0 shadow-md card-hover bg-secondary/5 overflow-hidden">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <UtensilsCrossed className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-secondary uppercase tracking-wider">Dietary Needs</p>
                  <p className="text-sm text-foreground mt-1">{student.dietary_needs}</p>
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
