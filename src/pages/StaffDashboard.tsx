import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { LogOut, Search, Utensils, Bell, Home } from "lucide-react";
import { StudentSearch } from "@/components/staff/StudentSearch";
import { AnnouncementManager } from "@/components/staff/AnnouncementManager";
import { QRScanner } from "@/components/staff/QRScanner";
import { useState } from "react";

const StaffDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qrSearchQuery, setQrSearchQuery] = useState("");

  const handleSignOut = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <ProtectedRoute allowedRoles={["staff"]}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/30">
          <div className="container mx-auto flex items-center justify-between px-4 py-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Staff Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigate("/")} title="Back to Home">
                <Home className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* QR Scanner */}
            <Card>
              <CardContent className="pt-6">
                <QRScanner onStudentIdScanned={setQrSearchQuery} />
              </CardContent>
            </Card>

            {/* Student Search & Meal Recording */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  <CardTitle>Student Meal Recording</CardTitle>
                </div>
                <CardDescription>
                  Search for students by ID or scan their QR code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StudentSearch externalSearchQuery={qrSearchQuery} onSearchQueryChange={setQrSearchQuery} />
              </CardContent>
            </Card>

            {/* Announcements */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-warning" />
                  <CardTitle>Announcements</CardTitle>
                </div>
                <CardDescription>
                  Post and manage announcements for students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnnouncementManager />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default StaffDashboard;
