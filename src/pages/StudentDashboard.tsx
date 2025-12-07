import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { LogOut, Home, UtensilsCrossed, History, User, Megaphone } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnnouncementBell } from "@/components/student/AnnouncementBell";
import { StudentHome } from "@/components/student/StudentHome";
import { StudentMenuView } from "@/components/student/StudentMenuView";
import { StudentHistoryView } from "@/components/student/StudentHistoryView";
import { StudentProfileView } from "@/components/student/StudentProfileView";
import { StudentVoiceFeed } from "@/components/shared/StudentVoiceFeed";

type TabType = "home" | "menu" | "history" | "voice" | "profile";

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("home");

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
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Student Portal
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full" title="Back to Home">
                <Home className="h-5 w-5" />
              </Button>
              <ThemeToggle />
              <AnnouncementBell />
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-full">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
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
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
          <div className="bg-gray-900 rounded-[32px] shadow-2xl px-6 py-4">
            <div className="flex items-center justify-around">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                      isActive
                        ? "text-white scale-110"
                        : "text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl transition-all duration-200 ${
                        isActive
                          ? "bg-primary"
                          : "bg-transparent"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium">{item.label}</span>
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
