import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, X } from "lucide-react";
import { useTheme } from "@/lib/theme";
import type { Photo } from "@shared/schema";

// Helper function to get resolved image URL with proxy
const getResolvedImageUrl = async (url: string): Promise<string> => {
  try {
    let resolvedUrl = url;
    
    if (url.includes('photos.app.goo.gl')) {
      const response = await fetch(`/api/photos/resolve-url?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json();
        resolvedUrl = data.url;
      }
    }
    
    // If it's already a googleusercontent URL, optimize it
    if (resolvedUrl.includes('lh3.googleusercontent.com') || resolvedUrl.includes('googleusercontent.com')) {
      if (!resolvedUrl.includes('=w')) {
        resolvedUrl = resolvedUrl + (resolvedUrl.includes('?') ? '&' : '?') + 'w=1000';
      }
    }
    
    // Return proxy URL to bypass CORS
    return `/api/photos/proxy?url=${encodeURIComponent(resolvedUrl)}`;
  } catch (error) {
    console.error('Error resolving image URL:', error);
    return `/api/photos/proxy?url=${encodeURIComponent(url)}`;
  }
};

export default function PhotosPage() {
  const { theme } = useTheme();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [resolvedUrls, setResolvedUrls] = useState<Record<number, string>>({});
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [formData, setFormData] = useState({
    description: "",
    url: "",
  });

  // Touch state tracking using refs
  const touchStateRef = useRef({
    initialDistance: null as number | null,
    lastX: null as number | null,
    lastY: null as number | null,
    activeGesture: null as 'zoom' | 'pan' | null,
  });

  const openPhotoViewer = (photo: Photo) => {
    setSelectedPhoto(photo);
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const closePhotoViewer = () => {
    setSelectedPhoto(null);
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  // Handle touch start - detect gesture type
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Two fingers: prepare for zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      touchStateRef.current.initialDistance = distance;
      touchStateRef.current.activeGesture = 'zoom';
      touchStateRef.current.lastX = null;
      touchStateRef.current.lastY = null;
    } else if (e.touches.length === 1) {
      // One finger: prepare for pan
      if (zoom > 1) {
        const touch = e.touches[0];
        touchStateRef.current.lastX = touch.clientX;
        touchStateRef.current.lastY = touch.clientY;
        touchStateRef.current.activeGesture = 'pan';
        touchStateRef.current.initialDistance = null;
      }
    }
  };

  // Handle touch move - execute gesture
  const handleTouchMove = (e: React.TouchEvent) => {
    // If finger count doesn't match gesture type, reset
    if (touchStateRef.current.activeGesture === 'zoom' && e.touches.length !== 2) {
      touchStateRef.current.activeGesture = null;
      touchStateRef.current.initialDistance = null;
      return;
    }
    if (touchStateRef.current.activeGesture === 'pan' && e.touches.length !== 1) {
      touchStateRef.current.activeGesture = null;
      touchStateRef.current.lastX = null;
      touchStateRef.current.lastY = null;
      return;
    }

    if (touchStateRef.current.activeGesture === 'zoom' && e.touches.length === 2) {
      // Two fingers: pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      const initialDistance = touchStateRef.current.initialDistance;
      if (initialDistance && initialDistance > 0) {
        const scale = distance / initialDistance;
        setZoom(prev => Math.max(1, Math.min(4, prev * scale)));
        touchStateRef.current.initialDistance = distance;
      }
    } else if (touchStateRef.current.activeGesture === 'pan' && e.touches.length === 1) {
      // One finger: drag pan
      const touch = e.touches[0];
      const lastX = touchStateRef.current.lastX;
      const lastY = touchStateRef.current.lastY;
      
      if (lastX !== null && lastY !== null) {
        const deltaX = touch.clientX - lastX;
        const deltaY = touch.clientY - lastY;
        setPanX(prev => prev + deltaX);
        setPanY(prev => prev + deltaY);
      }
      
      touchStateRef.current.lastX = touch.clientX;
      touchStateRef.current.lastY = touch.clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchStateRef.current.initialDistance = null;
    touchStateRef.current.lastX = null;
    touchStateRef.current.lastY = null;
    touchStateRef.current.activeGesture = null;
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
      if (e.key === 'Escape') {
        closePhotoViewer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto]);

  // Reset zoom when photo changes
  useEffect(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, [selectedPhoto?.id]);

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
              src={resolvedUrls[photo.id] || `/api/photos/proxy?url=${encodeURIComponent(photo.url)}`}
              alt={photo.title || ""}
              className="w-full h-full object-cover aspect-square hover:scale-105 transition-transform duration-200 cursor-pointer"
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

      {/* Fullscreen Photo Viewer */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
          onClick={() => closePhotoViewer()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="relative w-full h-full flex items-center justify-center px-10"
            onClick={(e) => e.stopPropagation()}
            style={{
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => closePhotoViewer()}
              className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-20"
            >
              <X className="h-10 w-10" />
            </button>

            {/* Main Image with Zoom */}
            <img
              src={resolvedUrls[selectedPhoto.id] || `/api/photos/proxy?url=${encodeURIComponent(selectedPhoto.url)}`}
              alt={selectedPhoto.title || ""}
              className="max-w-full max-h-full object-contain transition-transform duration-75 ease-out"
              style={{
                transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
                transformOrigin: 'center',
                touchAction: 'manipulation',
                userSelect: 'none'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3ENo image%3C/text%3E%3C/svg%3E';
              }}
            />

            {/* Zoom Level Indicator */}
            {zoom > 1 && (
              <div className="absolute top-6 left-6 text-white text-sm font-medium z-20 bg-black/50 px-3 py-1 rounded">
                {Math.round(zoom * 100)}%
              </div>
            )}

            {/* Description at Bottom */}
            {selectedPhoto.description && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-6 z-20">
                <p className="text-white text-base">{selectedPhoto.description}</p>
              </div>
            )}
          </div>
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
