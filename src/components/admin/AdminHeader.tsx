import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Key, LogOut, PanelLeftClose, PanelLeftOpen, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AdminSection } from "./AdminSidebar";

const sectionTitles: Record<AdminSection, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard Overview", subtitle: "Welcome back, here's what's happening today" },
  students: { title: "Student Management", subtitle: "Add, update, delete, and view student records" },
  staff: { title: "Staff Management", subtitle: "Manage cafeteria staff members and their access" },
  menu: { title: "Menu Manager", subtitle: "Manage weekly menu items for breakfast, lunch, and dinner" },
  schedules: { title: "Meal Schedules", subtitle: "Set serving times for breakfast, lunch, and dinner" },
  reports: { title: "Reports & Analytics", subtitle: "View comprehensive meal tracking data" },
  backup: { title: "Data Backup", subtitle: "Export database backup JSON files" },
};

interface AdminHeaderProps {
  activeSection: AdminSection;
  userEmail?: string;
  onPasswordChange: () => void;
  onSignOut: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export const AdminHeader = ({
  activeSection, userEmail, onPasswordChange, onSignOut,
  sidebarCollapsed, onToggleSidebar,
}: AdminHeaderProps) => {
  const navigate = useNavigate();
  const info = sectionTitles[activeSection] || sectionTitles.dashboard;
  const initials = userEmail ? userEmail.substring(0, 2).toUpperCase() : "AD";

  return (
    <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="hidden md:inline-flex rounded-lg"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>
          <div className="pl-10 md:pl-0">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">{info.title}</h1>
            <p className="text-xs text-muted-foreground">{info.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-lg" title="Home">
            <Home className="h-5 w-5" />
          </Button>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Administrator</p>
                  <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onPasswordChange}>
                <Key className="mr-2 h-4 w-4" />
                Change Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
