import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { LogOut, Home, UtensilsCrossed, History, User, Megaphone, Sun, Moon, Sparkles } from "lucide-react";
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
        .select("full_name, profile_image, grade, student_id, status")
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

  const getGreetingEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "☀️";
    if (hour < 17) return "🌤️";
    return "🌙";
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
        {/* Premium Gradient Header */}
        <header className="sticky top-0 z-40 overflow-hidden">
          {/* Gradient background layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--accent)/0.3),transparent_60%)]" />
          
          <div className="relative container mx-auto px-4">
            {/* Top actions row */}
            <div className="flex items-center justify-between pt-3 pb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-primary-foreground/70 text-xs font-medium">
                  {getGreetingEmoji()} {getGreeting()}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <ThemeToggle />
                <AnnouncementBell />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="rounded-full h-8 w-8 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  title="Sign Out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Profile row */}
            <div className="flex items-center gap-4 pb-4 pt-1">
              <div className="relative">
                <div className="absolute -inset-1 bg-primary-foreground/20 rounded-full blur-sm" />
                <SignedAvatar
                  src={student?.profile_image}
                  className="h-14 w-14 border-[2.5px] border-primary-foreground/30 relative"
                  fallback={
                    <span className="text-base font-bold bg-primary-foreground/20 text-primary-foreground w-full h-full flex items-center justify-center">
                      {initials}
                    </span>
                  }
                />
                <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-primary-foreground leading-tight truncate">
                  {firstName}
                </h1>
                {student && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-medium text-primary-foreground/60 bg-primary-foreground/10 px-2 py-0.5 rounded-md">
                      ID: {student.student_id}
                    </span>
                    <span className="text-[11px] font-medium text-primary-foreground/60 bg-primary-foreground/10 px-2 py-0.5 rounded-md">
                      Grade {student.grade}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Curved bottom edge */}
          <div className="absolute -bottom-3 left-0 right-0 h-6 bg-background rounded-t-[24px]" />
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-2 pb-32">
          <div key={activeTab} className="page-enter">
            {activeTab === "home" && <StudentHome onNavigate={handleTabClick} />}
            {activeTab === "menu" && <StudentMenuView />}
            {activeTab === "history" && <StudentHistoryView />}
            {activeTab === "voice" && (
              <div className="space-y-4 page-enter">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/10 flex items-center justify-center">
                    <Megaphone className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Community Voice</h2>
                    <p className="text-muted-foreground text-sm">See what students are saying</p>
                  </div>
                </div>
                <StudentVoiceFeed showHeader={false} limit={12} />
              </div>
            )}
            {activeTab === "profile" && <StudentProfileView />}
          </div>
        </main>

        {/* Floating Bottom Navigation */}
        <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
          <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 px-2 py-2">
            <div className="flex items-center justify-around">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const showBadge = item.id === "voice" && unreadVoiceCount > 0;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`relative flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-primary/10 rounded-xl" />
                    )}
                    <div className="relative z-10">
                      <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? "scale-110" : ""}`} />
                      {showBadge && (
                        <span className="absolute -top-1.5 -right-2 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                          {unreadVoiceCount > 9 ? "9+" : unreadVoiceCount}
                        </span>
                      )}
                    </div>
                    <span className={`relative z-10 text-[10px] font-semibold transition-all duration-300 ${
                      isActive ? "text-primary" : ""
                    }`}>
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
