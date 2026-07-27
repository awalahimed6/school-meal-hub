import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCog,
  BarChart3,
  LogOut,
  UtensilsCrossed,
  Clock,
  Home,
  Key,
  Database,
  Menu as MenuIcon,
  X,
  Utensils,
  ShieldCheck
} from "lucide-react";
import { StudentManagement } from "@/components/admin/StudentManagement";
import { StaffManagement } from "@/components/admin/StaffManagement";
import { MealReports } from "@/components/admin/MealReports";
import { MenuManager } from "@/components/admin/MenuManager";
import { MealScheduleManager } from "@/components/admin/MealScheduleManager";
import Backup from "@/pages/Backup";
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
import { supabase } from "@/integrations/supabase/client";

type AdminTab = "students" | "staff" | "reports" | "menu" | "schedules" | "backup";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>("students");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

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

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const navItems = [
    { id: "students" as AdminTab, label: "Students", icon: Users, description: "Manage student profiles and records" },
    { id: "staff" as AdminTab, label: "Staff", icon: UserCog, description: "Cafeteria staff members" },
    { id: "reports" as AdminTab, label: "Reports & Analytics", icon: BarChart3, description: "Meal statistics and attendance" },
    { id: "menu" as AdminTab, label: "Menu Manager", icon: UtensilsCrossed, description: "Weekly breakfast, lunch, and dinner menus" },
    { id: "schedules" as AdminTab, label: "Meal Schedules", icon: Clock, description: "Configure serving time windows" },
    { id: "backup" as AdminTab, label: "Data Backup", icon: Database, description: "Export database backup JSON files" },
  ];

  const currentNav = navItems.find((item) => item.id === activeTab) || navItems[0];

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-card border-r border-border/80">
          {/* Brand Header */}
          <div className="p-6 border-b border-border/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                <Utensils className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-base tracking-tight leading-none">School Meal Hub</h2>
                <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mt-1">
                  <ShieldCheck className="h-3 w-3 text-primary" /> Admin Portal
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Management
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-border/80 bg-card/50 space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    {user?.email ? getInitials(user.email) : "AD"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate leading-tight">{user?.email}</p>
                  <span className="text-[10px] text-muted-foreground">Administrator</span>
                </div>
              </div>
              <ThemeToggle />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5"
                onClick={() => setShowPasswordDialog(true)}
              >
                <Key className="h-3.5 w-3.5" />
                Password
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs text-destructive hover:bg-destructive/10 gap-1.5"
                onClick={handleSignOut}
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* MOBILE HEADER */}
        <header className="md:hidden sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                <Utensils className="h-4 w-4" />
              </div>
              <span className="font-bold text-sm">Admin Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                      {user?.email ? getInitials(user.email) : "AD"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">Administrator</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowPasswordDialog(true)}>
                  <Key className="mr-2 h-4 w-4" /> Change Password
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/")}>
                  <Home className="mr-2 h-4 w-4" /> View Homepage
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* MOBILE MENU DRAWER OVERLAY */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-30 bg-background/80 backdrop-blur-xs flex flex-col pt-16 px-4 pb-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-card text-card-foreground border border-border"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 md:pl-64 min-h-screen flex flex-col">
          {/* Top Bar on Desktop */}
          <div className="hidden md:flex items-center justify-between border-b border-border/80 px-8 py-5 bg-card/40 backdrop-blur-xs sticky top-0 z-30">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{currentNav.label}</h1>
              <p className="text-xs text-muted-foreground">{currentNav.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => navigate("/")} className="gap-2">
                <Home className="h-4 w-4" /> View Site
              </Button>
            </div>
          </div>

          {/* Section View Content */}
          <div className="p-4 md:p-8 flex-1">
            {activeTab === "students" && (
              <Card className="border border-border/80 shadow-xs">
                <CardHeader>
                  <CardTitle>Student Management</CardTitle>
                  <CardDescription>Add, update, delete, and view student records</CardDescription>
                </CardHeader>
                <CardContent>
                  <StudentManagement />
                </CardContent>
              </Card>
            )}

            {activeTab === "staff" && (
              <Card className="border border-border/80 shadow-xs">
                <CardHeader>
                  <CardTitle>Staff Management</CardTitle>
                  <CardDescription>Manage cafeteria staff members and their access</CardDescription>
                </CardHeader>
                <CardContent>
                  <StaffManagement />
                </CardContent>
              </Card>
            )}

            {activeTab === "reports" && (
              <Card className="border border-border/80 shadow-xs">
                <CardHeader>
                  <CardTitle>Meal Statistics & Reports</CardTitle>
                  <CardDescription>View comprehensive meal tracking data and analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <MealReports />
                </CardContent>
              </Card>
            )}

            {activeTab === "menu" && (
              <Card className="border border-border/80 shadow-xs">
                <CardHeader>
                  <CardTitle>Menu Manager</CardTitle>
                  <CardDescription>Manage weekly menu items for breakfast, lunch, and dinner</CardDescription>
                </CardHeader>
                <CardContent>
                  <MenuManager />
                </CardContent>
              </Card>
            )}

            {activeTab === "schedules" && (
              <Card className="border border-border/80 shadow-xs">
                <CardHeader>
                  <CardTitle>Meal Schedule Configuration</CardTitle>
                  <CardDescription>Set serving times for breakfast, lunch, and dinner</CardDescription>
                </CardHeader>
                <CardContent>
                  <MealScheduleManager />
                </CardContent>
              </Card>
            )}

            {activeTab === "backup" && (
              <Card className="border border-border/80 shadow-xs">
                <CardContent className="pt-6">
                  <Backup />
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        {/* PASSWORD CHANGE DIALOG */}
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
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
