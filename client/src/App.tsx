import { useState } from "react";
import "@fontsource/inter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PhotosPage from "./pages/photos";
import VideosPage from "./pages/videos";
import StudentsPage from "./pages/students";
import SettingsPage from "./pages/settings";
import { GraduationCap, Image, Video, Settings, Users } from "lucide-react";
import { ThemeProvider, useTheme } from "@/lib/theme";

function AppContent() {
  const [activeTab, setActiveTab] = useState("photos");
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800"
          : "bg-gradient-to-br from-blue-50 to-indigo-100"
      }`}
    >
      <header
        className={`${
          theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white"
        } shadow-sm border-b`}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                theme === "dark" ? "bg-indigo-900" : "bg-indigo-100"
              }`}
            >
              <GraduationCap className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h1
                className={`text-2xl font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-800"
                }`}
              >
                Kenangan Kelas
              </h1>
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Album Foto & Video
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className={`grid w-full max-w-2xl mx-auto grid-cols-4 mb-6 gap-1 px-2 py-1 pb-12 ${
              theme === "dark"
                ? "bg-slate-800 border-slate-700"
                : "bg-gray-100 border-gray-200 border"
            }`}
          >
            <TabsTrigger value="photos" className="flex flex-col items-center gap-1 py-4 px-2">
              <Image className="h-5 w-5" />
              <span className="text-xs sm:text-sm hidden sm:inline">Foto</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex flex-col items-center gap-1 py-4 px-2">
              <Video className="h-5 w-5" />
              <span className="text-xs sm:text-sm hidden sm:inline">Video</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="flex flex-col items-center gap-1 py-4 px-2">
              <Users className="h-5 w-5" />
              <span className="text-xs sm:text-sm hidden sm:inline">Siswa</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex flex-col items-center gap-1 py-4 px-2">
              <Settings className="h-5 w-5" />
              <span className="text-xs sm:text-sm hidden sm:inline">Atur</span>
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

          <TabsContent value="settings">
            <SettingsPage />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
