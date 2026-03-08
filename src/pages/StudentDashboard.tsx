import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { LogOut, Home, UtensilsCrossed, History, User, Megaphone, ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnnouncementBell } from "@/components/student/AnnouncementBell";
import { StudentHome } from "@/components/student/StudentHome";
import { StudentMenuView } from "@/components/student/StudentMenuView";
import { StudentHistoryView } from "@/components/student/StudentHistoryView";
import { StudentProfileView } from "@/components/student/StudentProfileView";
import { StudentVoiceFeed } from "@/components/shared/StudentVoiceFeed";
import { useUnreadVoice } from "@/hooks/useUnreadVoice";
import { SignedAvatar } from "@/components/ui/signed-image";
import { Badge } from "@/components/ui/badge";

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
        {/* Premium Header */}
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-2xl border-b border-border/40">
          <div className="container mx-auto px-4">
            {/* Main header row */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-br from-primary/40 to-accent/40 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
                  <SignedAvatar
                    src={student?.profile_image}
                    className="h-12 w-12 border-2 border-primary/20 ring-2 ring-primary/10 relative"
                    fallback={
                      <span className="text-sm font-bold bg-gradient-to-br from-primary to-secondary text-primary-foreground w-full h-full flex items-center justify-center">
                        {initials}
                      </span>
                    }
                  />
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card ring-1 ring-green-500/30" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{getGreeting()}</p>
                  <h1 className="text-base font-bold text-foreground leading-tight truncate">{firstName}</h1>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                <ThemeToggle />
                <AnnouncementBell />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="rounded-full h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Status strip */}
            {student && (
              <div className="flex items-center gap-2 pb-3 -mt-0.5">
                <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/5 border-primary/20 text-primary">
                  ID: {student.student_id}
                </Badge>
                <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-secondary/5 border-secondary/20 text-secondary">
                  Grade {student.grade}
                </Badge>
                <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                  student.status === 'active' 
                    ? 'bg-green-500/5 border-green-500/20 text-green-600 dark:text-green-400' 
                    : 'bg-destructive/5 border-destructive/20 text-destructive'
                }`}>
                  {student.status === 'active' ? '● Active' : student.status}
                </Badge>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-5 pb-32">
          <div key={activeTab} className="animate-fade-in">
            {activeTab === "home" && <StudentHome />}
            {activeTab === "menu" && <StudentMenuView />}
            {activeTab === "history" && <StudentHistoryView />}
            {activeTab === "voice" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">Community Voice</h2>
                  <p className="text-muted-foreground text-sm mt-1">See what students are saying about meals</p>
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
