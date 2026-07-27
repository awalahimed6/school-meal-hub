import {
  Users, UserCog, BarChart3, UtensilsCrossed, Clock,
  Home, GraduationCap, PanelLeftOpen, Database
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type AdminSection =
  | "dashboard" | "students" | "staff" | "menu" | "schedules" | "reports" | "backup";

const sidebarItems: { key: AdminSection; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Overview", icon: Home },
  { key: "students", label: "Students", icon: Users },
  { key: "staff", label: "Staff", icon: UserCog },
  { key: "menu", label: "Menu", icon: UtensilsCrossed },
  { key: "schedules", label: "Schedules", icon: Clock },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "backup", label: "Backup", icon: Database },
];

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export { sidebarItems };
export type { AdminSection };

const SidebarInner = ({ activeSection, onSectionChange, collapsed, isMobile }: AdminSidebarProps & { isMobile?: boolean }) => {
  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-[72px] shrink-0 border-b border-sidebar-border">
        <div className="h-10 w-10 rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center shadow-sm shrink-0">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className={`overflow-hidden transition-all duration-300 ${collapsed && !isMobile ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
          <p className="text-sm font-extrabold leading-tight tracking-tight whitespace-nowrap">
            School Meal Hub
          </p>
          <p className="text-[10px] text-sidebar-foreground/60 font-medium tracking-wide uppercase whitespace-nowrap">
            Admin Console
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto">
        <div className={`transition-all duration-300 ${collapsed && !isMobile ? "opacity-0 h-0 mb-0" : "opacity-100 h-auto mb-2"}`}>
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/40 px-3">
            Main Menu
          </p>
        </div>
        <TooltipProvider delayDuration={0}>
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.key;
            const showTooltip = collapsed && !isMobile;
            const btn = (
              <button
                key={item.key}
                onClick={() => onSectionChange(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                  collapsed && !isMobile ? "justify-center" : ""
                } ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className={`truncate transition-all duration-300 ${collapsed && !isMobile ? "w-0 opacity-0 hidden" : "w-auto opacity-100"}`}>
                  {item.label}
                </span>
              </button>
            );

            if (showTooltip) {
              return (
                <Tooltip key={item.key}>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right" className="font-semibold">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return btn;
          })}
        </TooltipProvider>
      </nav>
    </div>
  );
};

export const AdminSidebar = ({ activeSection, onSectionChange, collapsed, onToggleCollapse }: AdminSidebarProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <>
        <button
          onClick={onToggleCollapse}
          className="fixed top-4 left-4 z-50 h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-lg"
          aria-label="Open menu"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>

        <Sheet open={!collapsed} onOpenChange={(open) => { if (!open) onToggleCollapse(); }}>
          <SheetContent side="left" className="p-0 w-72 border-0 [&>button]:hidden">
            <SidebarInner
              activeSection={activeSection}
              onSectionChange={(section) => { onSectionChange(section); onToggleCollapse(); }}
              collapsed={false}
              onToggleCollapse={onToggleCollapse}
              isMobile
            />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      <SidebarInner
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
      />
    </aside>
  );
};
