import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Filter, Upload, X } from "lucide-react";
import { z } from "zod";
import { CameraCapture } from "./CameraCapture";

const studentSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  grade: z.string().min(1, "Grade is required"),
  sex: z.enum(["Male", "Female", "Other"]),
  status: z.enum(["active", "suspended", "under_standard"]),
  allergies: z.string().optional(),
  dietary_needs: z.string().optional(),
});

export const StudentManagement = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: students, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const uploadImage = async (file: File, studentId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${studentId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('student-profiles')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('student-profiles')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const createStudent = useMutation({
    mutationFn: async (formData: FormData) => {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const fullName = formData.get("full_name") as string;
      const grade = formData.get("grade") as string;
      const sex = formData.get("sex") as string;
      const status = formData.get("status") as string;
      const allergies = formData.get("allergies") as string;
      const dietary_needs = formData.get("dietary_needs") as string;

      studentSchema.parse({ email, password, full_name: fullName, grade, sex, status, allergies, dietary_needs });

      let profileImageUrl = null;

      // Upload image if selected (we'll get a temp ID for upload)
      if (selectedImage) {
        setUploading(true);
        try {
          const tempId = `temp-${Date.now()}`;
          profileImageUrl = await uploadImage(selectedImage, tempId);
        } catch (error) {
          console.error("Image upload error:", error);
          toast.error("Failed to upload image, but student will be created");
        } finally {
          setUploading(false);
        }
      }

      // Call the edge function to create student user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-student-user`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            fullName,
            grade,
            sex,
            status,
            profileImage: profileImageUrl,
            allergies,
            dietary_needs,
          }),
        }
      );

      const data = await response.json();

      // Even if the edge function returns 200, it may include an error field
      if (
        data?.code === "email_exists" ||
        typeof data?.error === "string" &&
        (data.error.includes("already been registered") ||
         data.error.includes("Email already registered"))
      ) {
        throw new Error("This email is already registered. Please use a different email address.");
      }

      if (!response.ok) {
        // Provide clearer error messages for other issues
        throw new Error(data.error || "Failed to create student account");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student created successfully");
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create student");
      setUploading(false);
    },
  });

  const updateStudent = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const fullName = formData.get("full_name") as string;
      const grade = formData.get("grade") as string;
      const sex = formData.get("sex") as string;
      const status = formData.get("status") as string;
      const allergies = formData.get("allergies") as string;
      const dietary_needs = formData.get("dietary_needs") as string;

      // Validate without email for updates
      const updateSchema = studentSchema.omit({ email: true, password: true });
      updateSchema.parse({ full_name: fullName, grade, sex, status, allergies, dietary_needs });

      let profileImageUrl = editingStudent?.profile_image;

      // Upload new image if selected
      if (selectedImage) {
        setUploading(true);
        try {
          profileImageUrl = await uploadImage(selectedImage, editingStudent.student_id);
        } catch (error) {
          console.error("Image upload error:", error);
          toast.error("Failed to upload image, but student will be updated");
        } finally {
          setUploading(false);
        }
      }

      const { error } = await supabase
        .from("students")
        .update({
          full_name: fullName,
          grade,
          sex,
          status: status as "active" | "suspended" | "under_standard",
          profile_image: profileImageUrl,
          allergies,
          dietary_needs,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student updated successfully");
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update student");
      setUploading(false);
    },
  });

  const deleteStudent = useMutation({
    mutationFn: async (id: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-student-user`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ studentId: id }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete student");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete student");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (editingStudent) {
      updateStudent.mutate({ id: editingStudent.id, formData });
    } else {
      createStudent.mutate(formData);
    }
  };

  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setImagePreview(student.profile_image);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingStudent(null);
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleImageFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const filteredStudents = students?.filter((student) => {
    const matchesSearch =
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.grade.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Dialog open={isOpen} onOpenChange={(open) => {
          if (!open) {
            handleClose();
          } else {
            setIsOpen(true);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
              <DialogDescription>
                {editingStudent ? "Update student information" : "Create a new student record"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Profile Image</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={imagePreview || undefined} />
                    <AvatarFallback>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="cursor-pointer flex-1"
                      />
                      <CameraCapture onCapture={handleImageFile} />
                    </div>
                    {imagePreview && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Remove Image
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              {!editingStudent && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Student Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="student@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="text"
                      placeholder="Enter password (min 6 characters)"
                      required
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={editingStudent?.full_name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Input id="grade" name="grade" defaultValue={editingStudent?.grade} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sex">Sex</Label>
                <Select name="sex" defaultValue={editingStudent?.sex || "Male"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editingStudent?.status || "active"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="under_standard">Under Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergies">
                  Allergies <span className="text-destructive font-semibold">(Critical)</span>
                </Label>
                <Textarea
                  id="allergies"
                  name="allergies"
                  placeholder="List any known allergies (e.g., peanuts, dairy, shellfish)..."
                  defaultValue={editingStudent?.allergies || ""}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dietary_needs">Dietary Needs</Label>
                <Textarea
                  id="dietary_needs"
                  name="dietary_needs"
                  placeholder="List any dietary restrictions (e.g., vegetarian, halal, gluten-free)..."
                  defaultValue={editingStudent?.dietary_needs || ""}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? "Uploading..." : editingStudent ? "Update Student" : "Create Student"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or grade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="under_standard">Under Standard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this student record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteStudent.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Loading students...</p>
        </div>
      ) : !filteredStudents || filteredStudents.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
          <p className="text-lg font-medium">No students found</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Get started by adding your first student"}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Photo</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Sex</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents?.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={student.profile_image || undefined} />
                      <AvatarFallback>
                        {student.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-mono">{student.student_id}</TableCell>
                  <TableCell>{student.full_name}</TableCell>
                  <TableCell>{student.grade}</TableCell>
                  <TableCell>{student.sex}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        student.status === "active"
                          ? "default"
                          : student.status === "suspended"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(student)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setDeleteId(student.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};