import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Users, UserCog, BarChart3, LogOut, UtensilsCrossed } from "lucide-react";
import { StudentManagement } from "@/components/admin/StudentManagement";
import { StaffManagement } from "@/components/admin/StaffManagement";
import { MealReports } from "@/components/admin/MealReports";
import { MenuManager } from "@/components/admin/MenuManager";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/30">
          <div className="container mx-auto flex items-center justify-between px-4 py-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Admin Dashboard</h1>
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
          <Tabs defaultValue="students" className="space-y-6">
            <TabsList className="grid w-full max-w-3xl grid-cols-4">
              <TabsTrigger value="students">
                <Users className="mr-2 h-4 w-4" />
                Students
              </TabsTrigger>
              <TabsTrigger value="staff">
                <UserCog className="mr-2 h-4 w-4" />
                Staff
              </TabsTrigger>
              <TabsTrigger value="reports">
                <BarChart3 className="mr-2 h-4 w-4" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="menu">
                <UtensilsCrossed className="mr-2 h-4 w-4" />
                Menu
              </TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Student Management</CardTitle>
                  <CardDescription>
                    Add, update, delete, and view student records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StudentManagement />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="staff" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Staff Management</CardTitle>
                  <CardDescription>
                    Manage cafeteria staff members and their access
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StaffManagement />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Meal Statistics & Reports</CardTitle>
                  <CardDescription>
                    View comprehensive meal tracking data and analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MealReports />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="menu" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Menu Manager</CardTitle>
                  <CardDescription>
                    Manage weekly menu items for breakfast, lunch, and dinner
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MenuManager />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
