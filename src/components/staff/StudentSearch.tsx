import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Search, Check, History, Utensils, AlertTriangle, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface StudentSearchProps {
  externalSearchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
}

export const StudentSearch = ({ externalSearchQuery, onSearchQueryChange }: StudentSearchProps = {}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Sync external search query with internal state
  useEffect(() => {
    if (externalSearchQuery && externalSearchQuery !== searchQuery) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
    if (onSearchQueryChange) {
      onSearchQueryChange(value);
    }
  };

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["student-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];

      const query = searchQuery.trim().toUpperCase();
      
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .or(`student_id.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: searchQuery.length > 0,
  });

  const { data: todaysMeals } = useQuery({
    queryKey: ["todays-meals", selectedStudent?.id],
    queryFn: async () => {
      if (!selectedStudent) return [];

      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("student_id", selectedStudent.id)
        .eq("meal_date", today);

      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudent,
  });

  const { data: mealHistory } = useQuery({
    queryKey: ["meal-history", selectedStudent?.id],
    queryFn: async () => {
      if (!selectedStudent) return [];

      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("student_id", selectedStudent.id)
        .order("meal_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudent,
  });

  const recordMeal = useMutation({
    mutationFn: async (mealType: "breakfast" | "lunch" | "dinner") => {
      if (!selectedStudent || !user) return;

      const today = new Date().toISOString().split("T")[0];

      // Check if meal already exists
      const existing = todaysMeals?.find(m => m.meal_type === mealType);
      if (existing) {
        throw new Error("Meal already recorded for today");
      }

      const { error } = await supabase.from("meals").insert({
        student_id: selectedStudent.id,
        meal_type: mealType,
        meal_date: today,
        recorded_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todays-meals"] });
      queryClient.invalidateQueries({ queryKey: ["meal-history"] });
      toast.success("Meal recorded successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to record meal");
    },
  });

  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
    setSearchQuery("");
  };

  const hasMeal = (mealType: string) => {
    return todaysMeals?.some((m) => m.meal_type === mealType);
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="student-search">Search Student</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="student-search"
            placeholder="Search by student ID or name..."
            value={searchQuery}
            onChange={(e) => handleSearchQueryChange(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Search Results Dropdown */}
        {searchQuery && (
          <Card className="mt-2">
            <CardContent className="p-2">
              {searchLoading ? (
                <p className="p-4 text-center text-sm text-muted-foreground">Searching...</p>
              ) : searchResults && searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleSelectStudent(student)}
                      className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-accent"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student.profile_image || undefined} />
                        <AvatarFallback>
                          {student.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{student.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.student_id} • {student.grade}
                        </p>
                      </div>
                      <Badge
                        variant={student.status === "active" ? "default" : "secondary"}
                      >
                        {student.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  No students found
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Selected Student Info & Actions */}
      {selectedStudent && (
        <Tabs defaultValue="record" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="record">
              <Utensils className="mr-2 h-4 w-4" />
              Record Meals
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="mr-2 h-4 w-4" />
              Meal History
            </TabsTrigger>
          </TabsList>

          {/* Student Profile Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedStudent.profile_image || undefined} />
                  <AvatarFallback className="text-lg">
                    {selectedStudent.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedStudent.full_name}</h3>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="font-mono">{selectedStudent.student_id}</span>
                    <span>•</span>
                    <span>{selectedStudent.grade}</span>
                    <span>•</span>
                    <span>{selectedStudent.sex}</span>
                  </div>
                  <div className="mt-2">
                    <Badge
                      variant={
                        selectedStudent.status === "active"
                          ? "default"
                          : selectedStudent.status === "suspended"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {selectedStudent.status}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStudent(null)}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Safety Alerts */}
          {selectedStudent.allergies && (
            <Alert variant="destructive" className="border-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-bold">Critical: Allergies</AlertTitle>
              <AlertDescription className="text-sm whitespace-pre-wrap">
                {selectedStudent.allergies}
              </AlertDescription>
            </Alert>
          )}
          
          {selectedStudent.dietary_needs && (
            <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-900 dark:text-blue-100 font-semibold">
                Dietary Needs
              </AlertTitle>
              <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm whitespace-pre-wrap">
                {selectedStudent.dietary_needs}
              </AlertDescription>
            </Alert>
          )}

          <TabsContent value="record">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Record Today's Meals</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedStudent.status !== "active" ? (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
                    <p className="text-sm text-destructive">
                      Cannot record meals for {selectedStudent.status} students
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-3">
                    <Button
                      onClick={() => recordMeal.mutate("breakfast")}
                      disabled={hasMeal("breakfast")}
                      variant={hasMeal("breakfast") ? "outline" : "default"}
                      size="lg"
                      className="h-20 flex-col gap-2"
                    >
                      {hasMeal("breakfast") && <Check className="h-5 w-5" />}
                      <span className="text-base font-semibold">Breakfast</span>
                      <span className="text-xs opacity-80">
                        {hasMeal("breakfast") ? "Recorded" : "Not recorded"}
                      </span>
                    </Button>
                    <Button
                      onClick={() => recordMeal.mutate("lunch")}
                      disabled={hasMeal("lunch")}
                      variant={hasMeal("lunch") ? "outline" : "default"}
                      size="lg"
                      className="h-20 flex-col gap-2"
                    >
                      {hasMeal("lunch") && <Check className="h-5 w-5" />}
                      <span className="text-base font-semibold">Lunch</span>
                      <span className="text-xs opacity-80">
                        {hasMeal("lunch") ? "Recorded" : "Not recorded"}
                      </span>
                    </Button>
                    <Button
                      onClick={() => recordMeal.mutate("dinner")}
                      disabled={hasMeal("dinner")}
                      variant={hasMeal("dinner") ? "outline" : "default"}
                      size="lg"
                      className="h-20 flex-col gap-2"
                    >
                      {hasMeal("dinner") && <Check className="h-5 w-5" />}
                      <span className="text-base font-semibold">Dinner</span>
                      <span className="text-xs opacity-80">
                        {hasMeal("dinner") ? "Recorded" : "Not recorded"}
                      </span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Meal History</CardTitle>
              </CardHeader>
              <CardContent>
                {!mealHistory || mealHistory.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No meal history found
                  </p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Meal Type</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mealHistory.map((meal) => (
                          <TableRow key={meal.id}>
                            <TableCell>
                              {format(new Date(meal.meal_date), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {meal.meal_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(meal.created_at), "h:mm a")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};