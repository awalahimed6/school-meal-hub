import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { UtensilsCrossed, Coffee, Soup } from "lucide-react";

export const StudentMenuView = () => {
  const currentDay = format(new Date(), "EEEE"); // Returns "Monday", "Tuesday", etc.

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

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case "breakfast":
        return <Coffee className="h-6 w-6" />;
      case "lunch":
        return <UtensilsCrossed className="h-6 w-6" />;
      case "dinner":
        return <Soup className="h-6 w-6" />;
      default:
        return <UtensilsCrossed className="h-6 w-6" />;
    }
  };

  const getMealEmoji = (mealType: string) => {
    switch (mealType) {
      case "breakfast":
        return "🥐";
      case "lunch":
        return "🍔";
      case "dinner":
        return "🍝";
      default:
        return "🍽️";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-24">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  const breakfast = menuItems?.find((item) => item.meal_type === "breakfast");
  const lunch = menuItems?.find((item) => item.meal_type === "lunch");
  const dinner = menuItems?.find((item) => item.meal_type === "dinner");

  const renderMealCard = (meal: any, mealType: string) => {
    if (!meal || meal.main_dish === "Not set") return null;

    return (
      <Card className="rounded-xl overflow-hidden shadow-xs border border-border bg-card p-6 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              {getMealIcon(mealType)}
              <span className="text-xs font-semibold uppercase tracking-wider">{mealType}</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground tracking-tight">{meal.main_dish}</h3>
            {meal.description && meal.description !== "Menu not configured yet" && (
              <p className="text-sm text-muted-foreground max-w-md">{meal.description}</p>
            )}
          </div>
          <div className="text-4xl opacity-75">{getMealEmoji(mealType)}</div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Today's Menu</h2>
        <p className="text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
      </div>

      <div className="space-y-4">
        {renderMealCard(breakfast, "breakfast")}
        {renderMealCard(lunch, "lunch")}
        {renderMealCard(dinner, "dinner")}
        
        {(!breakfast || breakfast.main_dish === "Not set") && 
         (!lunch || lunch.main_dish === "Not set") && 
         (!dinner || dinner.main_dish === "Not set") && (
          <Card className="rounded-[32px] p-8 text-center">
            <p className="text-muted-foreground">
              No menu configured for {currentDay} yet. Please check back later.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
