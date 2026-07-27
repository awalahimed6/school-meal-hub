import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { LogOut, Home, UtensilsCrossed, History, User, Megaphone, Utensils } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnnouncementBell } from "@/components/student/AnnouncementBell";
import { StudentHome } from "@/components/student/StudentHome";
import { StudentMenuView } from "@/components/student/StudentMenuView";
import { StudentHistoryView } from "@/components/student/StudentHistoryView";
import { StudentProfileView } from "@/components/student/StudentProfileView";
import { StudentVoiceFeed } from "@/components/shared/StudentVoiceFeed";
import { useUnreadVoice } from "@/hooks/useUnreadVoice";

type TabType = "home" | "menu" | "history" | "voice" | "profile";

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const isViewingVoice = activeTab === "voice";
  const { unreadCount: unreadVoiceCount, markAsRead: markVoiceAsRead } = useUnreadVoice(isViewingVoice);

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

  const navItems = [
    { id: "home" as TabType, icon: Home, label: "Home" },
    { id: "menu" as TabType, icon: UtensilsCrossed, label: "Menu" },
    { id: "history" as TabType, icon: History, label: "History" },
    { id: "voice" as TabType, icon: Megaphone, label: "Voice" },
    { id: "profile" as TabType, icon: User, label: "Profile" },
  ];

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border/80 shadow-xs">
          <div className="container mx-auto flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                <Utensils className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground leading-none">
                  Student Hub
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const showBadge = item.id === "voice" && unreadVoiceCount > 0;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/80"
                    }`}
                  >
                    <div className="relative">
                      <Icon className="h-4 w-4" />
                      {showBadge && (
                        <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                          !
                        </span>
                      )}
                    </div>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full" title="Back to Home">
                <Home className="h-4 w-4" />
              </Button>
              <ThemeToggle />
              <AnnouncementBell />
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-full text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6 flex-1 max-w-4xl pb-28 md:pb-8">
          {activeTab === "home" && <StudentHome />}
          {activeTab === "menu" && <StudentMenuView />}
          {activeTab === "history" && <StudentHistoryView />}
          {activeTab === "voice" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Community Voice</h2>
                <p className="text-muted-foreground text-sm">See what other students are saying about meals and share your feedback!</p>
              </div>
              <StudentVoiceFeed showHeader={false} limit={12} />
            </div>
          )}
          {activeTab === "profile" && <StudentProfileView />}
        </main>

        {/* Floating Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md">
          <div className="bg-card/95 backdrop-blur-xl border border-border/80 rounded-3xl shadow-2xl px-5 py-3">
            <div className="flex items-center justify-around">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const showBadge = item.id === "voice" && unreadVoiceCount > 0;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                      isActive
                        ? "text-foreground font-bold scale-105"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div
                      className={`relative p-2.5 rounded-2xl transition-all duration-200 ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-transparent"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {showBadge && (
                        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-card">
                          {unreadVoiceCount > 9 ? "9+" : unreadVoiceCount}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium">{item.label}</span>
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
