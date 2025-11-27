import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Utensils, Calendar, Bell } from "lucide-react";
import { StudentProfile } from "@/components/student/StudentProfile";
import { StudentMealHistory } from "@/components/student/StudentMealHistory";
import { StudentAnnouncements } from "@/components/student/StudentAnnouncements";
import { StudentQRCard } from "@/components/student/StudentQRCard";

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/30">
          <div className="container mx-auto flex items-center justify-between px-4 py-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Student Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Profile */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle>My Profile</CardTitle>
                </div>
                <CardDescription>View your student information</CardDescription>
              </CardHeader>
              <CardContent>
                <StudentProfile />
              </CardContent>
            </Card>

            {/* QR Code */}
            <StudentQRCard />

            {/* Announcements */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-warning" />
                  <CardTitle>Announcements</CardTitle>
                </div>
                <CardDescription>Latest updates from cafeteria staff</CardDescription>
              </CardHeader>
              <CardContent>
                <StudentAnnouncements />
              </CardContent>
            </Card>

            {/* Meal History */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-secondary" />
                  <CardTitle>Meal History</CardTitle>
                </div>
                <CardDescription>Track your meal consumption</CardDescription>
              </CardHeader>
              <CardContent>
                <StudentMealHistory />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default StudentDashboard;
