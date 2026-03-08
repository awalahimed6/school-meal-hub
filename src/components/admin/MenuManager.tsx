import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Coffee, UtensilsCrossed, Soup } from "lucide-react";

type MealType = "breakfast" | "lunch" | "dinner";
type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function MenuManager() {
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("Monday");

  // Fetch all menu templates
  const { data: menuTemplates, isLoading } = useQuery({
    queryKey: ["menu-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_menu_templates")
        .select("*")
        .order("day_of_week");

      if (error) throw error;
      return data || [];
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ 
      day, 
      mealType, 
      mainDish, 
      description 
    }: { 
      day: DayOfWeek; 
      mealType: MealType; 
      mainDish: string; 
      description: string;
    }) => {
      const { error } = await supabase
        .from("weekly_menu_templates")
        .update({ 
          main_dish: mainDish.trim(), 
          description: description.trim() 
        })
        .eq("day_of_week", day)
        .eq("meal_type", mealType);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-templates"] });
      queryClient.invalidateQueries({ queryKey: ["today-menu"] });
      toast.success("Menu updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const getMealIcon = (mealType: MealType) => {
    switch (mealType) {
      case "breakfast":
        return <Coffee className="h-5 w-5" />;
      case "lunch":
        return <UtensilsCrossed className="h-5 w-5" />;
      case "dinner":
        return <Soup className="h-5 w-5" />;
    }
  };

  const getDayMenus = (day: DayOfWeek) => {
    return {
      breakfast: menuTemplates?.find(t => t.day_of_week === day && t.meal_type === "breakfast"),
      lunch: menuTemplates?.find(t => t.day_of_week === day && t.meal_type === "lunch"),
      dinner: menuTemplates?.find(t => t.day_of_week === day && t.meal_type === "dinner"),
    };
  };

  const MealForm = ({ day, mealType }: { day: DayOfWeek; mealType: MealType }) => {
    const template = menuTemplates?.find(
      t => t.day_of_week === day && t.meal_type === mealType
    );
    const [mainDish, setMainDish] = useState(template?.main_dish || "");
    const [description, setDescription] = useState(template?.description || "");

    // Update local state when template or day changes
    useEffect(() => {
      setMainDish(template?.main_dish || "");
      setDescription(template?.description || "");
    }, [template?.main_dish, template?.description, day, mealType]);

    const handleSave = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!mainDish.trim()) {
        toast.error("Please enter a main dish");
        return;
      }
      updateMutation.mutate({ day, mealType, mainDish, description });
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 capitalize">
            {getMealIcon(mealType)}
            {mealType}
          </CardTitle>
          <CardDescription>
            Configure the {mealType} menu for {day}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${day}-${mealType}-main`}>Main Dish</Label>
            <Input
              id={`${day}-${mealType}-main`}
              placeholder="e.g., Scrambled Eggs, Rice & Chicken"
              value={mainDish}
              onChange={(e) => setMainDish(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${day}-${mealType}-desc`}>Description (Optional)</Label>
            <Textarea
              id={`${day}-${mealType}-desc`}
              placeholder="e.g., With bread and tea, Fresh fruit included"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <Button 
            onClick={handleSave}
            disabled={updateMutation.isPending}
            size="sm"
            className="w-full"
            type="button"
          >
            <Save className="mr-2 h-4 w-4" />
            Save {mealType}
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading menu templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          Configure the weekly menu template. These menus will repeat every week automatically. 
          Students will see today's menu based on the current day of the week.
        </p>
      </div>

      <Tabs value={selectedDay} onValueChange={(v) => setSelectedDay(v as DayOfWeek)}>
        <TabsList className="grid grid-cols-7 w-full">
          {DAYS.map((day) => (
            <TabsTrigger key={day} value={day} className="text-xs">
              {day.slice(0, 3)}
            </TabsTrigger>
          ))}
        </TabsList>

        {DAYS.map((day) => (
          <TabsContent key={day} value={day} className="space-y-4 mt-6">
            <h3 className="text-xl font-semibold">{day}'s Menu</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <MealForm key={`${day}-breakfast`} day={day} mealType="breakfast" />
              <MealForm key={`${day}-lunch`} day={day} mealType="lunch" />
              <MealForm key={`${day}-dinner`} day={day} mealType="dinner" />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
