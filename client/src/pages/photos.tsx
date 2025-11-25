import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, X, Loader } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { isAdminLoggedIn } from "@/lib/admin-auth";
import type { Photo } from "@shared/schema";

// Helper function to get resolved image URL with proxy
const getResolvedImageUrl = async (url: string, isFullscreen: boolean = false): Promise<string> => {
  try {
    let resolvedUrl = url;
    
    if (url.includes('photos.app.goo.gl')) {
      // Backend already resolves to full quality, just get it
      const response = await fetch(`/api/photos/resolve-url?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json();
        resolvedUrl = data.url;
      }
    } else if (!isFullscreen && !resolvedUrl.includes('=w') && (resolvedUrl.includes('lh3.googleusercontent.com') || resolvedUrl.includes('googleusercontent.com'))) {
      // Only add width param for thumbnail if not already present
      resolvedUrl = resolvedUrl + (resolvedUrl.includes('?') ? '&' : '?') + 'w=800';
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
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(isAdminLoggedIn());
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [resolvedUrls, setResolvedUrls] = useState<Record<number, string>>({});
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [formData, setFormData] = useState({
    description: "",
    fileData: "",
    file: null as File | null,
  });

  // Check admin status on mount and when page becomes visible
  useEffect(() => {
    setIsAdmin(isAdminLoggedIn());
  }, []);

  // Touch state tracking
  const touchStateRef = useRef({
    prevDistance: 0,
    prevX: 0,
    prevY: 0,
    isZooming: false,
    isDragging: false,
  });

  // Mouse state tracking - for pan on desktop
  const mouseStateRef = useRef({
    isMouseDown: false,
    startX: 0,
    startY: 0,
    prevX: 0,
    prevY: 0,
    totalDragDist: 0,
  });

  const openPhotoViewer = async (photo: Photo) => {
    // Set a loading state - use a temporary object to indicate loading
    setSelectedPhoto({ ...photo, fileData: "" } as any);
    try {
      // Fetch full photo data with fileData
      const response = await fetch(`/api/photos/${photo.id}`);
      if (response.ok) {
        const fullPhoto = await response.json();
        setSelectedPhoto(fullPhoto);
      } else {
        setSelectedPhoto(photo);
      }
    } catch (error) {
      console.error('Failed to load full photo:', error);
      setSelectedPhoto(photo);
    }
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

  // Handle touch - both zoom and drag
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Start zoom gesture
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      touchStateRef.current.prevDistance = distance;
      touchStateRef.current.isZooming = true;
      touchStateRef.current.isDragging = false;
    } else if (e.touches.length === 1 && zoom > 1) {
      // Start drag gesture (only when zoomed)
      touchStateRef.current.prevX = e.touches[0].clientX;
      touchStateRef.current.prevY = e.touches[0].clientY;
      touchStateRef.current.isDragging = true;
      touchStateRef.current.isZooming = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStateRef.current.isZooming) {
      // Pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      if (touchStateRef.current.prevDistance > 0) {
        const scale = distance / touchStateRef.current.prevDistance;
        setZoom(prev => Math.max(1, Math.min(4, prev * scale)));
      }
      touchStateRef.current.prevDistance = distance;
    } else if (e.touches.length === 1 && touchStateRef.current.isDragging && zoom > 1) {
      // Drag pan - with smoothing dampening
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStateRef.current.prevX;
      const deltaY = touch.clientY - touchStateRef.current.prevY;
      
      // Limit max delta per frame to smooth out jittery movements
      const maxDelta = 50;
      const limitedDeltaX = Math.max(-maxDelta, Math.min(maxDelta, deltaX));
      const limitedDeltaY = Math.max(-maxDelta, Math.min(maxDelta, deltaY));
      
      setPanX(prev => prev + limitedDeltaX);
      setPanY(prev => prev + limitedDeltaY);
      
      touchStateRef.current.prevX = touch.clientX;
      touchStateRef.current.prevY = touch.clientY;
    }
  };

  const handleTouchEnd = () => {
    touchStateRef.current.prevDistance = 0;
    touchStateRef.current.prevX = 0;
    touchStateRef.current.prevY = 0;
    touchStateRef.current.isZooming = false;
    touchStateRef.current.isDragging = false;
  };

  // Mouse pan - desktop only
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      e.preventDefault();
      mouseStateRef.current.isMouseDown = true;
      mouseStateRef.current.startX = e.clientX;
      mouseStateRef.current.startY = e.clientY;
      mouseStateRef.current.prevX = e.clientX;
      mouseStateRef.current.prevY = e.clientY;
      mouseStateRef.current.totalDragDist = 0;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mouseStateRef.current.isMouseDown && zoom > 1) {
      e.preventDefault();
      const deltaX = e.clientX - mouseStateRef.current.prevX;
      const deltaY = e.clientY - mouseStateRef.current.prevY;
      
      // Limit max delta per frame for smoothness
      const maxDelta = 50;
      const limitedDeltaX = Math.max(-maxDelta, Math.min(maxDelta, deltaX));
      const limitedDeltaY = Math.max(-maxDelta, Math.min(maxDelta, deltaY));
      
      // Track total drag distance
      mouseStateRef.current.totalDragDist += Math.abs(limitedDeltaX) + Math.abs(limitedDeltaY);
      
      setPanX(prev => prev + limitedDeltaX);
      setPanY(prev => prev + limitedDeltaY);
      
      mouseStateRef.current.prevX = e.clientX;
      mouseStateRef.current.prevY = e.clientY;
    }
  };

  const handleMouseUp = () => {
    mouseStateRef.current.isMouseDown = false;
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // Only close if user barely dragged (threshold: 5px)
    if (mouseStateRef.current.totalDragDist < 5) {
      closePhotoViewer();
    }
  };

  const fetchPhotos = async () => {
    try {
      console.log("Fetching photos...");
      const response = await fetch("/api/photos");
      console.log("Fetch response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Photos loaded, count:", data.length);
      setPhotos(data);
      
      // Pre-resolve Google Photos URLs (skip if no URL or fileData exists)
      for (const photo of data) {
        if (photo.url && photo.url.includes('photos.app.goo.gl')) {
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
      console.error("Failed to fetch photos - Error details:", {
        message: error instanceof Error ? error.message : String(error),
        error: error
      });
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

  // Load high quality URL when fullscreen viewer opens
  useEffect(() => {
    if (!selectedPhoto) return;

    const loadHighQualityUrl = async () => {
      // Only resolve if URL exists (not for fileData photos)
      if (!selectedPhoto.url) return;
      
      try {
        const highQualityUrl = await getResolvedImageUrl(selectedPhoto.url, true);
        setResolvedUrls(prev => ({
          ...prev,
          [selectedPhoto.id]: highQualityUrl
        }));
      } catch (error) {
        console.error('Error loading high quality URL:', error);
      }
    };

    loadHighQualityUrl();
    
    // Reset zoom when photo changes
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, [selectedPhoto?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      if (!formData.file) {
        console.error("No file selected");
        setUploading(false);
        return;
      }

      console.log("Converting file to base64...", formData.file.name);
      
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          console.log("File converted to base64, size:", result.length);
          resolve(result);
        };
        reader.onerror = () => {
          console.error("FileReader error:", reader.error);
          reject(reader.error);
        };
        reader.readAsDataURL(formData.file);
      });
      
      const photoData = {
        description: formData.description,
        fileData: fileData,
      };
      
      console.log("Sending photo data, payload size:", JSON.stringify(photoData).length);
      
      const response = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(photoData),
      });
      
      console.log("Response status:", response.status);
      
      if (response.ok) {
        console.log("Photo saved successfully");
        setFormData({ description: "", fileData: "", file: null });
        setOpen(false);
        fetchPhotos();
      } else {
        const errorData = await response.json();
        console.error("Server error:", response.status, errorData);
      }
    } catch (error) {
      console.error("Failed to add photo:", error);
    } finally {
      setUploading(false);
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
        {isAdmin && (
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
                <Label htmlFor="file">Pilih Foto dari Komputer</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  disabled={uploading}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={!formData.file || uploading}>
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="h-4 w-4 animate-spin" />
                    Sedang mengupload...
                  </span>
                ) : (
                  "Simpan"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <div className="grid gap-3" style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${photos.length < 5 ? '280px' : photos.length < 15 ? '220px' : '180px'}, 1fr))`
      }}>
        {photos.map((photo) => (
          <div key={photo.id} className="relative group rounded-md overflow-hidden bg-gray-200">
            <img
              src={
                photo.fileData || 
                resolvedUrls[photo.id] ||
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ccc" width="100" height="100"/%3E%3C/svg%3E'
              }
              alt={photo.title || ""}
              className="w-full h-full object-cover aspect-square hover:scale-105 transition-transform duration-200 cursor-pointer"
              onClick={() => openPhotoViewer(photo)}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ccc" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999"%3ENo image%3C/text%3E%3C/svg%3E';
              }}
            />
            {isAdmin && (
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
            )}
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
          onClick={handleContainerClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
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

            {/* Loading Indicator */}
            {!selectedPhoto.fileData && !resolvedUrls[selectedPhoto.id] && (
              <div className="flex flex-col items-center justify-center gap-3">
                <Loader className="h-12 w-12 text-white animate-spin" />
                <p className="text-white text-lg">Sedang memuat foto...</p>
              </div>
            )}

            {/* Main Image with Zoom */}
            {(selectedPhoto.fileData || resolvedUrls[selectedPhoto.id]) && (
              <img
                src={
                  selectedPhoto.fileData || 
                  resolvedUrls[selectedPhoto.id] ||
                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3C/svg%3E'
                }
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
            )}

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
