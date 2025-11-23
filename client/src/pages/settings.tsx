import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/lib/theme";
import { Moon, Sun, Info } from "lucide-react";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Pengaturan Aplikasi</h1>

      <div className="space-y-6 max-w-2xl">
        {/* Tema Aplikasi */}
        <Card>
          <CardHeader>
            <CardTitle>Tema Aplikasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                {theme === "dark" ? (
                  <Moon className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Sun className="h-5 w-5 text-orange-500" />
                )}
                <div>
                  <Label className="text-base font-medium cursor-pointer">
                    {theme === "light" ? "Tema Terang" : "Tema Gelap"}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {theme === "light"
                      ? "Mode terang sedang aktif"
                      : "Mode gelap sedang aktif"}
                  </p>
                </div>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
            </div>

            <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
              <p>
                Pilih tema yang nyaman untuk mata Anda. Preferensi Anda akan
                disimpan secara otomatis.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Informasi Aplikasi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Informasi Aplikasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                  Nama Aplikasi
                </h3>
                <p className="text-base font-medium">Kenangan Kelas</p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                  Versi
                </h3>
                <p className="text-base font-medium">1.0.0</p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                  Deskripsi
                </h3>
                <p className="text-base">
                  Aplikasi untuk menyimpan dan mengelola kenangan kelas dengan fitur album foto, video, dan daftar siswa.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                  Fitur Utama
                </h3>
                <ul className="text-base space-y-1 list-disc list-inside">
                  <li>Album Foto kelas</li>
                  <li>Album Video YouTube/Vimeo</li>
                  <li>Daftar Siswa dengan kontak</li>
                  <li>Pengaturan Tema (Gelap/Terang)</li>
                </ul>
              </div>

              <div className="pt-2 border-t mt-4">
                <p className="text-sm text-muted-foreground">
                  Dibuat dengan ❤️ untuk mengabadikan kenangan berharga bersama kelas Anda.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
