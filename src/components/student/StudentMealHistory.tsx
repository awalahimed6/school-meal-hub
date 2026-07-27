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
import { Check, Calendar, TrendingUp } from "lucide-react";

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
        .maybeSingle();

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

  // Calculate statistics
  const stats = meals
    ? {
        totalMeals: meals.length,
        breakfast: meals.filter((m) => m.meal_type === "breakfast").length,
        lunch: meals.filter((m) => m.meal_type === "lunch").length,
        dinner: meals.filter((m) => m.meal_type === "dinner").length,
      }
    : null;

  // Group meals by month
  const groupedByMonth = meals?.reduce((acc, meal) => {
    const monthKey = format(new Date(meal.meal_date), "MMMM yyyy");
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(meal);
    return acc;
  }, {} as Record<string, typeof meals>);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!meals || meals.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-muted-foreground">No meal records found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Meals</p>
                <p className="text-2xl font-bold">{stats.totalMeals}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-border/80 shadow-xs">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Breakfast</p>
              <p className="text-2xl font-bold text-foreground">{stats.breakfast}</p>
            </div>
          </Card>
          <Card className="p-4 border border-border/80 shadow-xs">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Lunch</p>
              <p className="text-2xl font-bold text-foreground">{stats.lunch}</p>
            </div>
          </Card>
          <Card className="p-4 border border-border/80 shadow-xs">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Dinner</p>
              <p className="text-2xl font-bold text-foreground">{stats.dinner}</p>
            </div>
          </Card>
        </div>
      )}

      {/* History by Month */}
      <ScrollArea className="h-[500px] rounded-md border border-border/80">
        <div className="p-4 space-y-6">
          {groupedByMonth &&
            Object.entries(groupedByMonth).map(([month, monthMeals]) => {
              // Group by date within the month
              const dailyMeals = monthMeals.reduce((acc, meal) => {
                const date = meal.meal_date;
                if (!acc.has(date)) {
                  acc.set(date, []);
                }
                acc.get(date)?.push(meal);
                return acc;
              }, new Map<string, typeof monthMeals>());

              return (
                <div key={month}>
                  <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background py-2 z-10">
                    <Calendar className="h-4 w-4 text-foreground" />
                    <h3 className="font-semibold text-lg tracking-tight">{month}</h3>
                    <span className="text-sm text-muted-foreground">
                      ({monthMeals.length} meals)
                    </span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-center">Breakfast</TableHead>
                        <TableHead className="text-center">Lunch</TableHead>
                        <TableHead className="text-center">Dinner</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from(dailyMeals).map(([date, dayMeals]) => (
                        <TableRow key={date}>
                          <TableCell className="font-medium">
                            {format(new Date(date), "EEE, MMM d")}
                          </TableCell>
                          <TableCell className="text-center">
                            {dayMeals.some((m) => m.meal_type === "breakfast") && (
                              <Check className="h-5 w-5 text-foreground mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {dayMeals.some((m) => m.meal_type === "lunch") && (
                              <Check className="h-5 w-5 text-foreground mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {dayMeals.some((m) => m.meal_type === "dinner") && (
                              <Check className="h-5 w-5 text-foreground mx-auto" />
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

      {/* Load More Button */}
      {totalCount && limit < totalCount && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setLimit((prev) => prev + 30)}
            className="w-full md:w-auto"
          >
            Load More History ({totalCount - limit} remaining)
          </Button>
        </div>
      )}
    </div>
  );
};
