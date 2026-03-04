import { useState } from "react";
import { Bell, Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAdminFeedbackNotifications } from "@/hooks/useAdminFeedbackNotifications";
import { formatDistanceToNow } from "date-fns";

export const AdminFeedbackBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, recentFeedback, markAsRead } = useAdminFeedbackNotifications();

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && unreadCount > 0) {
      markAsRead();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Student Feedback
          </SheetTitle>
          <SheetDescription>
            Recent meal ratings and feedback from students
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="mt-6 h-[calc(100vh-10rem)]">
          <div className="space-y-3 pr-4">
            {recentFeedback.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No feedback yet
              </p>
            ) : (
              recentFeedback.map((feedback: any) => (
                <div
                  key={feedback.id}
                  className="p-3 rounded-lg border bg-card space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {feedback.students?.full_name || "Unknown Student"}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {feedback.meal_type}
                    </Badge>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= feedback.rating
                              ? "fill-warning text-warning"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    {feedback.is_public && (
                      <Badge variant="secondary" className="text-xs">Public</Badge>
                    )}
                  </div>
                  {feedback.comment && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {feedback.comment}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
