import { 
  Users, UserCog, BarChart3, UtensilsCrossed, Clock,
  Home, ImageIcon, HelpCircle,
  GraduationCap, Sparkles, PanelLeftOpen,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type AdminSection =
  | "dashboard" | "students" | "staff" | "menu"
  | "schedules" | "gallery" | "knowledge" | "reports";

const sidebarItems: { key: AdminSection; label: string; icon: React.ElementType; badge?: string }[] = [
  { key: "dashboard", label: "Overview", icon: Home },
  { key: "students", label: "Students", icon: Users },
  { key: "staff", label: "Staff", icon: UserCog },
  { key: "menu", label: "Menu", icon: UtensilsCrossed },
  { key: "schedules", label: "Schedules", icon: Clock },
  { key: "gallery", label: "Gallery", icon: ImageIcon },
  { key: "knowledge", label: "FAQs", icon: HelpCircle },
  { key: "reports", label: "Reports", icon: BarChart3 },
];

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export { sidebarItems };
export type { AdminSection };

const SidebarInner = ({ activeSection, onSectionChange, collapsed, onToggleCollapse, isMobile }: AdminSidebarProps & { isMobile?: boolean }) => {
  return (
    <div className="flex flex-col h-full">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220_16%_18%)] via-[hsl(220_14%_15%)] to-[hsl(220_12%_12%)]" />
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(42_50%_50%/0.06)] via-transparent to-[hsl(42_50%_40%/0.03)]" />
      {/* Gold edge line */}
      {!isMobile && (
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-[hsl(42_80%_60%/0.4)] via-[hsl(42_70%_50%/0.15)] to-[hsl(42_60%_40%/0.3)]" />
      )}

      {/* ─── Logo Area ─── */}
      <div className="relative flex items-center gap-3 px-4 h-[72px] shrink-0">
        <div className="relative group cursor-pointer">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-[hsl(42_90%_60%)] to-[hsl(24_95%_50%)] opacity-60 blur-sm group-hover:opacity-80 transition-opacity" />
          <div className="relative h-10 w-10 rounded-2xl bg-gradient-to-br from-[hsl(42_90%_58%)] to-[hsl(24_95%_50%)] flex items-center justify-center shadow-lg">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className={`overflow-hidden transition-all duration-300 ${collapsed && !isMobile ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-extrabold leading-tight tracking-tight bg-gradient-to-r from-[hsl(42_90%_75%)] via-[hsl(42_85%_65%)] to-[hsl(24_90%_60%)] bg-clip-text text-transparent whitespace-nowrap">
              Ifa Boru
            </p>
            <Sparkles className="h-3 w-3 text-[hsl(42_80%_60%)]" />
          </div>
          <p className="text-[10px] text-white/35 font-medium tracking-wide uppercase whitespace-nowrap">Admin Console</p>
        </div>
      </div>

      {/* ─── Separator ─── */}
      <div className="relative mx-3 h-px">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(42_60%_50%/0.3)] to-transparent" />
      </div>

      {/* ─── Navigation ─── */}
      <nav className="relative flex-1 py-4 px-2.5 space-y-1 overflow-y-auto scrollbar-none">
        <div className={`transition-all duration-300 ${collapsed && !isMobile ? "opacity-0 h-0 mb-0" : "opacity-100 h-auto mb-3"}`}>
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/25 px-3">
            Main Menu
          </p>
        </div>
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSectionChange(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group relative ${
                collapsed && !isMobile ? "justify-center" : ""
              } ${
                isActive
                  ? "text-white"
                  : "text-white/45 hover:text-white/75 hover:bg-white/[0.04]"
              }`}
              title={collapsed && !isMobile ? item.label : undefined}
            >
              {/* Active background */}
              {isActive && (
                <>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[hsl(42_85%_52%)] to-[hsl(24_90%_50%)] opacity-90" />
                  <div className="absolute inset-0 rounded-xl shadow-[0_4px_20px_-4px_hsl(42_80%_50%/0.5)]" />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/15 to-transparent" style={{ height: '50%' }} />
                </>
              )}
              
              {/* Active indicator bar */}
              {isActive && !isMobile && (
                <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-[hsl(42_90%_65%)] shadow-[0_0_8px_hsl(42_90%_60%/0.6)]" />
              )}

              <Icon className={`relative h-[18px] w-[18px] shrink-0 transition-all duration-200 ${
                isActive ? "drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]" : "group-hover:scale-110"
              }`} />
              <span className={`relative truncate transition-all duration-300 ${collapsed && !isMobile ? "w-0 opacity-0 hidden" : "w-auto opacity-100"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ─── Bottom Section ─── */}
      <div className="relative px-2.5 pb-4 pt-2">
        <div className="mx-1 mb-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </div>
  );
};

export const AdminSidebar = ({ activeSection, onSectionChange, collapsed, onToggleCollapse }: AdminSidebarProps) => {
  const isMobile = useIsMobile();

  // Mobile: use Sheet drawer
  if (isMobile) {
    return (
      <>
        {/* Floating toggle button */}
        <button
          onClick={onToggleCollapse}
          className="fixed top-4 left-4 z-50 h-10 w-10 rounded-xl bg-gradient-to-br from-[hsl(220_16%_22%)] to-[hsl(220_14%_16%)] border border-white/10 flex items-center justify-center shadow-lg shadow-black/30 hover:shadow-xl hover:border-[hsl(42_60%_50%/0.3)] transition-all duration-200 group"
          aria-label="Open menu"
        >
          <PanelLeftOpen className="h-4 w-4 text-white/60 group-hover:text-[hsl(42_80%_65%)] transition-colors" />
        </button>

        <Sheet open={!collapsed} onOpenChange={(open) => { if (!open) onToggleCollapse(); }}>
          <SheetContent side="left" className="p-0 w-72 border-0 bg-transparent [&>button]:hidden">
            <div className="relative h-full">
              <SidebarInner
                activeSection={activeSection}
                onSectionChange={(section) => { onSectionChange(section); onToggleCollapse(); }}
                collapsed={false}
                onToggleCollapse={onToggleCollapse}
                isMobile
              />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop: fixed sidebar
  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen flex flex-col overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
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
