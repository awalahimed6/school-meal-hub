import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useUnreadAnnouncements } from "@/hooks/useUnreadAnnouncements";
import { StudentAnnouncements } from "./StudentAnnouncements";

export const AnnouncementBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, markAsRead } = useUnreadAnnouncements();

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
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Announcements</SheetTitle>
          <SheetDescription>
            Stay updated with the latest announcements
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <StudentAnnouncements />
        </div>
      </SheetContent>
    </Sheet>
  );
};
