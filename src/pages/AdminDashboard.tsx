import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, UserCog, BarChart3, LogOut, UtensilsCrossed, Clock,
  Home, Key, ImageIcon, HelpCircle, ChevronLeft, ChevronRight,
  GraduationCap, TrendingUp, Activity, ArrowUpRight,
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

const sidebarItems: { key: AdminSection; label: string; icon: React.ElementType; description: string }[] = [
  { key: "dashboard", label: "Overview", icon: Home, description: "Dashboard home" },
  { key: "students", label: "Students", icon: Users, description: "Manage students" },
  { key: "staff", label: "Staff", icon: UserCog, description: "Manage staff" },
  { key: "menu", label: "Menu", icon: UtensilsCrossed, description: "Weekly menus" },
  { key: "schedules", label: "Schedules", icon: Clock, description: "Meal times" },
  { key: "gallery", label: "Gallery", icon: ImageIcon, description: "Photos & video" },
  { key: "knowledge", label: "FAQs", icon: HelpCircle, description: "Knowledge base" },
  { key: "reports", label: "Reports", icon: BarChart3, description: "Analytics" },
];

const sectionTitles: Record<AdminSection, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard Overview", subtitle: "Welcome back, here's what's happening today" },
  students: { title: "Student Management", subtitle: "Add, update, delete, and view student records" },
  staff: { title: "Staff Management", subtitle: "Manage cafeteria staff members and their access" },
  menu: { title: "Menu Manager", subtitle: "Manage weekly menu items for breakfast, lunch, and dinner" },
  schedules: { title: "Meal Schedules", subtitle: "Set serving times for breakfast, lunch, and dinner" },
  gallery: { title: "Campus Gallery", subtitle: "Upload campus photos and the meal system demo video" },
  knowledge: { title: "Knowledge Base", subtitle: "Manage FAQs for the chatbot and Telegram bot" },
  reports: { title: "Reports & Analytics", subtitle: "View comprehensive meal tracking data and analytics" },
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");

  const { data: totalStudents = 0 } = useQuery({
    queryKey: ["admin-stat-students"],
    queryFn: async () => {
      const { count, error } = await supabase.from("students").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: mealsToday = 0 } = useQuery({
    queryKey: ["admin-stat-meals-today", today],
    queryFn: async () => {
      const { count, error } = await supabase.from("meals").select("*", { count: "exact", head: true }).eq("meal_date", today);
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: totalStaff = 0 } = useQuery({
    queryKey: ["admin-stat-staff"],
    queryFn: async () => {
      const { count, error } = await supabase.from("staff").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: pendingFeedback = 0 } = useQuery({
    queryKey: ["admin-stat-feedback-today", today],
    queryFn: async () => {
      const { count, error } = await supabase.from("meal_ratings").select("*", { count: "exact", head: true }).gte("created_at", `${today}T00:00:00`);
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
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
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
    { label: "Total Students", value: totalStudents, icon: GraduationCap, color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20" },
    { label: "Meals Today", value: mealsToday, icon: UtensilsCrossed, color: "text-[hsl(var(--success))]", bg: "bg-[hsl(var(--success))]/10", border: "border-[hsl(var(--success))]/20" },
    { label: "Staff Members", value: totalStaff, icon: UserCog, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
    { label: "Feedback Today", value: pendingFeedback, icon: BarChart3, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" },
  ];

  const currentSection = sectionTitles[activeSection];

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-background flex">
        {/* ── Sidebar ── */}
        <aside
          className={`fixed top-0 left-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col border-r border-sidebar-border ${
            sidebarCollapsed ? "w-[68px]" : "w-60"
          }`}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
            <div className="h-9 w-9 rounded-xl bg-sidebar-primary/20 flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5 text-sidebar-primary" />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-bold leading-tight truncate tracking-tight">Ifa Boru</p>
                <p className="text-[10px] text-sidebar-foreground/50 truncate">Admin Console</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
            {!sidebarCollapsed && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 px-3 mb-2">
                Navigation
              </p>
            )}
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/30"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "" : "group-hover:scale-110 transition-transform"}`} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  {isActive && !sidebarCollapsed && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary-foreground/80" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Collapse */}
          <div className="border-t border-sidebar-border p-2">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sidebar-foreground/50 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground transition-all text-xs"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : (
                <>
                  <ChevronLeft className="h-4 w-4" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-[68px]" : "ml-60"}`}>
          {/* Top Bar */}
          <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 bg-background/80 backdrop-blur-xl border-b border-border/50">
            <div>
              <h1 className="text-base font-bold text-foreground leading-tight">{currentSection.title}</h1>
              <p className="text-xs text-muted-foreground">{currentSection.subtitle}</p>
            </div>

            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <AdminFeedbackBell />
              
              <div className="w-px h-6 bg-border mx-1.5" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2.5 h-10 px-2.5 rounded-xl">
                    <div className="hidden sm:block text-right">
                      <p className="text-xs font-semibold leading-tight">Administrator</p>
                      <p className="text-[10px] text-muted-foreground leading-tight max-w-[140px] truncate">{user?.email}</p>
                    </div>
                    <Avatar className="h-8 w-8 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {user?.email ? getInitials(user.email) : "AD"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">Administrator</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
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

          {/* Password Dialog */}
          <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>Enter your new password below. Minimum 6 characters.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                </div>
                <Button onClick={handlePasswordChange} disabled={isUpdatingPassword} className="w-full">
                  {isUpdatingPassword ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* ── Page Content ── */}
          <main className="p-6">
            <div key={activeSection} className="animate-fade-in">
              {activeSection === "dashboard" && (
                <div className="space-y-8">
                  {/* Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat) => {
                      const Icon = stat.icon;
                      return (
                        <Card key={stat.label} className={`relative overflow-hidden border ${stat.border} bg-card hover:shadow-lg transition-all duration-300 group`}>
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                                <p className="text-3xl font-extrabold text-foreground tracking-tight">{stat.value}</p>
                              </div>
                              <div className={`h-11 w-11 rounded-2xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                <Icon className={`h-5 w-5 ${stat.color}`} />
                              </div>
                            </div>
                            {/* Decorative bar */}
                            <div className={`absolute bottom-0 left-0 right-0 h-1 ${stat.bg}`} />
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Quick Access */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quick Access</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {sidebarItems.filter((i) => i.key !== "dashboard").map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.key}
                            onClick={() => setActiveSection(item.key)}
                            className="group flex items-center gap-3.5 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 text-left"
                          >
                            <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center group-hover:bg-primary/15 transition-colors shrink-0">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground">{item.label}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{item.description}</p>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "students" && <StudentManagement />}
              {activeSection === "staff" && <StaffManagement />}
              {activeSection === "reports" && <MealReports />}
              {activeSection === "menu" && <MenuManager />}
              {activeSection === "schedules" && <MealScheduleManager />}
              {activeSection === "gallery" && <GalleryManager />}
              {activeSection === "knowledge" && <KnowledgeBaseManager />}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
