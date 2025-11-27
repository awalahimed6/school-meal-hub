import { StudentMealHistory } from "./StudentMealHistory";
import { MealRating } from "./MealRating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Calendar } from "lucide-react";

export const StudentHistoryView = () => {
  return (
    <div className="space-y-6 pb-24">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Your Activity</h2>
        <p className="text-muted-foreground">Meals and ratings history</p>
      </div>

      <Card className="rounded-[32px] shadow-xl border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <CardTitle>Rate Today's Meals</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <MealRating />
        </CardContent>
      </Card>

      <Card className="rounded-[32px] shadow-xl border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Meal History</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <StudentMealHistory />
        </CardContent>
      </Card>
    </div>
  );
};
