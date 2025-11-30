import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Utensils, Star, MessageSquare, Trash2, Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const MealReports = () => {
  const queryClient = useQueryClient();
  
  const { data: mealStats } = useQuery({
    queryKey: ["meal-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meals")
        .select("meal_type, meal_date, student_id");

      if (error) throw error;

      const totalMeals = data.length;
      const breakfast = data.filter((m) => m.meal_type === "breakfast").length;
      const lunch = data.filter((m) => m.meal_type === "lunch").length;
      const dinner = data.filter((m) => m.meal_type === "dinner").length;

      return {
        total: totalMeals,
        breakfast,
        lunch,
        dinner,
      };
    },
  });

  const { data: recentMeals } = useQuery({
    queryKey: ["recent-meals"],
    queryFn: async () => {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const { data, error } = await supabase
        .from("meals")
        .select("*, student:students(full_name, student_id)")
        .gte("created_at", oneDayAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  // Get average satisfaction score
  const { data: satisfactionData } = useQuery({
    queryKey: ["satisfaction-score"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meal_ratings")
        .select("rating");

      if (error) throw error;

      if (data.length === 0) {
        return { average: 0, total: 0 };
      }

      const total = data.length;
      const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
      const average = sum / total;

      return { average, total };
    },
  });

  // Get recent comments (last 2 days only)
  const { data: recentComments } = useQuery({
    queryKey: ["recent-comments"],
    queryFn: async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const { data, error } = await supabase
        .from("meal_ratings")
        .select("*, student:students(full_name, student_id)")
        .gte("created_at", twoDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Download meal records as CSV
  const downloadMealRecords = () => {
    if (!recentMeals || recentMeals.length === 0) {
      toast.error("No meal records to download");
      return;
    }

    const csvHeaders = "Student ID,Student Name,Meal Type,Date,Time\n";
    const csvRows = recentMeals.map((meal) => {
      const studentName = meal.student?.full_name || "Unknown";
      const studentId = meal.student?.student_id || "Unknown";
      const mealType = meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1);
      const date = format(new Date(meal.meal_date), "MMM dd, yyyy");
      const time = format(new Date(meal.created_at), "h:mm a");
      return `"${studentId}","${studentName}","${mealType}","${date}","${time}"`;
    }).join("\n");

    const csvContent = csvHeaders + csvRows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `meal-records-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Meal records downloaded successfully");
  };

  // Download feedback as CSV
  const downloadFeedback = () => {
    if (!recentComments || recentComments.length === 0) {
      toast.error("No feedback to download");
      return;
    }

    const csvHeaders = "Student Name,Student ID,Rating,Comment,Date\n";
    const csvRows = recentComments.map((rating) => {
      const studentName = rating.student?.full_name || "Unknown";
      const studentId = rating.student?.student_id || "Unknown";
      const comment = (rating.comment || "").replace(/"/g, '""'); // Escape quotes
      const date = format(new Date(rating.created_at), "MMM dd, yyyy 'at' h:mm a");
      return `"${studentName}","${studentId}",${rating.rating},"${comment}","${date}"`;
    }).join("\n");

    const csvContent = csvHeaders + csvRows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `student-feedback-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Feedback downloaded successfully");
  };

  // Delete feedback mutation
  const deleteFeedback = useMutation({
    mutationFn: async (ratingId: string) => {
      const { error } = await supabase
        .from("meal_ratings")
        .delete()
        .eq("id", ratingId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feedback deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["recent-comments"] });
      queryClient.invalidateQueries({ queryKey: ["satisfaction-score"] });
    },
    onError: () => {
      toast.error("Failed to delete feedback");
    },
  });

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meals</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mealStats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Breakfast</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mealStats?.breakfast || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lunch</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mealStats?.lunch || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dinner</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mealStats?.dinner || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Satisfaction Score */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Satisfaction Score</CardTitle>
          <Star className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {satisfactionData?.average ? satisfactionData.average.toFixed(1) : "N/A"}
          </div>
          {satisfactionData?.total ? (
            <p className="text-xs text-muted-foreground mt-1">
              Based on {satisfactionData.total} ratings
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">No ratings yet</p>
          )}
          <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= Math.round(satisfactionData?.average || 0)
                    ? "fill-warning text-warning"
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Comments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle>Recent Student Feedback (Last 2 Days)</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadFeedback}
              disabled={!recentComments || recentComments.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentComments && recentComments.length > 0 ? (
            <div className="space-y-4">
              {recentComments.map((rating) => (
                <div
                  key={rating.id}
                  className="border-l-2 border-primary/30 pl-4 py-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {rating.student?.full_name}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {rating.student?.student_id}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= rating.rating
                                ? "fill-warning text-warning"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      {rating.comment && (
                        <p className="text-sm italic">{rating.comment}</p>
                      )}
                      {rating.image_url && (
                        <img
                          src={rating.image_url}
                          alt="Student meal photo"
                          className="rounded-lg max-w-xs object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(rating.image_url, "_blank")}
                        />
                      )}
                      <span className="text-xs text-muted-foreground block">
                        {format(new Date(rating.created_at), "MMM dd, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteFeedback.mutate(rating.id)}
                      disabled={deleteFeedback.isPending}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent feedback (last 2 days)</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Meals Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Meal Records (Last 24 Hours)</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadMealRecords}
              disabled={!recentMeals || recentMeals.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Meal Type</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentMeals?.map((meal) => (
                <TableRow key={meal.id}>
                  <TableCell className="font-mono">{meal.student?.student_id}</TableCell>
                  <TableCell>{meal.student?.full_name}</TableCell>
                  <TableCell className="capitalize">{meal.meal_type}</TableCell>
                  <TableCell>{new Date(meal.meal_date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
