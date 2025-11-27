import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { LogOut, Calendar, UtensilsCrossed } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays } from "date-fns";

const Menu = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  // Get current week's Monday
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  // Fetch menu items for the week
  const { data: menuItems, isLoading } = useQuery({
    queryKey: ["weekly-menu", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const startDate = format(weekStart, "yyyy-MM-dd");
      const endDate = format(addDays(weekStart, 4), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("weekly_menus")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true })
        .order("meal_type", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const getMenuForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return {
      breakfast: menuItems?.find((m) => m.date === dateStr && m.meal_type === "breakfast"),
      lunch: menuItems?.find((m) => m.date === dateStr && m.meal_type === "lunch"),
      dinner: menuItems?.find((m) => m.date === dateStr && m.meal_type === "dinner"),
    };
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "staff", "student"]}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/30">
          <div className="container mx-auto flex items-center justify-between px-4 py-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Weekly Menu
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <Tabs defaultValue="monday" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              {weekDays.map((day, index) => (
                <TabsTrigger key={index} value={format(day, "EEEE").toLowerCase()}>
                  {format(day, "EEE")}
                </TabsTrigger>
              ))}
            </TabsList>

            {weekDays.map((day, index) => {
              const dayName = format(day, "EEEE").toLowerCase();
              const menu = getMenuForDay(day);

              return (
                <TabsContent key={index} value={dayName} className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <CardTitle>{format(day, "EEEE, MMMM d")}</CardTitle>
                      </div>
                      <CardDescription>Daily meal menu</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Breakfast */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <UtensilsCrossed className="h-4 w-4 text-secondary" />
                          <h3 className="font-semibold text-lg">Breakfast</h3>
                        </div>
                        <div className="bg-muted/50 rounded-xl p-4">
                          {isLoading ? (
                            <p className="text-sm text-muted-foreground">Loading...</p>
                          ) : menu.breakfast ? (
                            <p className="text-sm">{menu.breakfast.description}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No menu available</p>
                          )}
                        </div>
                      </div>

                      {/* Lunch */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <UtensilsCrossed className="h-4 w-4 text-secondary" />
                          <h3 className="font-semibold text-lg">Lunch</h3>
                        </div>
                        <div className="bg-muted/50 rounded-xl p-4">
                          {isLoading ? (
                            <p className="text-sm text-muted-foreground">Loading...</p>
                          ) : menu.lunch ? (
                            <p className="text-sm">{menu.lunch.description}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No menu available</p>
                          )}
                        </div>
                      </div>

                      {/* Dinner */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <UtensilsCrossed className="h-4 w-4 text-secondary" />
                          <h3 className="font-semibold text-lg">Dinner</h3>
                        </div>
                        <div className="bg-muted/50 rounded-xl p-4">
                          {isLoading ? (
                            <p className="text-sm text-muted-foreground">Loading...</p>
                          ) : menu.dinner ? (
                            <p className="text-sm">{menu.dinner.description}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No menu available</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Menu;
