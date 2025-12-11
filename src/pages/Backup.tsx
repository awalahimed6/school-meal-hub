import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Database, Users, FileImage, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface TableInfo {
  name: string;
  displayName: string;
  description: string;
}

const tables: TableInfo[] = [
  { name: "students", displayName: "Students", description: "Student records with profiles" },
  { name: "staff", displayName: "Staff", description: "Staff member records" },
  { name: "profiles", displayName: "User Profiles", description: "User profile information" },
  { name: "user_roles", displayName: "User Roles", description: "Role assignments" },
  { name: "meals", displayName: "Meals", description: "Meal attendance records" },
  { name: "meal_ratings", displayName: "Meal Ratings", description: "Student meal feedback" },
  { name: "meal_schedules", displayName: "Meal Schedules", description: "Meal serving times" },
  { name: "announcements", displayName: "Announcements", description: "Posted announcements" },
  { name: "weekly_menu_templates", displayName: "Menu Templates", description: "Weekly menu configuration" },
  { name: "weekly_menus", displayName: "Weekly Menus", description: "Date-specific menus" },
  { name: "feedback_likes", displayName: "Feedback Likes", description: "Like interactions" },
  { name: "student_announcement_dismissals", displayName: "Announcement Dismissals", description: "Dismissed announcements" },
];

const Backup = () => {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());

  const downloadTableAsJSON = async (tableName: string) => {
    setDownloading(tableName);
    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select("*")
        .limit(10000);

      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tableName}_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloaded((prev) => new Set([...prev, tableName]));
      toast.success(`Downloaded ${tableName}`);
    } catch (error) {
      console.error("Download error:", error);
      toast.error(`Failed to download ${tableName}`);
    } finally {
      setDownloading(null);
    }
  };

  const downloadTableAsCSV = async (tableName: string) => {
    setDownloading(`${tableName}-csv`);
    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select("*")
        .limit(10000);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.info(`No data in ${tableName}`);
        return;
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(","),
        ...data.map((row: any) =>
          headers
            .map((header) => {
              const value = row[header];
              if (value === null || value === undefined) return "";
              const stringValue = String(value);
              if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
                return `"${stringValue.replace(/"/g, '""')}"`;
              }
              return stringValue;
            })
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tableName}_backup_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloaded((prev) => new Set([...prev, `${tableName}-csv`]));
      toast.success(`Downloaded ${tableName} as CSV`);
    } catch (error) {
      console.error("Download error:", error);
      toast.error(`Failed to download ${tableName}`);
    } finally {
      setDownloading(null);
    }
  };

  const downloadAllAsJSON = async () => {
    setDownloading("all");
    try {
      const allData: Record<string, any> = {};
      
      for (const table of tables) {
        const { data, error } = await supabase
          .from(table.name as any)
          .select("*")
          .limit(10000);
        
        if (!error && data) {
          allData[table.name] = data;
        }
      }

      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `full_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Downloaded complete backup");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download complete backup");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Data Backup</h1>
            <p className="text-muted-foreground">Export your Lovable Cloud data</p>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Summary
            </CardTitle>
            <CardDescription>Your current data overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm text-muted-foreground">Students</div>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="text-2xl font-bold">2</div>
                <div className="text-sm text-muted-foreground">Staff</div>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="text-2xl font-bold">9</div>
                <div className="text-sm text-muted-foreground">Meals</div>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="text-2xl font-bold">6</div>
                <div className="text-sm text-muted-foreground">Users</div>
              </div>
            </div>
            <Button 
              onClick={downloadAllAsJSON} 
              disabled={downloading === "all"}
              className="w-full"
            >
              {downloading === "all" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download Complete Backup (JSON)
            </Button>
          </CardContent>
        </Card>

        {/* Individual Tables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Tables
            </CardTitle>
            <CardDescription>Download individual tables as JSON or CSV</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tables.map((table) => (
              <div
                key={table.name}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {downloaded.has(table.name) && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <div>
                    <div className="font-medium">{table.displayName}</div>
                    <div className="text-sm text-muted-foreground">{table.description}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadTableAsCSV(table.name)}
                    disabled={downloading === `${table.name}-csv`}
                  >
                    {downloading === `${table.name}-csv` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "CSV"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => downloadTableAsJSON(table.name)}
                    disabled={downloading === table.name}
                  >
                    {downloading === table.name ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "JSON"
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* User Authentication Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Authentication Users
            </CardTitle>
            <CardDescription>User accounts from profiles table (6 users)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                <span>awalahimed463@gmail.com</span>
                <Badge>admin</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                <span>awalahimed777@gmail.com</span>
                <Badge variant="secondary">student</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                <span>nanbondev@gmail.com</span>
                <Badge variant="secondary">student</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                <span>awalahimed44@gmail.com</span>
                <Badge variant="outline">staff</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                <span>awalahimed41@gmail.com</span>
                <Badge variant="outline">staff</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                <span>nanbon@gmail.com</span>
                <Badge variant="secondary">student</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Note: User passwords cannot be exported for security reasons. Users will need to reset passwords after any migration.
            </p>
          </CardContent>
        </Card>

        {/* Storage Buckets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Storage Files
            </CardTitle>
            <CardDescription>Uploaded images and files</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="font-medium">student-profiles bucket</div>
              <div className="text-sm text-muted-foreground mb-2">Student profile images</div>
              <div className="text-xs space-y-1">
                <a href="https://qxiadvdbmrcetghtqywa.supabase.co/storage/v1/object/public/student-profiles/temp-1764465228996-1764465228996.jpg" target="_blank" className="text-primary hover:underline block">• Student 1 profile image</a>
                <a href="https://qxiadvdbmrcetghtqywa.supabase.co/storage/v1/object/public/student-profiles/2-1764465592542.jpg" target="_blank" className="text-primary hover:underline block">• Student 2 profile image</a>
                <a href="https://qxiadvdbmrcetghtqywa.supabase.co/storage/v1/object/public/student-profiles/temp-1765094362093-1765094362093.jpg" target="_blank" className="text-primary hover:underline block">• Student 3 profile image</a>
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="font-medium">meal-photos bucket</div>
              <div className="text-sm text-muted-foreground mb-2">Meal rating photos</div>
              <div className="text-xs space-y-1">
                <a href="https://qxiadvdbmrcetghtqywa.supabase.co/storage/v1/object/public/meal-photos/48c381e7-5fc6-4248-9fb2-d5997e8fe7dc/1764467149052.jpg" target="_blank" className="text-primary hover:underline block">• Meal photo 1</a>
                <a href="https://qxiadvdbmrcetghtqywa.supabase.co/storage/v1/object/public/meal-photos/2d20d85e-46e4-498f-adf7-19d9413142c0/1765096886706.jpg" target="_blank" className="text-primary hover:underline block">• Meal photo 2</a>
                <a href="https://qxiadvdbmrcetghtqywa.supabase.co/storage/v1/object/public/meal-photos/48c381e7-5fc6-4248-9fb2-d5997e8fe7dc/1765097655514.jpg" target="_blank" className="text-primary hover:underline block">• Meal photo 3</a>
                <a href="https://qxiadvdbmrcetghtqywa.supabase.co/storage/v1/object/public/meal-photos/48c381e7-5fc6-4248-9fb2-d5997e8fe7dc/1765098175061.jpg" target="_blank" className="text-primary hover:underline block">• Meal photo 4</a>
                <a href="https://qxiadvdbmrcetghtqywa.supabase.co/storage/v1/object/public/meal-photos/2d20d85e-46e4-498f-adf7-19d9413142c0/1765108281580.jpg" target="_blank" className="text-primary hover:underline block">• Meal photo 5</a>
                <a href="https://qxiadvdbmrcetghtqywa.supabase.co/storage/v1/object/public/meal-photos/48c381e7-5fc6-4248-9fb2-d5997e8fe7dc/1765404687892.png" target="_blank" className="text-primary hover:underline block">• Meal photo 6</a>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Right-click and "Save As" to download individual images, or click to view them.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Backup;
