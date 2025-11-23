import { useState } from "react";
import "@fontsource/inter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PhotosPage from "./pages/photos";
import VideosPage from "./pages/videos";
import StudentsPage from "./pages/students";
import { GraduationCap, Image, Video } from "lucide-react";

function App() {
  const [activeTab, setActiveTab] = useState("photos");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800">Kenangan Kelas</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-6">
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Foto
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Video
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Siswa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photos">
            <PhotosPage />
          </TabsContent>

          <TabsContent value="videos">
            <VideosPage />
          </TabsContent>

          <TabsContent value="students">
            <StudentsPage />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
