import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { LogOut, Home, UtensilsCrossed, History, User, Megaphone, Settings, Bell } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnnouncementBell } from "@/components/student/AnnouncementBell";
import { StudentHome } from "@/components/student/StudentHome";
import { StudentMenuView } from "@/components/student/StudentMenuView";
import { StudentHistoryView } from "@/components/student/StudentHistoryView";
import { StudentProfileView } from "@/components/student/StudentProfileView";
import { StudentVoiceFeed } from "@/components/shared/StudentVoiceFeed";
import { useUnreadVoice } from "@/hooks/useUnreadVoice";
import { SignedAvatar } from "@/components/ui/signed-image";

type TabType = "home" | "menu" | "history" | "voice" | "profile";

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const isViewingVoice = activeTab === "voice";
  const { unreadCount: unreadVoiceCount, markAsRead: markVoiceAsRead } = useUnreadVoice(isViewingVoice);

  const { data: student } = useQuery({
    queryKey: ["student-header", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("full_name, profile_image, grade, student_id")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);
    if (tabId === "voice") {
      markVoiceAsRead();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const firstName = student?.full_name?.split(" ")[0] || "Student";
  const initials = student?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || "S";

  const navItems = [
    { id: "home" as TabType, icon: Home, label: "Home" },
    { id: "menu" as TabType, icon: UtensilsCrossed, label: "Menu" },
    { id: "history" as TabType, icon: History, label: "History" },
    { id: "voice" as TabType, icon: Megaphone, label: "Voice" },
    { id: "profile" as TabType, icon: User, label: "Profile" },
  ];

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="min-h-screen bg-background">
        {/* Professional Header */}
        <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-3">
            {/* Top row: Profile + Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <SignedAvatar
                    src={student?.profile_image}
                    className="h-11 w-11 border-2 border-primary/30 ring-2 ring-primary/10"
                    fallback={
                      <span className="text-sm font-bold bg-gradient-to-br from-primary to-accent text-primary-foreground w-full h-full flex items-center justify-center">
                        {initials}
                      </span>
                    }
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-card" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{getGreeting()} 👋</p>
                  <h1 className="text-lg font-bold text-foreground leading-tight">{firstName}</h1>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/")}
                  className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground"
                  title="Back to Home"
                >
                  <Home className="h-4 w-4" />
                </Button>
                <ThemeToggle />
                <AnnouncementBell />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="rounded-full h-9 w-9 text-muted-foreground hover:text-destructive"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Info strip */}
            {student && (
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  ID: {student.student_id}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Grade {student.grade}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6 pb-32">
          {activeTab === "home" && <StudentHome />}
          {activeTab === "menu" && <StudentMenuView />}
          {activeTab === "history" && <StudentHistoryView />}
          {activeTab === "voice" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Community Voice</h2>
              <p className="text-muted-foreground text-sm">See what other students are saying about meals and show your support!</p>
              <StudentVoiceFeed showHeader={false} limit={12} />
            </div>
          )}
          {activeTab === "profile" && <StudentProfileView />}
        </main>

        {/* Floating Bottom Navigation */}
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md">
          <div className="bg-card border border-border/50 rounded-[28px] shadow-xl px-4 py-3">
            <div className="flex items-center justify-around">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const showBadge = item.id === "voice" && unreadVoiceCount > 0;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`flex flex-col items-center gap-0.5 transition-all duration-200 ${
                      isActive
                        ? "text-primary scale-105"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div
                      className={`relative p-2.5 rounded-2xl transition-all duration-200 ${
                        isActive
                          ? "bg-primary/10"
                          : "bg-transparent"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {showBadge && (
                        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4.5 w-4.5 min-w-[18px] flex items-center justify-center px-1">
                          {unreadVoiceCount > 9 ? "9+" : unreadVoiceCount}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold ${isActive ? "text-primary" : ""}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </div>
    </ProtectedRoute>
  );
};

export default StudentDashboard;
