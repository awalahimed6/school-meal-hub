import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Coffee, UtensilsCrossed, Soup } from "lucide-react";

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
      <div className="space-y-4 pb-24">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  const meals = [
    { type: "breakfast", label: "Breakfast", icon: Coffee, emoji: "🥐", gradient: "from-primary/10 to-accent/10", iconBg: "bg-primary/10", iconColor: "text-primary" },
    { type: "lunch", label: "Lunch", icon: UtensilsCrossed, emoji: "🍔", gradient: "from-secondary/10 to-primary/10", iconBg: "bg-secondary/10", iconColor: "text-secondary" },
    { type: "dinner", label: "Dinner", icon: Soup, emoji: "🍝", gradient: "from-accent/10 to-secondary/10", iconBg: "bg-accent/10", iconColor: "text-accent" },
  ];

  const hasAnyMenu = meals.some(m => {
    const item = menuItems?.find(i => i.meal_type === m.type);
    return item && item.main_dish !== "Not set";
  });

  return (
    <div className="space-y-5 pb-24">
      <div>
        <h2 className="text-xl font-bold text-foreground">Today's Menu</h2>
        <p className="text-sm text-muted-foreground mt-1">{format(new Date(), "EEEE, MMMM d")}</p>
      </div>

      <div className="space-y-3">
        {meals.map((meal) => {
          const item = menuItems?.find(i => i.meal_type === meal.type);
          const hasContent = item && item.main_dish !== "Not set";
          const Icon = meal.icon;

          return (
            <Card key={meal.type} className="border-0 shadow-md overflow-hidden">
              <CardContent className={`p-0`}>
                <div className={`flex items-start gap-4 p-4 bg-gradient-to-r ${meal.gradient}`}>
                  <div className={`h-12 w-12 rounded-xl ${meal.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-2xl">{meal.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-3.5 w-3.5 ${meal.iconColor}`} />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{meal.label}</span>
                    </div>
                    {hasContent ? (
                      <>
                        <p className="text-base font-bold text-foreground">{item.main_dish}</p>
                        {item.description && item.description !== "Menu not configured yet" && (
                          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Not available</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {!hasAnyMenu && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground text-sm">No menu configured for {currentDay} yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
