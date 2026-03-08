import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Coffee, UtensilsCrossed, Soup, CalendarDays } from "lucide-react";

export const StudentMenuView = () => {
  const currentDay = format(new Date(), "EEEE");

  const { data: menuItems, isLoading } = useQuery({
    queryKey: ["today-menu", currentDay],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_menu_templates")
        .select("*")
        .eq("day_of_week", currentDay)
        .order("meal_type");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-5 pb-24">
        <div className="space-y-2">
          <Skeleton className="h-6 w-36 rounded shimmer" />
          <Skeleton className="h-4 w-48 rounded shimmer" />
        </div>
        <div className="space-y-3 stagger-children">
          <Skeleton className="h-[100px] rounded-3xl shimmer" />
          <Skeleton className="h-[100px] rounded-3xl shimmer" />
          <Skeleton className="h-[100px] rounded-3xl shimmer" />
        </div>
      </div>
    );
  }

  const meals = [
    { type: "breakfast", label: "Breakfast", icon: Coffee, emoji: "🥐", gradient: "from-primary/10 to-accent/5", iconBg: "bg-primary/10", iconColor: "text-primary", time: "7:00 - 9:00 AM" },
    { type: "lunch", label: "Lunch", icon: UtensilsCrossed, emoji: "🍔", gradient: "from-secondary/10 to-primary/5", iconBg: "bg-secondary/10", iconColor: "text-secondary", time: "12:00 - 2:00 PM" },
    { type: "dinner", label: "Dinner", icon: Soup, emoji: "🍝", gradient: "from-accent/10 to-secondary/5", iconBg: "bg-accent/10", iconColor: "text-accent", time: "6:00 - 8:00 PM" },
  ];

  const hasAnyMenu = meals.some(m => {
    const item = menuItems?.find(i => i.meal_type === m.type);
    return item && item.main_dish !== "Not set";
  });

  return (
    <div className="space-y-5 pb-24 page-enter">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
          <CalendarDays className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Today's Menu</h2>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
        </div>
      </div>

      <div className="space-y-3 stagger-children">
        {meals.map((meal) => {
          const item = menuItems?.find(i => i.meal_type === meal.type);
          const hasContent = item && item.main_dish !== "Not set";
          const Icon = meal.icon;

          return (
            <Card key={meal.type} className="border-0 shadow-md overflow-hidden card-hover">
              <CardContent className="p-0">
                <div className={`flex items-start gap-4 p-5 bg-gradient-to-r ${meal.gradient}`}>
                  <div className={`h-14 w-14 rounded-2xl ${meal.iconBg} flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:scale-110`}>
                    <span className="text-3xl">{meal.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-3.5 w-3.5 ${meal.iconColor}`} />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{meal.label}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 font-medium">{meal.time}</span>
                    </div>
                    {hasContent ? (
                      <>
                        <p className="text-base font-bold text-foreground leading-snug">{item.main_dish}</p>
                        {item.description && item.description !== "Menu not configured yet" && (
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{item.description}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Not available yet</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {!hasAnyMenu && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-8 text-center">
              <span className="text-4xl block mb-3">🍽️</span>
              <p className="text-muted-foreground text-sm font-medium">No menu configured for {currentDay} yet.</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Check back later!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
