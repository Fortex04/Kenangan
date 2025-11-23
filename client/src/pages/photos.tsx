import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "@/lib/theme";
import type { Photo } from "@shared/schema";

// Helper function to get resolved image URL
const getResolvedImageUrl = async (url: string): Promise<string> => {
  try {
    if (url.includes('photos.app.goo.gl')) {
      const response = await fetch(`/api/photos/resolve-url?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json();
        return data.url;
      }
    }
    
    // If it's already a googleusercontent URL, optimize it
    if (url.includes('lh3.googleusercontent.com') || url.includes('googleusercontent.com')) {
      if (!url.includes('=w')) {
        return url + (url.includes('?') ? '&' : '?') + 'w=1000';
      }
      return url;
    }
    
    return url;
  } catch (error) {
    console.error('Error resolving image URL:', error);
    return url;
  }
};

export default function PhotosPage() {
  const { theme } = useTheme();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showFilmstrip, setShowFilmstrip] = useState(true);
  const [resolvedUrls, setResolvedUrls] = useState<Record<number, string>>({});
  const [formData, setFormData] = useState({
    description: "",
    url: "",
  });

  const getCurrentPhoto = () => {
    if (currentPhotoIndex >= 0 && currentPhotoIndex < photos.length) {
      return photos[currentPhotoIndex];
    }
    return null;
  };

  const handlePrevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const openPhotoViewer = (photo: Photo) => {
    const index = photos.findIndex(p => p.id === photo.id);
    setCurrentPhotoIndex(index >= 0 ? index : 0);
    setSelectedPhoto(photo);
    setShowFilmstrip(true);
  };

  const closePhotoViewer = () => {
    setSelectedPhoto(null);
    setShowFilmstrip(true);
  };

  const toggleFilmstrip = () => {
    setShowFilmstrip(!showFilmstrip);
  };

  const fetchPhotos = async () => {
    try {
      const response = await fetch("/api/photos");
      if (!response.ok) {
        throw new Error("Failed to fetch photos");
      }
      const data = await response.json();
      setPhotos(data);
      
      // Pre-resolve Google Photos URLs
      for (const photo of data) {
        if (photo.url.includes('photos.app.goo.gl')) {
          try {
            const resolved = await getResolvedImageUrl(photo.url);
            setResolvedUrls(prev => ({
              ...prev,
              [photo.id]: resolved
            }));
          } catch (error) {
            console.error(`Failed to resolve URL for photo ${photo.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch photos:", error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  // Keyboard navigation for fullscreen viewer
  useEffect(() => {
    if (!selectedPhoto) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevPhoto();
      } else if (e.key === 'ArrowRight') {
        handleNextPhoto();
      } else if (e.key === 'Escape') {
        closePhotoViewer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, photos, currentPhotoIndex]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setFormData({ description: "", url: "" });
        setOpen(false);
        fetchPhotos();
      }
    } catch (error) {
      console.error("Failed to add photo:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus foto ini?")) return;
    try {
      const response = await fetch(`/api/photos/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchPhotos();
      }
    } catch (error) {
      console.error("Failed to delete photo:", error);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
        Loading...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Foto</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Foto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Foto Baru</DialogTitle>
              <DialogDescription>
                Isi form di bawah untuk menambah foto baru ke album kenangan kelas
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="url">URL Foto</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com/photo.jpg"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">Simpan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3" style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${photos.length < 5 ? '280px' : photos.length < 15 ? '220px' : '180px'}, 1fr))`
      }}>
        {photos.map((photo) => (
          <div key={photo.id} className="relative group rounded-md overflow-hidden bg-gray-200">
            <img
              src={resolvedUrls[photo.id] || photo.url}
              alt={photo.title || ""}
              className="w-full h-full object-cover aspect-square hover:scale-105 transition-transform duration-200 cursor-pointer"
              crossOrigin="anonymous"
              onClick={() => openPhotoViewer(photo)}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ccc" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999"%3ENo image%3C/text%3E%3C/svg%3E';
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(photo.id);
              }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
            {photo.description && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <p className="text-sm text-white line-clamp-2">{photo.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Fullscreen Photo Gallery with Filmstrip */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black flex"
          onClick={() => closePhotoViewer()}
        >
          {/* Main Photo Area */}
          <div 
            className={`relative flex items-center justify-center overflow-hidden transition-all ${
              showFilmstrip ? 'flex-1' : 'w-full'
            }`}
            onClick={toggleFilmstrip}
          >
            {/* Close Button */}
            <button
              onClick={() => closePhotoViewer()}
              className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-20"
            >
              <X className="h-10 w-10" />
            </button>

            {/* Photo Counter */}
            <div className="absolute top-6 left-6 text-white text-lg font-medium z-20">
              {currentPhotoIndex + 1} / {photos.length}
            </div>

            {/* Previous Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevPhoto();
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-20 p-2"
              disabled={photos.length <= 1}
            >
              <ChevronLeft className="h-12 w-12" />
            </button>

            {/* Main Image */}
            <div className="relative w-full h-full flex items-center justify-center px-10">
              <img
                src={resolvedUrls[getCurrentPhoto()?.id || selectedPhoto.id] || getCurrentPhoto()?.url || selectedPhoto.url}
                alt={getCurrentPhoto()?.title || selectedPhoto.title || ""}
                className="max-w-full max-h-full object-contain"
                crossOrigin="anonymous"
              />
            </div>

            {/* Next Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextPhoto();
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-20 p-2"
              disabled={photos.length <= 1}
            >
              <ChevronRight className="h-12 w-12" />
            </button>

            {/* Description at Bottom */}
            {getCurrentPhoto()?.description && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-6 z-20">
                <p className="text-white text-base">{getCurrentPhoto()?.description}</p>
              </div>
            )}
          </div>

          {/* Thumbnail Filmstrip - Right Side (30%) */}
          {showFilmstrip && (
          <div className="w-32 bg-gray-900/50 overflow-y-auto flex flex-col gap-2 p-2 transition-all">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setCurrentPhotoIndex(index)}
                className={`flex-shrink-0 h-24 rounded-md overflow-hidden transition-all ${
                  index === currentPhotoIndex 
                    ? 'ring-2 ring-blue-500 opacity-100' 
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={resolvedUrls[photo.id] || photo.url}
                  alt={photo.title || ""}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              </button>
            ))}
          </div>
          )}
        </div>
      )}

      {photos.length === 0 && (
        <div className={`text-center py-12 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
          Belum ada foto. Tambahkan foto pertama Anda!
        </div>
      )}
    </div>
  );
}
