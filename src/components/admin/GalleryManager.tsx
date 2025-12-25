import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, ImageIcon, Video, Upload, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const CATEGORIES = ["Classrooms", "Dormitories", "Campus Life", "Activities", "Dining", "Sports"];

interface GalleryImage {
  id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface MealVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  is_active: boolean;
}

export function GalleryManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [newImage, setNewImage] = useState({
    title: "",
    description: "",
    category: "Campus Life",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState("Ifa Boru Meal Management System");
  const [videoDescription, setVideoDescription] = useState("QR Code Scanning • Real-time Tracking • Nutritious Meals");
  const [isUploading, setIsUploading] = useState(false);

  // Fetch gallery images
  const { data: images = [], isLoading: imagesLoading } = useQuery({
    queryKey: ["admin-gallery-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as GalleryImage[];
    },
  });

  // Fetch meal video
  const { data: mealVideo } = useQuery({
    queryKey: ["meal-system-video"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meal_system_video")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as MealVideo | null;
    },
  });

  // Add image mutation
  const addImageMutation = useMutation({
    mutationFn: async () => {
      if (!imageFile || !user) throw new Error("No file selected");
      
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("campus-gallery")
        .upload(fileName, imageFile);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("campus-gallery")
        .getPublicUrl(fileName);
      
      // Insert record
      const { error: insertError } = await supabase
        .from("gallery_images")
        .insert({
          title: newImage.title,
          description: newImage.description || null,
          category: newImage.category,
          image_url: publicUrl,
          uploaded_by: user.id,
          display_order: images.length,
        });
      
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast.success("Image added successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-images"] });
      setIsAddingImage(false);
      setNewImage({ title: "", description: "", category: "Campus Life" });
      setImageFile(null);
    },
    onError: (error) => {
      toast.error("Failed to add image: " + error.message);
    },
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (image: GalleryImage) => {
      // Extract filename from URL
      const urlParts = image.image_url.split("/");
      const fileName = urlParts[urlParts.length - 1];
      
      // Delete from storage
      await supabase.storage.from("campus-gallery").remove([fileName]);
      
      // Delete record
      const { error } = await supabase
        .from("gallery_images")
        .delete()
        .eq("id", image.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Image deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-images"] });
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("gallery_images")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gallery-images"] });
    },
  });

  // Upload video mutation
  const uploadVideoMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      let videoUrl = mealVideo?.video_url || null;
      let thumbnailUrl = mealVideo?.thumbnail_url || null;
      
      // Upload video if provided
      if (videoFile) {
        const videoExt = videoFile.name.split(".").pop();
        const videoFileName = `meal-system-demo.${videoExt}`;
        
        const { error: videoUploadError } = await supabase.storage
          .from("meal-videos")
          .upload(videoFileName, videoFile, { upsert: true });
        
        if (videoUploadError) throw videoUploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from("meal-videos")
          .getPublicUrl(videoFileName);
        
        videoUrl = publicUrl;
      }
      
      // Upload thumbnail if provided
      if (thumbnailFile) {
        const thumbExt = thumbnailFile.name.split(".").pop();
        const thumbFileName = `meal-system-thumbnail.${thumbExt}`;
        
        const { error: thumbUploadError } = await supabase.storage
          .from("meal-videos")
          .upload(thumbFileName, thumbnailFile, { upsert: true });
        
        if (thumbUploadError) throw thumbUploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from("meal-videos")
          .getPublicUrl(thumbFileName);
        
        thumbnailUrl = publicUrl;
      }
      
      // Upsert video record
      if (mealVideo) {
        const { error } = await supabase
          .from("meal_system_video")
          .update({
            title: videoTitle,
            description: videoDescription,
            video_url: videoUrl,
            thumbnail_url: thumbnailUrl,
          })
          .eq("id", mealVideo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("meal_system_video")
          .insert({
            title: videoTitle,
            description: videoDescription,
            video_url: videoUrl,
            thumbnail_url: thumbnailUrl,
            uploaded_by: user.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Video updated successfully");
      queryClient.invalidateQueries({ queryKey: ["meal-system-video"] });
      setIsUploadingVideo(false);
      setVideoFile(null);
      setThumbnailFile(null);
    },
    onError: (error) => {
      toast.error("Failed to update video: " + error.message);
    },
  });

  return (
    <div className="space-y-8">
      {/* Gallery Images Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Campus Gallery Images
          </h3>
          <Dialog open={isAddingImage} onOpenChange={setIsAddingImage}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Image
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Gallery Image</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="image-file">Image File</Label>
                  <Input
                    id="image-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div>
                  <Label htmlFor="image-title">Title</Label>
                  <Input
                    id="image-title"
                    value={newImage.title}
                    onChange={(e) => setNewImage({ ...newImage, title: e.target.value })}
                    placeholder="e.g., Modern Science Laboratory"
                  />
                </div>
                <div>
                  <Label htmlFor="image-category">Category</Label>
                  <Select
                    value={newImage.category}
                    onValueChange={(value) => setNewImage({ ...newImage, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="image-description">Description (optional)</Label>
                  <Textarea
                    id="image-description"
                    value={newImage.description}
                    onChange={(e) => setNewImage({ ...newImage, description: e.target.value })}
                    placeholder="Brief description of the image"
                  />
                </div>
                <Button
                  onClick={() => addImageMutation.mutate()}
                  disabled={!imageFile || !newImage.title || addImageMutation.isPending}
                  className="w-full"
                >
                  {addImageMutation.isPending ? "Uploading..." : "Upload Image"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {imagesLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading images...</div>
        ) : images.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No gallery images yet.</p>
              <p className="text-sm text-muted-foreground">Click "Add Image" to upload campus photos.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <Card key={image.id} className="overflow-hidden">
                <div className="aspect-square relative">
                  <img
                    src={image.image_url}
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                  {!image.is_active && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Hidden</span>
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="font-medium text-sm truncate">{image.title}</p>
                  <p className="text-xs text-muted-foreground">{image.category}</p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleVisibilityMutation.mutate({ id: image.id, isActive: !image.is_active })}
                    >
                      {image.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteImageMutation.mutate(image)}
                      disabled={deleteImageMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Video Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Video className="h-5 w-5" />
            Meal System Demo Video
          </h3>
          <Dialog open={isUploadingVideo} onOpenChange={setIsUploadingVideo}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                {mealVideo?.video_url ? "Update Video" : "Upload Video"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Meal System Demo Video</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="video-file">Video File (MP4 recommended)</Label>
                  <Input
                    id="video-file"
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div>
                  <Label htmlFor="thumbnail-file">Thumbnail Image (optional)</Label>
                  <Input
                    id="thumbnail-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div>
                  <Label htmlFor="video-title">Title</Label>
                  <Input
                    id="video-title"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="video-description">Description</Label>
                  <Textarea
                    id="video-description"
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => uploadVideoMutation.mutate()}
                  disabled={uploadVideoMutation.isPending}
                  className="w-full"
                >
                  {uploadVideoMutation.isPending ? "Uploading..." : "Save Video"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-6">
            {mealVideo?.video_url ? (
              <div className="space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <video
                    src={mealVideo.video_url}
                    poster={mealVideo.thumbnail_url || undefined}
                    controls
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium">{mealVideo.title}</p>
                  <p className="text-sm text-muted-foreground">{mealVideo.description}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No demo video uploaded yet.</p>
                <p className="text-sm text-muted-foreground">
                  Upload a video showcasing your meal tracking system.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
