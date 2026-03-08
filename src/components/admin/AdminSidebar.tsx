import { 
  Users, UserCog, BarChart3, UtensilsCrossed, Clock,
  Home, ImageIcon, HelpCircle, ChevronLeft, ChevronRight,
  GraduationCap, Sparkles,
} from "lucide-react";

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

export const AdminSidebar = ({ activeSection, onSectionChange, collapsed, onToggleCollapse }: AdminSidebarProps) => {
  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220_16%_18%)] via-[hsl(220_14%_15%)] to-[hsl(220_12%_12%)]" />
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(42_50%_50%/0.06)] via-transparent to-[hsl(42_50%_40%/0.03)]" />
      {/* Gold edge line */}
      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-[hsl(42_80%_60%/0.4)] via-[hsl(42_70%_50%/0.15)] to-[hsl(42_60%_40%/0.3)]" />

      {/* ─── Logo Area ─── */}
      <div className="relative flex items-center gap-3 px-4 h-[72px] shrink-0">
        <div className="relative group cursor-pointer">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-[hsl(42_90%_60%)] to-[hsl(24_95%_50%)] opacity-60 blur-sm group-hover:opacity-80 transition-opacity" />
          <div className="relative h-10 w-10 rounded-2xl bg-gradient-to-br from-[hsl(42_90%_58%)] to-[hsl(24_95%_50%)] flex items-center justify-center shadow-lg">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-extrabold leading-tight tracking-tight bg-gradient-to-r from-[hsl(42_90%_75%)] via-[hsl(42_85%_65%)] to-[hsl(24_90%_60%)] bg-clip-text text-transparent">
                Ifa Boru
              </p>
              <Sparkles className="h-3 w-3 text-[hsl(42_80%_60%)]" />
            </div>
            <p className="text-[10px] text-white/35 font-medium tracking-wide uppercase">Admin Console</p>
          </div>
        )}
      </div>

      {/* ─── Separator ─── */}
      <div className="relative mx-3 h-px">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(42_60%_50%/0.3)] to-transparent" />
      </div>

      {/* ─── Navigation ─── */}
      <nav className="relative flex-1 py-4 px-2.5 space-y-1 overflow-y-auto scrollbar-none">
        {!collapsed && (
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/25 px-3 mb-3">
            Main Menu
          </p>
        )}
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSectionChange(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group relative ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "text-white"
                  : "text-white/45 hover:text-white/75 hover:bg-white/[0.04]"
              }`}
              title={collapsed ? item.label : undefined}
            >
              {/* Active background */}
              {isActive && (
                <>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[hsl(42_85%_52%)] to-[hsl(24_90%_50%)] opacity-90" />
                  <div className="absolute inset-0 rounded-xl shadow-[0_4px_20px_-4px_hsl(42_80%_50%/0.5)]" />
                  {/* Shine overlay */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/15 to-transparent" style={{ height: '50%' }} />
                </>
              )}
              
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-[hsl(42_90%_65%)] shadow-[0_0_8px_hsl(42_90%_60%/0.6)]" />
              )}

              <Icon className={`relative h-[18px] w-[18px] shrink-0 transition-all duration-200 ${
                isActive ? "drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]" : "group-hover:scale-110"
              }`} />
              {!collapsed && <span className="relative truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* ─── Bottom Section ─── */}
      <div className="relative px-2.5 pb-4 pt-2">
        {/* Separator */}
        <div className="mx-1 mb-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        {/* Collapse button */}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white/30 hover:bg-white/[0.05] hover:text-white/60 transition-all text-xs font-medium"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
