import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Coffee, UtensilsCrossed, Soup, ChefHat, Sparkles, CheckCircle2 } from "lucide-react";

type MealType = "breakfast" | "lunch" | "dinner";
type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT: Record<DayOfWeek, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu",
  Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};

const mealConfig: Record<MealType, { icon: typeof Coffee; gradient: string; glow: string; label: string; time: string }> = {
  breakfast: {
    icon: Coffee,
    gradient: "from-amber-500 to-orange-500",
    glow: "shadow-amber-500/20",
    label: "Breakfast",
    time: "7:00 – 9:00 AM",
  },
  lunch: {
    icon: UtensilsCrossed,
    gradient: "from-emerald-500 to-teal-500",
    glow: "shadow-emerald-500/20",
    label: "Lunch",
    time: "12:00 – 2:00 PM",
  },
  dinner: {
    icon: Soup,
    gradient: "from-violet-500 to-purple-500",
    glow: "shadow-violet-500/20",
    label: "Dinner",
    time: "6:00 – 8:00 PM",
  },
};

export function MenuManager() {
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(() => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" }) as DayOfWeek;
    return DAYS.includes(today) ? today : "Monday";
  });

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

  const updateMutation = useMutation({
    mutationFn: async ({ day, mealType, mainDish, description }: {
      day: DayOfWeek; mealType: MealType; mainDish: string; description: string;
    }) => {
      const { error } = await supabase
        .from("weekly_menu_templates")
        .update({ main_dish: mainDish.trim(), description: description.trim() })
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

  const MealCard = ({ day, mealType }: { day: DayOfWeek; mealType: MealType }) => {
    const template = menuTemplates?.find(t => t.day_of_week === day && t.meal_type === mealType);
    const [mainDish, setMainDish] = useState(template?.main_dish || "");
    const [description, setDescription] = useState(template?.description || "");
    const config = mealConfig[mealType];
    const Icon = config.icon;

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

    const hasContent = !!template?.main_dish;

    return (
      <div className="group relative rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-border">
        {/* Top accent bar */}
        <div className={`h-1 bg-gradient-to-r ${config.gradient}`} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${config.gradient} shadow-lg ${config.glow}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">{config.label}</h4>
              <p className="text-[11px] text-muted-foreground">{config.time}</p>
            </div>
          </div>
          {hasContent && (
            <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Set</span>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="px-5 pb-5 space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor={`${day}-${mealType}-main`} className="text-xs font-medium text-muted-foreground">
              Main Dish
            </Label>
            <Input
              id={`${day}-${mealType}-main`}
              placeholder="e.g., Scrambled Eggs, Rice & Chicken"
              value={mainDish}
              onChange={(e) => setMainDish(e.target.value)}
              className="h-9 rounded-xl bg-muted/50 border-border/50 text-sm focus:bg-background transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${day}-${mealType}-desc`} className="text-xs font-medium text-muted-foreground">
              Description
            </Label>
            <Textarea
              id={`${day}-${mealType}-desc`}
              placeholder="With bread and tea, Fresh fruit included..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="rounded-xl bg-muted/50 border-border/50 text-sm resize-none focus:bg-background transition-colors"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            size="sm"
            type="button"
            className={`w-full rounded-xl bg-gradient-to-r ${config.gradient} text-white shadow-lg ${config.glow} hover:opacity-90 transition-opacity`}
          >
            <Save className="mr-2 h-3.5 w-3.5" />
            Save {config.label}
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading menu templates...</p>
      </div>
    );
  }

  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(42_90%_58%)] to-[hsl(24_95%_50%)] shadow-lg shadow-[hsl(42_80%_50%/0.3)]">
            <ChefHat className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Weekly Menu</h2>
            <p className="text-sm text-muted-foreground">Configure meals that repeat every week</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-muted/60 px-4 py-2">
          <Sparkles className="h-4 w-4 text-[hsl(42_80%_55%)]" />
          <span className="text-xs font-medium text-muted-foreground">
            Auto-repeats weekly · Students see today's menu
          </span>
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {DAYS.map((day) => {
          const isSelected = selectedDay === day;
          const isToday = day === todayName;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0 ${
                isSelected
                  ? "bg-gradient-to-br from-[hsl(42_90%_55%)] to-[hsl(24_90%_50%)] text-white shadow-lg shadow-[hsl(42_80%_50%/0.3)]"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider opacity-70">{DAY_SHORT[day]}</span>
              <span>{day.slice(0, 3)}</span>
              {isToday && !isSelected && (
                <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[hsl(42_90%_55%)] ring-2 ring-background" />
              )}
            </button>
          );
        })}
      </div>

      {/* Day Title */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border/50" />
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
          {selectedDay}{selectedDay === todayName ? " — Today" : ""}
        </h3>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      {/* Meal Cards Grid */}
      <div className="grid gap-5 md:grid-cols-3">
        <MealCard key={`${selectedDay}-breakfast`} day={selectedDay} mealType="breakfast" />
        <MealCard key={`${selectedDay}-lunch`} day={selectedDay} mealType="lunch" />
        <MealCard key={`${selectedDay}-dinner`} day={selectedDay} mealType="dinner" />
      </div>
    </div>
  );
}
