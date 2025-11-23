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

        {/* Informasi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Informasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>
              Aplikasi ini dibuat sebagai tempat menyimpan jejak waktu yang perlahan pergi.
              Foto, video, nama siswa, dan nomor kontak dikumpulkan bukan sekadar sebagai data,
              tapi sebagai potongan cerita yang suatu hari mungkin sulit kita temukan lagi.
            </p>

            <p>
              Di sini, setiap momen direkam agar tetap hidup—
              tawa yang dulu memenuhi kelas, wajah-wajah yang berubah, dan langkah-langkah kecil
              yang membawa kita ke tempat yang berbeda.
            </p>

            <p>
              Melalui aplikasi ini, kamu dapat menelusuri kembali:
            </p>

            <ul className="space-y-2 list-disc list-inside">
              <li>Foto dan video kegiatan yang pernah membuat kita merasa dekat</li>
              <li>Nama teman yang dulu setiap hari kita sapa</li>
              <li>Kontak yang mungkin suatu saat jadi penghubung ketika jarak mulai terasa</li>
              <li>Album kenangan yang tertata seperti halaman masa lalu yang tak ingin hilang</li>
            </ul>

            <p>
              Aplikasi ini hadir sebagai pengingat lembut,
              bahwa kenangan bukan untuk dilupakan,
              melainkan dijaga—karena waktu tak selalu memberi kesempatan kedua
              untuk melihat semuanya kembali secara utuh.
            </p>

            <div className="border-t pt-4 mt-4">
              <p>
                Saya Akhmad Amri Gunawan, mengucapkan terima kasih.
              </p>

              <p className="mt-3">
                Terima kasih karena telah membuka, mengingat, dan menjaga kembali cerita yang pernah kita jalani bersama.
              </p>

              <p className="mt-3">
                Semoga setiap kenangan yang tersimpan di aplikasi ini menjadi pengingat,
              </p>

              <p>
                bahwa masa sekolah mungkin telah lewat... tapi jejaknya tetap ada, dan tidak benar-benar hilang.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
