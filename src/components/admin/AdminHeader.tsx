import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminFeedbackBell } from "@/components/admin/AdminFeedbackBell";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Key, LogOut, CalendarDays, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { format } from "date-fns";
import type { AdminSection } from "./AdminSidebar";

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

interface AdminHeaderProps {
  activeSection: AdminSection;
  userEmail?: string;
  onPasswordChange: () => void;
  onSignOut: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export { sectionTitles };

export const AdminHeader = ({ activeSection, userEmail, onPasswordChange, onSignOut, sidebarCollapsed, onToggleSidebar }: AdminHeaderProps) => {
  const current = sectionTitles[activeSection];
  const getInitials = (email: string) => email.substring(0, 2).toUpperCase();
  const today = new Date();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-6 h-[68px] bg-background/70 backdrop-blur-2xl border-b border-border/40">
      {/* Left: Toggle + Title */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        )}
        <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-foreground leading-tight truncate">{current.title}</h1>
        </div>
        <p className="text-xs text-muted-foreground truncate max-w-md">{current.subtitle}</p>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Date pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          <span className="font-medium">{format(today, "EEE, MMM d")}</span>
        </div>

        <ThemeToggle />
        <AdminFeedbackBell />

        <div className="w-px h-7 bg-border/60 mx-1" />

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2.5 h-10 px-2 rounded-xl hover:bg-muted/60">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold leading-tight">Administrator</p>
                <p className="text-[10px] text-muted-foreground leading-tight max-w-[130px] truncate">{userEmail}</p>
              </div>
              <div className="relative">
                <Avatar className="h-9 w-9 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary text-xs font-bold">
                    {userEmail ? getInitials(userEmail) : "AD"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[hsl(var(--success))] border-2 border-background" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 rounded-xl shadow-xl border-border/60" align="end" forceMount>
            <DropdownMenuLabel className="font-normal px-3 py-2.5">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold leading-none">Administrator</p>
                <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onPasswordChange} className="rounded-lg mx-1 px-2.5 py-2 cursor-pointer">
              <Key className="mr-2 h-4 w-4 text-muted-foreground" />
              Change Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut} className="text-destructive rounded-lg mx-1 px-2.5 py-2 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
