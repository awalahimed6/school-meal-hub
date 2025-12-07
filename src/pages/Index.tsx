import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Calendar, Bell, Users, Heart, Star, MessageSquare } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
const Index = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  // Fetch public ratings for Student Voice
  const { data: publicRatings } = useQuery({
    queryKey: ["public-ratings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meal_ratings")
        .select(`
          id,
          rating,
          comment,
          meal_type,
          meal_date,
          image_url,
          created_at,
          student_id
        `)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      return data;
    },
  });

  // Fetch likes for all public ratings
  const { data: allLikes } = useQuery({
    queryKey: ["all-likes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback_likes")
        .select("rating_id, user_id");

      if (error) throw error;
      return data;
    },
  });

  // Toggle like mutation
  const toggleLike = useMutation({
    mutationFn: async (ratingId: string) => {
      if (!user) {
        navigate("/auth");
        throw new Error("Please login to like feedback");
      }

      const { data, error } = await supabase.rpc("toggle_like", {
        _rating_id: ratingId,
        _user_id: user.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-likes"] });
    },
    onError: (error) => {
      if (error.message !== "Please login to like feedback") {
        toast.error("Failed to update like");
      }
    },
  });

  // Helper functions for likes
  const getLikeCount = (ratingId: string) => {
    return allLikes?.filter((like) => like.rating_id === ratingId).length || 0;
  };

  const hasUserLiked = (ratingId: string) => {
    return allLikes?.some(
      (like) => like.rating_id === ratingId && like.user_id === user?.id
    ) || false;
  };

  const handleLikeClick = (ratingId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    toggleLike.mutate(ratingId);
  };

  const mealLabels: Record<string, string> = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  // Redirect based on role
  if (user && role) {
    if (role === "admin") return <Navigate to="/admin" replace />;
    if (role === "staff") return <Navigate to="/staff" replace />;
    if (role === "student") return <Navigate to="/student" replace />;
  }

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
          <Button asChild>
            <a href="/auth">Login</a>
          </Button>
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
          <Button size="lg" asChild>
            <a href="/auth">Get Started</a>
          </Button>
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
      {publicRatings && publicRatings.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <Card>
            <CardHeader className="text-center">
              <MessageSquare className="mx-auto mb-2 h-12 w-12 text-primary" />
              <CardTitle className="text-2xl">Student Voice</CardTitle>
              <CardDescription>
                See what students are saying about their meals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {publicRatings.map((rating) => (
                  <div
                    key={rating.id}
                    className="rounded-lg border p-4 space-y-3 hover:shadow-md transition-shadow"
                  >
                    {/* Rating Stars */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= rating.rating
                              ? "fill-warning text-warning"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Comment */}
                    {rating.comment && (
                      <p className="text-sm text-foreground line-clamp-3">
                        "{rating.comment}"
                      </p>
                    )}

                    {/* Image if present */}
                    {rating.image_url && (
                      <img
                        src={rating.image_url}
                        alt="Meal photo"
                        className="rounded-lg w-full h-32 object-cover"
                      />
                    )}

                    {/* Meal Type & Date */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="capitalize font-medium">
                        {mealLabels[rating.meal_type] || rating.meal_type}
                      </span>
                      <span>
                        {format(new Date(rating.meal_date), "MMM d, yyyy")}
                      </span>
                    </div>

                    {/* Like Button */}
                    <button
                      onClick={() => handleLikeClick(rating.id)}
                      className="flex items-center gap-2 text-sm group"
                    >
                      <Heart
                        className={`h-5 w-5 transition-colors ${
                          hasUserLiked(rating.id)
                            ? "fill-destructive text-destructive"
                            : "text-muted-foreground group-hover:text-destructive"
                        }`}
                      />
                      <span className="text-muted-foreground">
                        {getLikeCount(rating.id)}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
};

export default Index;
