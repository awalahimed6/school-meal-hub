import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Check, Calendar, TrendingUp, Coffee, UtensilsCrossed, Soup } from "lucide-react";

export const StudentMealHistory = () => {
  const { user } = useAuth();
  const [limit, setLimit] = useState(30);

  const { data: student } = useQuery({
    queryKey: ["student-for-meals", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: meals, isLoading } = useQuery({
    queryKey: ["student-meals", student?.id, limit],
    queryFn: async () => {
      if (!student) return [];
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("student_id", student.id)
        .order("meal_date", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    enabled: !!student,
  });

  const { data: totalCount } = useQuery({
    queryKey: ["student-meals-count", student?.id],
    queryFn: async () => {
      if (!student) return 0;
      const { count, error } = await supabase
        .from("meals")
        .select("*", { count: "exact", head: true })
        .eq("student_id", student.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!student,
  });

  const stats = meals
    ? {
        totalMeals: meals.length,
        breakfast: meals.filter((m) => m.meal_type === "breakfast").length,
        lunch: meals.filter((m) => m.meal_type === "lunch").length,
        dinner: meals.filter((m) => m.meal_type === "dinner").length,
      }
    : null;

  const groupedByMonth = meals?.reduce((acc, meal) => {
    const monthKey = format(new Date(meal.meal_date), "MMMM yyyy");
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(meal);
    return acc;
  }, {} as Record<string, typeof meals>);

  if (isLoading) {
    return (
      <div className="space-y-3 stagger-children">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-[68px] rounded-2xl shimmer" />
          <Skeleton className="h-[68px] rounded-2xl shimmer" />
        </div>
        <Skeleton className="h-[200px] rounded-2xl shimmer" />
      </div>
    );
  }

  if (!meals || meals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center">
        <span className="text-3xl block mb-2">📋</span>
        <p className="text-muted-foreground font-medium">No meal records found</p>
      </div>
    );
  }

  const statItems = [
    { label: "Total", value: stats?.totalMeals, icon: TrendingUp, color: "text-primary", bg: "from-primary/10 to-primary/5" },
    { label: "Breakfast", value: stats?.breakfast, icon: Coffee, color: "text-accent", bg: "from-accent/10 to-accent/5" },
    { label: "Lunch", value: stats?.lunch, icon: UtensilsCrossed, color: "text-secondary", bg: "from-secondary/10 to-secondary/5" },
    { label: "Dinner", value: stats?.dinner, icon: Soup, color: "text-primary", bg: "from-primary/10 to-accent/5" },
  ];

  return (
    <div className="space-y-4">
      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 stagger-children">
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className={`p-3 border-0 shadow-sm bg-gradient-to-br ${item.bg}`}>
                <div className="text-center">
                  <Icon className={`h-3.5 w-3.5 mx-auto ${item.color} mb-1`} />
                  <p className="text-lg font-extrabold text-foreground leading-none">{item.value}</p>
                  <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">{item.label}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* History */}
      <ScrollArea className="h-[400px] rounded-2xl border border-border/50">
        <div className="p-4 space-y-5">
          {groupedByMonth &&
            Object.entries(groupedByMonth).map(([month, monthMeals]) => {
              const dailyMeals = monthMeals.reduce((acc, meal) => {
                const date = meal.meal_date;
                if (!acc.has(date)) acc.set(date, []);
                acc.get(date)?.push(meal);
                return acc;
              }, new Map<string, typeof monthMeals>());

              return (
                <div key={month}>
                  <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10 border-b border-border/30 pb-2">
                    <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-3 w-3 text-primary" />
                    </div>
                    <h3 className="font-bold text-sm">{month}</h3>
                    <span className="text-[10px] text-muted-foreground font-semibold bg-muted/60 px-2 py-0.5 rounded-full">
                      {monthMeals.length} meals
                    </span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/30">
                        <TableHead className="text-[11px] font-bold">Date</TableHead>
                        <TableHead className="text-center text-[11px] font-bold">🥐</TableHead>
                        <TableHead className="text-center text-[11px] font-bold">🍔</TableHead>
                        <TableHead className="text-center text-[11px] font-bold">🍝</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from(dailyMeals).map(([date, dayMeals]) => (
                        <TableRow key={date} className="border-border/20 hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium text-xs py-2.5">
                            {format(new Date(date), "EEE, MMM d")}
                          </TableCell>
                          <TableCell className="text-center py-2.5">
                            {dayMeals.some((m) => m.meal_type === "breakfast") && (
                              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                <Check className="h-3 w-3 text-primary" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center py-2.5">
                            {dayMeals.some((m) => m.meal_type === "lunch") && (
                              <div className="h-5 w-5 rounded-full bg-secondary/10 flex items-center justify-center mx-auto">
                                <Check className="h-3 w-3 text-secondary" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center py-2.5">
                            {dayMeals.some((m) => m.meal_type === "dinner") && (
                              <div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                                <Check className="h-3 w-3 text-accent" />
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
            })}
        </div>
      </ScrollArea>

      {/* Load More */}
      {totalCount && limit < totalCount && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setLimit((prev) => prev + 30)}
            className="w-full rounded-xl"
          >
            Load More ({totalCount - limit} remaining)
          </Button>
        </div>
      )}
    </div>
  );
};
