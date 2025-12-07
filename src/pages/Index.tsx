import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Calendar, Bell, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { StudentVoiceFeed } from "@/components/shared/StudentVoiceFeed";

const Index = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  // Fetch announcements
  const { data: announcements } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  // Check if user is logged in (for conditional UI, not for redirect)
  const isLoggedIn = !!user;

  const mealSchedule = [
    { meal: "Breakfast", time: "7:00 AM - 8:30 AM" },
    { meal: "Lunch", time: "12:00 PM - 1:30 PM" },
    { meal: "Dinner", time: "5:00 PM - 6:30 PM" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Utensils className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">School Meal System</h1>
              <p className="text-sm text-muted-foreground">Nutrition & Management</p>
            </div>
          </div>
          {isLoggedIn ? (
            <Button onClick={() => {
              if (role === "admin") navigate("/admin");
              else if (role === "staff") navigate("/staff");
              else if (role === "student") navigate("/student");
            }}>
              Go to Dashboard
            </Button>
          ) : (
            <Button asChild>
              <a href="/auth">Login</a>
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="mb-4 text-4xl font-bold md:text-5xl">
          Welcome to School Meal Management
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
          Streamlined meal tracking and management for students, staff, and administrators.
          Ensuring every student gets the nutrition they need.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {isLoggedIn ? (
            <Button size="lg" onClick={() => {
              if (role === "admin") navigate("/admin");
              else if (role === "staff") navigate("/staff");
              else if (role === "student") navigate("/student");
            }}>
              Go to Dashboard
            </Button>
          ) : (
            <Button size="lg" asChild>
              <a href="/auth">Get Started</a>
            </Button>
          )}
          <Button size="lg" variant="outline" asChild>
            <a href="#schedule">View Schedule</a>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <Users className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>Student Management</CardTitle>
              <CardDescription>
                Easy registration and profile management for all students
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Utensils className="mb-2 h-10 w-10 text-secondary" />
              <CardTitle>Meal Tracking</CardTitle>
              <CardDescription>
                Accurate tracking of breakfast, lunch, and dinner for every student
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Bell className="mb-2 h-10 w-10 text-warning" />
              <CardTitle>Announcements</CardTitle>
              <CardDescription>
                Stay updated with important meal schedule changes and news
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Meal Schedule */}
      <section id="schedule" className="container mx-auto px-4 py-12">
        <Card>
          <CardHeader className="text-center">
            <Calendar className="mx-auto mb-2 h-12 w-12 text-primary" />
            <CardTitle className="text-2xl">Daily Meal Schedule</CardTitle>
            <CardDescription>Regular meal times for all students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mealSchedule.map((item) => (
                <div
                  key={item.meal}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <Utensils className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold">{item.meal}</span>
                  </div>
                  <span className="text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Announcements */}
      {announcements && announcements.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <Bell className="mb-2 h-10 w-10 text-warning" />
              <CardTitle className="text-2xl">Latest Announcements</CardTitle>
              <CardDescription>Important updates from the cafeteria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="rounded-lg border p-4">
                    <h3 className="mb-2 font-semibold">{announcement.title}</h3>
                    <p className="mb-2 text-sm text-muted-foreground">{announcement.content}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{format(new Date(announcement.created_at), "MMM d, yyyy")}</span>
                  </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Student Voice Section */}
      <section className="container mx-auto px-4 py-12">
        <StudentVoiceFeed />
      </section>
    </div>
  );
};

export default Index;
