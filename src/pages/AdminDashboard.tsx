import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, UserCog, BarChart3, LogOut, UtensilsCrossed, Clock,
  Home, Key, ImageIcon, HelpCircle, ChevronLeft, ChevronRight,
  GraduationCap, Search,
} from "lucide-react";
import { StudentManagement } from "@/components/admin/StudentManagement";
import { StaffManagement } from "@/components/admin/StaffManagement";
import { MealReports } from "@/components/admin/MealReports";
import { MenuManager } from "@/components/admin/MenuManager";
import { MealScheduleManager } from "@/components/admin/MealScheduleManager";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { KnowledgeBaseManager } from "@/components/admin/KnowledgeBaseManager";
import { AdminFeedbackBell } from "@/components/admin/AdminFeedbackBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

type AdminSection =
  | "dashboard"
  | "students"
  | "staff"
  | "menu"
  | "schedules"
  | "gallery"
  | "knowledge"
  | "reports";

const sidebarItems: { key: AdminSection; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "students", label: "Students", icon: Users },
  { key: "staff", label: "Staff", icon: UserCog },
  { key: "menu", label: "Menu", icon: UtensilsCrossed },
  { key: "schedules", label: "Schedules", icon: Clock },
  { key: "gallery", label: "Gallery", icon: ImageIcon },
  { key: "knowledge", label: "FAQs", icon: HelpCircle },
  { key: "reports", label: "Reports", icon: BarChart3 },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Stats queries
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: totalStudents = 0 } = useQuery({
    queryKey: ["admin-stat-students"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: mealsToday = 0 } = useQuery({
    queryKey: ["admin-stat-meals-today", today],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("meals")
        .select("*", { count: "exact", head: true })
        .eq("meal_date", today);
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: totalStaff = 0 } = useQuery({
    queryKey: ["admin-stat-staff"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("staff")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: pendingFeedback = 0 } = useQuery({
    queryKey: ["admin-stat-feedback-today", today],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("meal_ratings")
        .select("*", { count: "exact", head: true })
        .gte("created_at", `${today}T00:00:00`);
      if (error) throw error;
      return count || 0;
    },
  });

  const handleSignOut = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully");
      setShowPasswordDialog(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const getInitials = (email: string) => email.substring(0, 2).toUpperCase();

  const statCards = [
    {
      label: "Total Students",
      value: totalStudents,
      icon: GraduationCap,
      gradient: "from-[hsl(215,70%,40%)] to-[hsl(215,60%,55%)]",
    },
    {
      label: "Meals Served Today",
      value: mealsToday,
      icon: UtensilsCrossed,
      gradient: "from-[hsl(142,71%,40%)] to-[hsl(142,60%,55%)]",
    },
    {
      label: "Staff Members",
      value: totalStaff,
      icon: UserCog,
      gradient: "from-[hsl(24,95%,50%)] to-[hsl(42,90%,55%)]",
    },
    {
      label: "Feedback Today",
      value: pendingFeedback,
      icon: BarChart3,
      gradient: "from-[hsl(0,70%,55%)] to-[hsl(24,90%,55%)]",
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 z-40 h-screen bg-sidebar-background text-sidebar-foreground transition-all duration-300 flex flex-col ${
            sidebarCollapsed ? "w-16" : "w-56"
          }`}
        >
          {/* Sidebar Header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border min-h-[64px]">
            <GraduationCap className="h-7 w-7 text-sidebar-primary shrink-0" />
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-bold leading-tight truncate">Admin Dashboard</p>
                <p className="text-[10px] text-sidebar-accent-foreground/60 truncate">Meal Management</p>
              </div>
            )}
          </div>

          {/* Nav Items */}
          <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center justify-center py-3 border-t border-sidebar-border hover:bg-sidebar-accent/50 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </aside>

        {/* Main Content */}
        <div
          className={`flex-1 transition-all duration-300 ${
            sidebarCollapsed ? "ml-16" : "ml-56"
          }`}
        >
          {/* Top Header */}
          <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b bg-card/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold capitalize">
                {activeSection === "knowledge" ? "FAQs" : activeSection}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <AdminFeedbackBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-10 px-2">
                    <span className="hidden sm:block text-sm text-muted-foreground max-w-[200px] truncate">
                      {user?.email}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {user?.email ? getInitials(user.email) : "AD"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Administrator</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowPasswordDialog(true)}>
                    <Key className="mr-2 h-4 w-4" />
                    Change Password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Password Change Dialog */}
          <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>
                  Enter your new password below. Password must be at least 6 characters.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                <Button
                  onClick={handlePasswordChange}
                  disabled={isUpdatingPassword}
                  className="w-full"
                >
                  {isUpdatingPassword ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Page Content */}
          <main className="p-6">
            {activeSection === "dashboard" && (
              <div className="space-y-6">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={stat.label}
                        className={`rounded-xl bg-gradient-to-br ${stat.gradient} p-5 text-white shadow-lg`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className="h-5 w-5 opacity-90" />
                          <p className="text-sm font-medium opacity-90">{stat.label}</p>
                        </div>
                        <p className="text-3xl font-bold">{stat.value}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Quick access cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sidebarItems
                    .filter((i) => i.key !== "dashboard")
                    .map((item) => {
                      const Icon = item.icon;
                      return (
                        <Card
                          key={item.key}
                          className="cursor-pointer hover:shadow-md transition-shadow border-border/50"
                          onClick={() => setActiveSection(item.key)}
                        >
                          <CardContent className="flex items-center gap-4 p-5">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">{item.label}</p>
                              <p className="text-xs text-muted-foreground">
                                Manage {item.label.toLowerCase()}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>
            )}

            {activeSection === "students" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Student Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Add, update, delete, and view student records
                    </p>
                  </div>
                </div>
                <StudentManagement />
              </div>
            )}

            {activeSection === "staff" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold">Staff Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage cafeteria staff members and their access
                  </p>
                </div>
                <StaffManagement />
              </div>
            )}

            {activeSection === "reports" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold">Meal Statistics & Reports</h3>
                  <p className="text-sm text-muted-foreground">
                    View comprehensive meal tracking data and analytics
                  </p>
                </div>
                <MealReports />
              </div>
            )}

            {activeSection === "menu" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold">Menu Manager</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage weekly menu items for breakfast, lunch, and dinner
                  </p>
                </div>
                <MenuManager />
              </div>
            )}

            {activeSection === "schedules" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold">Meal Schedule Configuration</h3>
                  <p className="text-sm text-muted-foreground">
                    Set serving times for breakfast, lunch, and dinner
                  </p>
                </div>
                <MealScheduleManager />
              </div>
            )}

            {activeSection === "gallery" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold">Campus Gallery & Video</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload campus photos and the meal system demo video
                  </p>
                </div>
                <GalleryManager />
              </div>
            )}

            {activeSection === "knowledge" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold">Knowledge Base Manager</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage FAQs that the chatbot and Telegram bot use to answer student questions
                  </p>
                </div>
                <KnowledgeBaseManager />
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
