import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { useTheme } from "@/lib/theme";
import type { Photo } from "@shared/schema";

// Helper function to convert Google Photos share links to direct image URLs
const getImageUrl = (url: string): string => {
  try {
    // If it's a Google Photos share link (photos.app.goo.gl)
    if (url.includes('photos.app.goo.gl')) {
      // Convert to a direct image URL format that works better
      // photos.app.goo.gl redirects to a googleusercontent URL
      // We'll try to access it with an image parameter
      return url + '=w600';
    }
    
    // If it's already a googleusercontent URL, optimize it
    if (url.includes('lh3.googleusercontent.com') || url.includes('googleusercontent.com')) {
      // Add width parameter if not already present
      if (!url.includes('=w')) {
        return url + (url.includes('?') ? '&' : '?') + 'w=600';
      }
      return url;
    }
    
    return url;
  } catch {
    return url;
  }
};

export default function PhotosPage() {
  const { theme } = useTheme();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    url: "",
  });

  const fetchPhotos = async () => {
    try {
      const response = await fetch("/api/photos");
      if (!response.ok) {
        throw new Error("Failed to fetch photos");
      }
      const data = await response.json();
      setPhotos(data);
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
              src={getImageUrl(photo.url)}
              alt={photo.title || ""}
              className="w-full h-full object-cover aspect-square hover:scale-105 transition-transform duration-200"
              crossOrigin="anonymous"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                // Try alternative format for Google Photos if first attempt fails
                if (photo.url.includes('photos.app.goo.gl') && !target.src.includes('=w')) {
                  target.src = photo.url + '=w600';
                } else if (photo.url.includes('photos.app.goo.gl') && target.src.includes('=w600')) {
                  // If that fails too, try without the parameter
                  target.src = photo.url;
                } else {
                  // Fallback to placeholder
                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ccc" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999"%3ENo image%3C/text%3E%3C/svg%3E';
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(photo.id)}
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

      {photos.length === 0 && (
        <div className={`text-center py-12 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
          Belum ada foto. Tambahkan foto pertama Anda!
        </div>
      )}
    </div>
  );
}
