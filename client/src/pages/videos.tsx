import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Loader } from "lucide-react";
import { useTheme } from "@/lib/theme";
import type { Video } from "@shared/schema";

export default function VideosPage() {
  const { theme } = useTheme();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    file: null as File | null | undefined,
  });

  const fetchVideos = async () => {
    try {
      const response = await fetch("/api/videos");
      if (!response.ok) {
        throw new Error("Failed to fetch videos");
      }
      const data = await response.json();
      setVideos(data);
    } catch (error) {
      console.error("Failed to fetch videos:", error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      if (!formData.file) {
        console.error("No file selected");
        setUploading(false);
        return;
      }

      console.log("Converting video to base64...", formData.file.name);
      
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          console.log("Video converted to base64, size:", result.length);
          resolve(result);
        };
        reader.onerror = () => {
          console.error("FileReader error:", reader.error);
          reject(reader.error);
        };
        if (formData.file) {
          reader.readAsDataURL(formData.file);
        } else {
          reject(new Error("No file selected"));
        }
      });
      
      const videoData = {
        title: formData.title || "Video",
        description: formData.description,
        fileData: fileData,
      };
      
      console.log("Sending video data, payload size:", JSON.stringify(videoData).length);
      
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(videoData),
      });
      
      console.log("Response status:", response.status);
      
      if (response.ok) {
        console.log("Video saved successfully");
        setFormData({ title: "", description: "", file: null });
        setOpen(false);
        fetchVideos();
      } else {
        const errorData = await response.json();
        console.error("Server error:", response.status, errorData);
      }
    } catch (error) {
      console.error("Failed to add video:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus video ini?")) return;
    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchVideos();
      }
    } catch (error) {
      console.error("Failed to delete video:", error);
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
        <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Album Video</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Video
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Video Baru</DialogTitle>
              <DialogDescription>
                Isi form di bawah untuk menambah video baru ke album kenangan kelas
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="file">Pilih Video dari Komputer</Label>
                <Input
                  id="file"
                  type="file"
                  accept="video/*"
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.map((video) => (
          <Card key={video.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{video.title || "Video"}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(video.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video mb-2 bg-black rounded-md overflow-hidden">
                {video.fileData ? (
                  <video
                    src={video.fileData}
                    className="w-full h-full object-contain"
                    controls
                    title={video.title || "Video"}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400">No video</span>
                  </div>
                )}
              </div>
              {video.description && (
                <p className="text-sm text-gray-600">{video.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {videos.length === 0 && (
        <div className={`text-center py-12 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
          Belum ada video. Tambahkan video pertama Anda!
        </div>
      )}
    </div>
  );
}
