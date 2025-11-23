import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import type { Video } from "@shared/schema";

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
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
    try {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setFormData({ title: "", description: "", url: "" });
        setOpen(false);
        fetchVideos();
      }
    } catch (error) {
      console.error("Failed to add video:", error);
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
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Album Video</h1>
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
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Judul</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="url">URL Video (YouTube/Vimeo)</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.map((video) => (
          <Card key={video.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{video.title}</span>
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
              <div className="aspect-video mb-2">
                <iframe
                  src={video.url.replace("watch?v=", "embed/")}
                  className="w-full h-full rounded-md"
                  allowFullScreen
                  title={video.title}
                />
              </div>
              {video.description && (
                <p className="text-sm text-gray-600">{video.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Belum ada video. Tambahkan video pertama Anda!
        </div>
      )}
    </div>
  );
}
