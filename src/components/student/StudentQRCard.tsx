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
    <Card className="rounded-[32px] shadow-2xl border-0 max-w-md w-full">
      <CardContent className="flex flex-col items-center gap-6 p-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-[28px] animate-pulse opacity-10 blur-2xl"></div>
          <div className="bg-white p-6 rounded-[28px] shadow-xl relative">
            <QRCode value={student.student_id} size={240} />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Student ID</p>
          <p className="font-bold text-3xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            {student.student_id}
          </p>
          <p className="text-lg font-semibold mt-4">{student.full_name}</p>
        </div>
      </CardContent>
    </Card>
  );
};
