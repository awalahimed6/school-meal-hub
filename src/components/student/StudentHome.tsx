import { Card, CardContent } from "@/components/ui/card";
import { StudentQRCard } from "./StudentQRCard";

export const StudentHome = () => {
  return (
    <div className="space-y-6 pb-24">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Your Student ID</h2>
        <p className="text-muted-foreground">Show this QR code at the cafeteria</p>
      </div>
      
      <div className="flex justify-center">
        <StudentQRCard />
      </div>

      <Card className="rounded-[32px] shadow-xl">
        <CardContent className="p-8 text-center space-y-4">
          <div className="text-6xl">🍽️</div>
          <h3 className="text-xl font-semibold">Today's Meals</h3>
          <p className="text-muted-foreground">
            Scan your QR code at the cafeteria to check in for meals
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
