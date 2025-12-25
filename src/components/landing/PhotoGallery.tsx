import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, ChevronLeft, ChevronRight, Play, Camera, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface GalleryImage {
  id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string;
}

interface MealVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
}

interface PhotoGalleryProps {
  className?: string;
}

const defaultImages: GalleryImage[] = [
  {
    id: "default-1",
    title: "Modern classroom with students learning",
    description: null,
    category: "Classrooms",
    image_url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80",
  },
  {
    id: "default-2",
    title: "Student dormitory building",
    description: null,
    category: "Dormitories",
    image_url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
  },
  {
    id: "default-3",
    title: "Students studying in library",
    description: null,
    category: "Campus Life",
    image_url: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&q=80",
  },
  {
    id: "default-4",
    title: "Sports activities",
    description: null,
    category: "Activities",
    image_url: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=80",
  },
];

export function PhotoGallery({ className }: PhotoGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [videoOpen, setVideoOpen] = useState(false);

  // Fetch gallery images from database
  const { data: dbImages = [] } = useQuery({
    queryKey: ["gallery-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as GalleryImage[];
    },
  });

  // Fetch meal video
  const { data: mealVideo } = useQuery({
    queryKey: ["meal-video"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meal_system_video")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as MealVideo | null;
    },
  });

  // Use database images if available, otherwise show defaults
  const galleryImages = dbImages.length > 0 ? dbImages : defaultImages;

  // Get unique categories from images
  const categories = ["All", ...Array.from(new Set(galleryImages.map((img) => img.category)))];

  const filteredImages =
    selectedCategory === "All"
      ? galleryImages
      : galleryImages.filter((img) => img.category === selectedCategory);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % filteredImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft") prevImage();
    if (e.key === "Escape") setLightboxOpen(false);
  };

  return (
    <section id="gallery" className={cn("py-24 bg-muted/30", className)}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <Camera className="h-4 w-4" />
            <span>Campus Gallery</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Life at <span className="text-primary">Ifa Boru</span>
          </h2>
          <p className="text-muted-foreground">
            Explore our vibrant campus through photos showcasing classrooms, dormitories, and student activities.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "rounded-full transition-all",
                selectedCategory === category && "shadow-lg"
              )}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
          {filteredImages.map((image, index) => (
            <div
              key={image.id}
              className="group relative aspect-square overflow-hidden rounded-xl cursor-pointer shadow-md hover:shadow-2xl transition-all duration-300"
              onClick={() => openLightbox(index)}
            >
              <img
                src={image.image_url}
                alt={image.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <span className="inline-block px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full mb-1">
                  {image.category}
                </span>
                <p className="text-white text-sm line-clamp-1">{image.title}</p>
              </div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Video Section */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-2">
              See Our <span className="text-primary">Meal System</span> in Action
            </h3>
            <p className="text-muted-foreground">
              Watch how we provide nutritious meals to our students using our modern QR-based meal tracking system.
            </p>
          </div>

          <div
            className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl cursor-pointer group"
            onClick={() => setVideoOpen(true)}
          >
            {/* Video Thumbnail */}
            <img
              src={mealVideo?.thumbnail_url || "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=1200&q=80"}
              alt="Meal system demonstration"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300 animate-pulse">
                <Play className="h-8 w-8 text-primary-foreground ml-1" />
              </div>
            </div>

            {/* Video Info */}
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-white font-semibold text-lg mb-1">
                {mealVideo?.title || "Ifa Boru Meal Management System"}
              </p>
              <p className="text-white/80 text-sm">
                {mealVideo?.description || "QR Code Scanning • Real-time Tracking • Nutritious Meals"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent 
          className="max-w-5xl w-full h-[90vh] p-0 bg-black/95 border-none"
          onKeyDown={handleKeyDown}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 z-50 h-12 w-12 text-white hover:bg-white/20 rounded-full"
              onClick={prevImage}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 z-50 h-12 w-12 text-white hover:bg-white/20 rounded-full"
              onClick={nextImage}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>

            {/* Image */}
            <div className="w-full h-full p-8 flex items-center justify-center">
              {filteredImages[currentImageIndex] && (
                <img
                  src={filteredImages[currentImageIndex].image_url}
                  alt={filteredImages[currentImageIndex].title}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              )}
            </div>

            {/* Image Info */}
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="text-white font-medium">
                {filteredImages[currentImageIndex]?.title}
              </p>
              <p className="text-white/60 text-sm mt-1">
                {currentImageIndex + 1} / {filteredImages.length}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black border-none">
          <div className="relative aspect-video">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 z-50 text-white hover:bg-white/20"
              onClick={() => setVideoOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Video Player or Placeholder */}
            {mealVideo?.video_url ? (
              <video
                src={mealVideo.video_url}
                poster={mealVideo.thumbnail_url || undefined}
                controls
                autoPlay
                className="w-full h-full rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-muted flex flex-col items-center justify-center rounded-lg">
                <div className="text-center p-8">
                  <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                    <Play className="h-10 w-10 text-primary" />
                  </div>
                  <h4 className="text-xl font-semibold text-foreground mb-2">
                    Meal System Demo Video
                  </h4>
                  <p className="text-muted-foreground max-w-md">
                    This video showcases our innovative QR-based meal tracking system, 
                    demonstrating how students scan their IDs to receive nutritious meals.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <span className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20">
                      QR Scanning
                    </span>
                    <span className="px-3 py-1 text-xs rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                      Real-time Tracking
                    </span>
                    <span className="px-3 py-1 text-xs rounded-full bg-accent/10 text-accent border border-accent/20">
                      Meal Analytics
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
