import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { StudentQRCard } from "./StudentQRCard";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { UtensilsCrossed, Coffee, Soup, TrendingUp, Calendar } from "lucide-react";

export const StudentHome = () => {
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const currentDay = format(new Date(), "EEEE");

  // Fetch today's meals count for this student
  const { data: todayMeals } = useQuery({
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

  // Fetch monthly meal count
  const { data: monthlyCount } = useQuery({
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

  // Fetch today's menu
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

  return (
    <div className="space-y-5 pb-24">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Today</p>
              <p className="text-xl font-bold text-foreground">{checkedMeals.length}/3</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">This Month</p>
              <p className="text-xl font-bold text-foreground">{monthlyCount ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Meal Status */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Today's Meals</h3>
        <div className="grid grid-cols-3 gap-2">
          {mealSlots.map((meal) => {
            const isChecked = checkedMeals.includes(meal.type);
            const menuItem = todayMenu?.find(m => m.meal_type === meal.type);
            return (
              <Card key={meal.type} className={`border-0 shadow-sm transition-all ${isChecked ? "ring-2 ring-primary/30 bg-primary/5" : ""}`}>
                <CardContent className="p-3 text-center space-y-1.5">
                  <span className="text-2xl">{meal.emoji}</span>
                  <p className="text-xs font-semibold text-foreground">{meal.label}</p>
                  {isChecked ? (
                    <span className="inline-block text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">✓ Done</span>
                  ) : (
                    <span className="inline-block text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Pending</span>
                  )}
                  {menuItem && menuItem.main_dish !== "Not set" && (
                    <p className="text-[10px] text-muted-foreground truncate mt-1">{menuItem.main_dish}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* QR Code Section */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Your QR Code</h3>
        <div className="flex justify-center">
          <StudentQRCard />
        </div>
      </div>
    </div>
  );
};
