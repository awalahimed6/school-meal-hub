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
  UserCog, BarChart3, UtensilsCrossed,
  GraduationCap, Activity, ArrowUpRight,
} from "lucide-react";
import { StudentManagement } from "@/components/admin/StudentManagement";
import { StaffManagement } from "@/components/admin/StaffManagement";
import { MealReports } from "@/components/admin/MealReports";
import { MenuManager } from "@/components/admin/MenuManager";
import { MealScheduleManager } from "@/components/admin/MealScheduleManager";
import Backup from "@/pages/Backup";
import { AdminSidebar, sidebarItems } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import type { AdminSection } from "@/components/admin/AdminSidebar";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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
      const { count } = await supabase.from("students").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: mealsToday = 0 } = useQuery({
    queryKey: ["admin-stat-meals-today", today],
    queryFn: async () => {
      const { count } = await supabase.from("meals").select("*", { count: "exact", head: true }).eq("meal_date", today);
      return count || 0;
    },
  });

  const { data: totalStaff = 0 } = useQuery({
    queryKey: ["admin-stat-staff"],
    queryFn: async () => {
      const { count } = await supabase.from("staff").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: pendingFeedback = 0 } = useQuery({
    queryKey: ["admin-stat-feedback-today", today],
    queryFn: async () => {
      const { count } = await supabase.from("meal_ratings").select("*", { count: "exact", head: true }).gte("created_at", `${today}T00:00:00`);
      return count || 0;
    },
  });

  const handleSignOut = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
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
    { label: "Total Students", value: totalStudents, icon: GraduationCap },
    { label: "Meals Today", value: mealsToday, icon: UtensilsCrossed },
    { label: "Staff Members", value: totalStaff, icon: UserCog },
    { label: "Feedback Today", value: pendingFeedback, icon: BarChart3 },
  ];

  const desktopMargin = sidebarCollapsed ? "md:ml-[72px]" : "md:ml-64";

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-background">
        <AdminSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          collapsed={isMobile ? sidebarCollapsed : sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className={`transition-all duration-300 ${desktopMargin}`}>
          <AdminHeader
            activeSection={activeSection}
            userEmail={user?.email}
            onPasswordChange={() => setShowPasswordDialog(true)}
            onSignOut={handleSignOut}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>Enter your new password below. Minimum 8 characters.</DialogDescription>
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

          <main className="p-4 md:p-6">
            <div key={activeSection} className="animate-fade-in">
              {activeSection === "dashboard" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                      Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"} 👋
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Here's an overview of your school today</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {statCards.map((stat) => {
                      const Icon = stat.icon;
                      return (
                        <Card key={stat.label} className="relative overflow-hidden border border-border bg-card hover:shadow-lg transition-all duration-300 group rounded-2xl">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                              <div className="space-y-3">
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                <p className="text-4xl font-black text-foreground tracking-tighter">{stat.value}</p>
                              </div>
                              <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-sm">
                                <Icon className="h-5 w-5" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {sidebarItems.filter(i => i.key !== "dashboard").map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.key}
                            onClick={() => setActiveSection(item.key)}
                            className="group relative overflow-hidden rounded-2xl border border-border bg-card hover:bg-accent hover:border-primary/40 p-4 text-left transition-all duration-200"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <Icon className="h-5 w-5" />
                              </div>
                              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </div>
                            <p className="text-sm font-bold text-foreground">{item.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "students" && <StudentManagement />}
              {activeSection === "staff" && <StaffManagement />}
              {activeSection === "menu" && <MenuManager />}
              {activeSection === "schedules" && <MealScheduleManager />}
              {activeSection === "reports" && <MealReports />}
              {activeSection === "backup" && <Backup />}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
