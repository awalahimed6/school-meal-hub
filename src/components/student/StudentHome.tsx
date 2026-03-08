import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentQRCard } from "./StudentQRCard";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { UtensilsCrossed, Coffee, Soup, TrendingUp, Calendar, Star, Megaphone, ChevronRight, QrCode } from "lucide-react";

type TabType = "home" | "menu" | "history" | "voice" | "profile";

interface StudentHomeProps {
  onNavigate?: (tab: TabType) => void;
}

export const StudentHome = ({ onNavigate }: StudentHomeProps) => {
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const currentDay = format(new Date(), "EEEE");

  const { data: todayMeals, isLoading: loadingToday } = useQuery({
    queryKey: ["student-today-meals", user?.id, today],
    queryFn: async () => {
      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user?.id)
        .single();
      if (!student) return [];
      const { data } = await supabase
        .from("meals")
        .select("meal_type")
        .eq("student_id", student.id)
        .eq("meal_date", today);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: monthlyCount, isLoading: loadingMonth } = useQuery({
    queryKey: ["student-monthly-meals", user?.id, monthStart],
    queryFn: async () => {
      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user?.id)
        .single();
      if (!student) return 0;
      const { count } = await supabase
        .from("meals")
        .select("id", { count: "exact", head: true })
        .eq("student_id", student.id)
        .gte("meal_date", monthStart)
        .lte("meal_date", monthEnd);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: todayMenu } = useQuery({
    queryKey: ["home-today-menu", currentDay],
    queryFn: async () => {
      const { data } = await supabase
        .from("weekly_menu_templates")
        .select("*")
        .eq("day_of_week", currentDay)
        .order("meal_type");
      return data || [];
    },
  });

  const checkedMeals = todayMeals?.map(m => m.meal_type) || [];
  const mealSlots = [
    { type: "breakfast", icon: Coffee, label: "Breakfast", emoji: "🥐" },
    { type: "lunch", icon: UtensilsCrossed, label: "Lunch", emoji: "🍔" },
    { type: "dinner", icon: Soup, label: "Dinner", emoji: "🍝" },
  ];

  const quickActions = [
    { icon: UtensilsCrossed, label: "Today's Menu", desc: "See what's cooking", tab: "menu" as TabType, color: "bg-primary/10 text-primary" },
    { icon: Star, label: "Rate Meal", desc: "Share your feedback", tab: "history" as TabType, color: "bg-accent/10 text-accent" },
    { icon: Megaphone, label: "Community", desc: "Student voices", tab: "voice" as TabType, color: "bg-secondary/10 text-secondary" },
    { icon: QrCode, label: "My QR Code", desc: "Scan at cafeteria", tab: null, color: "bg-primary/10 text-primary" },
  ];

  const isLoading = loadingToday || loadingMonth;

  if (isLoading) {
    return (
      <div className="space-y-6 pb-24">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-[76px] rounded-3xl shimmer" />
          <Skeleton className="h-[76px] rounded-3xl shimmer" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-28 rounded shimmer" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-[72px] rounded-3xl shimmer" />
            <Skeleton className="h-[72px] rounded-3xl shimmer" />
            <Skeleton className="h-[72px] rounded-3xl shimmer" />
            <Skeleton className="h-[72px] rounded-3xl shimmer" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-28 rounded shimmer" />
          <Skeleton className="h-[120px] rounded-3xl shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 page-enter">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 stagger-children">
        <Card className="border-0 shadow-md overflow-hidden card-hover">
          <CardContent className="p-4 relative">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -translate-y-4 translate-x-4" />
            <div className="flex items-center gap-3 relative">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Today</p>
                <p className="text-2xl font-extrabold text-foreground leading-none mt-0.5">{checkedMeals.length}<span className="text-sm font-medium text-muted-foreground">/3</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md overflow-hidden card-hover">
          <CardContent className="p-4 relative">
            <div className="absolute top-0 right-0 w-16 h-16 bg-accent/5 rounded-full -translate-y-4 translate-x-4" />
            <div className="flex items-center gap-3 relative">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">This Month</p>
                <p className="text-2xl font-extrabold text-foreground leading-none mt-0.5">{monthlyCount ?? 0}<span className="text-sm font-medium text-muted-foreground"> meals</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 animate-slide-down-fade">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3 stagger-children">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={i}
                onClick={() => {
                  if (action.tab && onNavigate) {
                    onNavigate(action.tab);
                  } else if (!action.tab) {
                    document.getElementById("qr-section")?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="text-left group"
              >
                <Card className="border-0 shadow-sm card-hover">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-xl ${action.color} flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-tight">{action.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{action.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 mt-0.5 flex-shrink-0 group-hover:translate-x-1 transition-transform duration-300" />
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's Meal Status */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 animate-slide-down-fade">Today's Meals</h3>
        <Card className="border-0 shadow-md card-hover">
          <CardContent className="p-3">
            <div className="grid grid-cols-3 gap-2">
              {mealSlots.map((meal, idx) => {
                const isChecked = checkedMeals.includes(meal.type as "breakfast" | "lunch" | "dinner");
                const menuItem = todayMenu?.find(m => m.meal_type === meal.type);
                return (
                  <div
                    key={meal.type}
                    className={`text-center p-3 rounded-xl transition-all duration-300 ${
                      isChecked
                        ? "bg-primary/10 ring-1 ring-primary/20 scale-[1.02]"
                        : "bg-muted/50 hover:bg-muted/70"
                    }`}
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <span className="text-2xl block">{meal.emoji}</span>
                    <p className="text-xs font-semibold text-foreground mt-1.5">{meal.label}</p>
                    {isChecked ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary mt-1">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-scale-in" />
                        Done
                      </span>
                    ) : (
                      <span className="inline-block text-[10px] font-medium text-muted-foreground mt-1">Pending</span>
                    )}
                    {menuItem && menuItem.main_dish !== "Not set" && (
                      <p className="text-[9px] text-muted-foreground truncate mt-1">{menuItem.main_dish}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Section */}
      <div id="qr-section">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 animate-slide-down-fade">Your QR Code</h3>
        <div className="flex justify-center">
          <StudentQRCard />
        </div>
      </div>
    </div>
  );
};
