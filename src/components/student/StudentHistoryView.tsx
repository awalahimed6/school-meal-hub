import { StudentMealHistory } from "./StudentMealHistory";
import { MealRating } from "./MealRating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Calendar, Sparkles } from "lucide-react";

export const StudentHistoryView = () => {
  return (
    <div className="space-y-5 pb-24 page-enter">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Your Activity</h2>
          <p className="text-sm text-muted-foreground">Meals and ratings history</p>
        </div>
      </div>

      <div className="space-y-4 stagger-children">
        <Card className="border-0 shadow-md card-hover overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center">
                <Star className="h-4.5 w-4.5 text-accent" />
              </div>
              <div>
                <CardTitle className="text-base">Rate Today's Meals</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">Share your feedback</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <MealRating />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md card-hover overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                <Calendar className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Meal History</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">Your attendance record</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <StudentMealHistory />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
