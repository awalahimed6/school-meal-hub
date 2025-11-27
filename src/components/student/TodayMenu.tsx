import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { UtensilsCrossed } from "lucide-react";

export function TodayMenu() {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: menuItems, isLoading } = useQuery({
    queryKey: ["today-menu", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_menus")
        .select("*")
        .eq("date", today)
        .order("meal_type", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const getMenuItem = (mealType: string) => {
    return menuItems?.find((item) => item.meal_type === mealType);
  };

  return (
    <div className="space-y-4">
      {/* Breakfast */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <UtensilsCrossed className="h-4 w-4 text-secondary" />
          <h3 className="font-semibold">Breakfast</h3>
        </div>
        <div className="bg-muted/50 rounded-xl p-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : getMenuItem("breakfast") ? (
            <p className="text-sm">{getMenuItem("breakfast")?.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No menu available</p>
          )}
        </div>
      </div>

      {/* Lunch */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <UtensilsCrossed className="h-4 w-4 text-secondary" />
          <h3 className="font-semibold">Lunch</h3>
        </div>
        <div className="bg-muted/50 rounded-xl p-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : getMenuItem("lunch") ? (
            <p className="text-sm">{getMenuItem("lunch")?.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No menu available</p>
          )}
        </div>
      </div>

      {/* Dinner */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <UtensilsCrossed className="h-4 w-4 text-secondary" />
          <h3 className="font-semibold">Dinner</h3>
        </div>
        <div className="bg-muted/50 rounded-xl p-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : getMenuItem("dinner") ? (
            <p className="text-sm">{getMenuItem("dinner")?.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No menu available</p>
          )}
        </div>
      </div>
    </div>
  );
}
