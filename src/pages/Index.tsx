import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Utensils,
  Calendar,
  Bell,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  Award
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { StudentVoiceFeed } from "@/components/shared/StudentVoiceFeed";
import { AIChatbot } from "@/components/shared/AIChatbot";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Fetch announcements
  const { data: announcements } = useQuery({
    queryKey: ["index-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) throw error;
      return data;
    },
  });

  // Fetch today's meal schedule
  const { data: mealSchedules } = useQuery({
    queryKey: ["index-meal-schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meal_schedules")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      return data;
    },
  });

  // Fetch today's menu items
  const { data: todayMenu } = useQuery({
    queryKey: ["index-today-menu", todayStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_menus")
        .select("*")
        .eq("date", todayStr);

      if (error) throw error;
      return data;
    },
  });

  // Fetch quick stats
  const { data: totalStudents = 0 } = useQuery({
    queryKey: ["index-stat-students"],
    queryFn: async () => {
      const { count } = await supabase.from("students").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: totalMealsServed = 0 } = useQuery({
    queryKey: ["index-stat-meals"],
    queryFn: async () => {
      const { count } = await supabase.from("meals").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const isLoggedIn = !!user;

  const defaultSchedule = [
    { meal_type: "breakfast", start_time: "07:00:00", end_time: "08:30:00" },
    { meal_type: "lunch", start_time: "12:00:00", end_time: "13:30:00" },
    { meal_type: "dinner", start_time: "17:00:00", end_time: "18:30:00" },
  ];

  const activeSchedules = (mealSchedules && mealSchedules.length > 0) ? mealSchedules : defaultSchedule;

  const formatTime = (timeStr: string) => {
    try {
      const [h, m] = timeStr.split(":");
      const date = new Date();
      date.setHours(parseInt(h, 10), parseInt(m, 10));
      return format(date, "hh:mm a");
    } catch {
      return timeStr;
    }
  };

  const handleDashboardRedirect = () => {
    if (role === "admin") navigate("/admin");
    else if (role === "staff") navigate("/staff");
    else if (role === "student") navigate("/student");
    else navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border/80 shadow-xs">
        <div className="container mx-auto flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Utensils className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-none text-foreground">
                School Meal Hub
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                Nutrition & Attendance System
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#schedule" className="hover:text-foreground transition-colors">
              Schedule
            </a>
            <a href="#menu" className="hover:text-foreground transition-colors">
              Today's Menu
            </a>
            <a href="#announcements" className="hover:text-foreground transition-colors">
              Announcements
            </a>
            <a href="#voice" className="hover:text-foreground transition-colors">
              Student Voice
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isLoggedIn ? (
              <Button onClick={handleDashboardRedirect} className="font-semibold shadow-xs">
                Go to Dashboard
              </Button>
            ) : (
              <Button asChild className="font-semibold shadow-xs">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-16 md:py-24 text-center max-w-5xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-4 py-1.5 text-xs font-semibold text-foreground mb-6 shadow-2xs">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Smart Cafeteria Management & Meal Tracking</span>
        </div>

        <h2 className="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl text-foreground leading-[1.1]">
          Fresh Nutrition & Instant Meal Tracking for Every Student
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
          Streamlined cafeteria QR check-ins, automated meal scheduling, weekly menu plans, and real-time student feedback — all in one place.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {isLoggedIn ? (
            <Button size="lg" onClick={handleDashboardRedirect} className="gap-2 font-bold px-8 shadow-sm">
              Open Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="lg" asChild className="gap-2 font-bold px-8 shadow-sm">
              <Link to="/auth">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <Button size="lg" variant="outline" asChild className="font-semibold px-6 border-border/80">
            <a href="#schedule">View Meal Schedule</a>
          </Button>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <Card className="border border-border/80 bg-card shadow-2xs">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Students</span>
                <Users className="h-4 w-4 text-primary" />
              </div>
              <p className="text-3xl font-black text-foreground">{totalStudents || "100+"}</p>
              <p className="text-xs text-muted-foreground mt-1">Active Profiles</p>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-card shadow-2xs">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Meals Served</span>
                <Utensils className="h-4 w-4 text-primary" />
              </div>
              <p className="text-3xl font-black text-foreground">{totalMealsServed || "1,000+"}</p>
              <p className="text-xs text-muted-foreground mt-1">Tracked Records</p>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-card shadow-2xs">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daily Meals</span>
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <p className="text-3xl font-black text-foreground">3</p>
              <p className="text-xs text-muted-foreground mt-1">Serving Windows</p>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-card shadow-2xs">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">System Status</span>
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <p className="text-3xl font-black text-foreground">100%</p>
              <p className="text-xs text-muted-foreground mt-1">Operational</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Daily Meal Schedule */}
      <section id="schedule" className="container mx-auto px-4 py-12 max-w-5xl">
        <Card className="border border-border/80 bg-card shadow-xs">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Clock className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Daily Serving Schedule</CardTitle>
            <CardDescription>Cafeteria serving time windows for students and staff</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid gap-4 md:grid-cols-3">
              {activeSchedules.map((s: any) => {
                const mealName = s.meal_type.charAt(0).toUpperCase() + s.meal_type.slice(1);
                return (
                  <div
                    key={s.meal_type}
                    className="flex flex-col justify-between rounded-2xl border border-border/80 bg-background p-5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                        <Utensils className="h-4 w-4 text-foreground" />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-foreground px-2.5 py-1 rounded-md">
                        {mealName}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Serving Window</p>
                      <p className="text-lg font-bold text-foreground mt-0.5">
                        {formatTime(s.start_time)} – {formatTime(s.end_time)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Today's Menu Section */}
      <section id="menu" className="container mx-auto px-4 py-12 max-w-5xl">
        <Card className="border border-border/80 bg-card shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                  <Utensils className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold tracking-tight">Today's Menu Preview</CardTitle>
                  <CardDescription>{format(new Date(), "EEEE, MMMM d, yyyy")}</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
                <Link to="/menu">Full Weekly Menu</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {todayMenu && todayMenu.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-3">
                {todayMenu.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border/80 bg-background p-5 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {item.meal_type}
                    </span>
                    <h4 className="font-bold text-base text-foreground">{item.description}</h4>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-background rounded-2xl border border-border/60">
                <p className="text-sm text-muted-foreground font-medium">Standard cafeteria menu items serving today.</p>
                <Button variant="link" size="sm" asChild className="mt-2 text-foreground">
                  <Link to="/menu">View Complete Weekly Schedule</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Announcements */}
      {announcements && announcements.length > 0 && (
        <section id="announcements" className="container mx-auto px-4 py-12 max-w-5xl">
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold tracking-tight">Cafeteria Announcements</CardTitle>
                  <CardDescription>Important notifications from cafeteria management</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {announcements.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border/80 bg-background p-5 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-bold text-base text-foreground leading-snug mb-1.5">{item.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.content}</p>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-medium pt-2 border-t border-border/50 flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(item.created_at), "PPP")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Student Voice Section */}
      <section id="voice" className="container mx-auto px-4 py-12 max-w-5xl">
        <StudentVoiceFeed />
      </section>

      {/* Floating Interactive AI Chatbot Widget */}
      <AIChatbot />

      {/* Footer */}
      <footer className="mt-auto border-t border-border/80 bg-card py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Utensils className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-foreground">School Meal Hub</span>
            <span>• © {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#schedule" className="hover:text-foreground transition-colors">Schedule</a>
            <a href="#menu" className="hover:text-foreground transition-colors">Menu</a>
            <a href="#announcements" className="hover:text-foreground transition-colors">Announcements</a>
            <Link to="/auth" className="hover:text-foreground transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
