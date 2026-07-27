import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { signIn, getUserRole } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Utensils } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

const resetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const Auth = () => {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (role === "admin") navigate("/admin");
      else if (role === "staff") navigate("/staff");
      else if (role === "student") navigate("/student");
      else if (role) navigate("/");
    }
  }, [user, role, loading, navigate]);

  if (!loading && user && role) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      loginSchema.parse({ email, password });

      const { data, error } = await signIn(email, password);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Logged in successfully!");

      if (data?.user) {
        const userRole = await getUserRole(data.user.id);
        if (userRole === "admin") navigate("/admin");
        else if (userRole === "staff") navigate("/staff");
        else if (userRole === "student") navigate("/student");
        else navigate("/");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsResetting(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("reset-email") as string;

    try {
      resetSchema.parse({ email });

      // Generate reset link
      const resetLink = `${window.location.origin}/auth/reset-password`;

      // Request password reset from Supabase (this generates the token)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetLink,
      });

      if (error) throw error;

      toast.success("Password reset link sent! Check your email.");
      setIsResetDialogOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error instanceof Error && error.message.includes("rate limit")) {
        toast.error("Too many requests. Please wait a few minutes and try again.");
      } else {
        toast.error("If an account exists with this email, you will receive a reset link.");
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border border-border/80 shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-primary">
            <Utensils className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">School Meal System</CardTitle>
          <CardDescription>Sign in to manage meals and student records</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            
            <div className="flex items-center justify-end">
              <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="link" className="px-0 text-sm">
                    Forgot password?
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                      Enter your email address and we'll send you a link to reset your password.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                        id="reset-email"
                        name="reset-email"
                        type="email"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isResetting}>
                      {isResetting ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
