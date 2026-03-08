import { StudentMealHistory } from "./StudentMealHistory";
import { MealRating } from "./MealRating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Calendar } from "lucide-react";

export const StudentHistoryView = () => {
  return (
    <div className="space-y-5 pb-24">
      <div>
        <h2 className="text-xl font-bold text-foreground">Your Activity</h2>
        <p className="text-sm text-muted-foreground mt-1">Meals and ratings history</p>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Star className="h-4 w-4 text-accent" />
            </div>
            <CardTitle className="text-base">Rate Today's Meals</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <MealRating />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base">Meal History</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <StudentMealHistory />
        </CardContent>
      </Card>
    </div>
  );
};
