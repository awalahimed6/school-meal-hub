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
  Users, UserCog, BarChart3, UtensilsCrossed,
  GraduationCap, Activity, ArrowUpRight,
} from "lucide-react";
import { StudentManagement } from "@/components/admin/StudentManagement";
import { StaffManagement } from "@/components/admin/StaffManagement";
import { MealReports } from "@/components/admin/MealReports";
import { MenuManager } from "@/components/admin/MenuManager";
import { MealScheduleManager } from "@/components/admin/MealScheduleManager";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { KnowledgeBaseManager } from "@/components/admin/KnowledgeBaseManager";
import { AdminSidebar, sidebarItems } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import type { AdminSection } from "@/components/admin/AdminSidebar";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

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

  const statCards = [
    { label: "Total Students", value: totalStudents, icon: GraduationCap, gradient: "from-secondary to-secondary/80", glow: "shadow-secondary/20" },
    { label: "Meals Today", value: mealsToday, icon: UtensilsCrossed, gradient: "from-[hsl(var(--success))] to-[hsl(142_60%_35%)]", glow: "shadow-[hsl(var(--success))]/20" },
    { label: "Staff Members", value: totalStaff, icon: UserCog, gradient: "from-primary to-primary/80", glow: "shadow-primary/20" },
    { label: "Feedback Today", value: pendingFeedback, icon: BarChart3, gradient: "from-accent to-[hsl(42_80%_45%)]", glow: "shadow-accent/20" },
  ];

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <AdminSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main */}
        <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-[72px]" : "ml-64"}`}>
          <AdminHeader
            activeSection={activeSection}
            userEmail={user?.email}
            onPasswordChange={() => setShowPasswordDialog(true)}
            onSignOut={handleSignOut}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          {/* Password Dialog */}
          <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
            <DialogContent className="rounded-2xl">
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

          {/* Page Content */}
          <main className="p-6">
            <div key={activeSection} className="animate-fade-in">
              {activeSection === "dashboard" && (
                <div className="space-y-8">
                  {/* Greeting */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                        Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"} 👋
                      </h2>
                      <p className="text-sm text-muted-foreground mt-0.5">Here's an overview of your school today</p>
                    </div>
                  </div>

                  {/* Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {statCards.map((stat) => {
                      const Icon = stat.icon;
                      return (
                        <Card key={stat.label} className={`relative overflow-hidden border-0 bg-card hover:shadow-xl ${stat.glow} transition-all duration-300 group rounded-2xl`}>
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                              <div className="space-y-3">
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                <p className="text-4xl font-black text-foreground tracking-tighter">{stat.value}</p>
                              </div>
                              <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg ${stat.glow}`}>
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                            </div>
                          </CardContent>
                          {/* Bottom gradient bar */}
                          <div className={`h-1 bg-gradient-to-r ${stat.gradient}`} />
                        </Card>
                      );
                    })}
                  </div>

                  {/* Quick Access */}
                  <div>
                    <div className="flex items-center gap-2 mb-5">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">Quick Access</h3>
                        <p className="text-[11px] text-muted-foreground">Jump to any section</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {sidebarItems.filter((i) => i.key !== "dashboard").map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.key}
                            onClick={() => setActiveSection(item.key)}
                            className="group flex items-center gap-3.5 p-4 rounded-2xl bg-card border border-border/40 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 text-left"
                          >
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-accent/20 transition-colors shrink-0">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-foreground">{item.label}</p>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
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
