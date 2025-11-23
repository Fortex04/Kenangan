import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Pengaturan Aplikasi</h1>

      <div className="max-w-md">
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
      </div>
    </div>
  );
}
