import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import QRCode from "react-qr-code";

export const StudentQRCard = () => {
  const { user } = useAuth();

  const { data: student, isLoading } = useQuery({
    queryKey: ["student-qr", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("students")
        .select("student_id, full_name")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-md max-w-sm w-full">
        <CardContent className="flex justify-center p-6">
          <Skeleton className="h-48 w-48 rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (!student) {
    return (
      <Card className="border-0 shadow-md max-w-sm w-full">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">No student profile found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg max-w-sm w-full">
      <CardContent className="flex flex-col items-center gap-4 p-6">
        <div className="bg-white p-5 rounded-2xl shadow-inner">
          <QRCode value={student.student_id} size={200} />
        </div>
        <div className="text-center space-y-1">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Student ID</p>
          <p className="font-bold text-2xl text-primary">{student.student_id}</p>
          <p className="text-sm font-medium text-foreground">{student.full_name}</p>
        </div>
      </CardContent>
    </Card>
  );
};
