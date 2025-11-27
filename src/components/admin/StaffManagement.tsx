import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { z } from "zod";

const staffSchema = z.object({
  full_name: z.string().min(2).max(100),
  position: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
});

export const StaffManagement = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: staff, isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createStaff = useMutation({
    mutationFn: async (formData: FormData) => {
      const fullName = formData.get("full_name") as string;
      const position = formData.get("position") as string;
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      staffSchema.parse({ full_name: fullName, position, email, password });

      // Use edge function to create staff without affecting admin session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-staff-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email,
            password,
            fullName,
            position,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create staff member");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff member created successfully. They can now log in with their credentials.");
      setIsOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to create staff member";
      
      // Show user-friendly error messages
      if (errorMessage.includes("already exists")) {
        toast.error("This email is already registered. Please use a different email address.");
      } else if (errorMessage.includes("email")) {
        toast.error("Invalid email address. Please check and try again.");
      } else if (errorMessage.includes("password")) {
        toast.error("Password must be at least 6 characters long.");
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const deleteStaff = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff member deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete staff");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createStaff.mutate(formData);
  };

  return (
    <div className="space-y-4">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff Member
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
            <DialogDescription>Create a new cafeteria staff account</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" name="full_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input id="position" name="position" placeholder="e.g., Cafeteria Manager" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="staff@school.com"
                required 
              />
              <p className="text-xs text-muted-foreground">
                This email must be unique and will be used for login
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              Create Staff Member
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff?.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-mono">{member.staff_id}</TableCell>
                <TableCell>{member.full_name}</TableCell>
                <TableCell>{member.position}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => deleteStaff.mutate(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
