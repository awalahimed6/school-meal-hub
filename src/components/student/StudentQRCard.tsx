import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card>
        <CardHeader>
          <CardTitle>My QR Code</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Skeleton className="h-48 w-48" />
        </CardContent>
      </Card>
    );
  }

  if (!student) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My QR Code</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            No student profile found
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border border-border shadow-sm max-w-md w-full mx-auto">
      <CardContent className="flex flex-col items-center gap-6 p-8">
        <div className="bg-white p-6 rounded-lg border border-border shadow-xs">
          <QRCode value={student.student_id} size={220} />
        </div>
        <div className="text-center space-y-1.5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Student ID</p>
          <p className="font-mono font-bold text-3xl text-foreground">
            {student.student_id}
          </p>
          <p className="text-lg font-semibold text-foreground pt-2">{student.full_name}</p>
        </div>
      </CardContent>
    </Card>
  );
};
