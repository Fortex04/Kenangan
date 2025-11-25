import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";
import { Moon, Sun, Info, Lock, LogOut, Send, MessageSquare, X, Trash2, AlertCircle } from "lucide-react";
import { isAdminLoggedIn, loginAdmin, logoutAdmin } from "@/lib/admin-auth";

type Report = {
  id: number;
  subject: string;
  status: string;
  createdAt: string;
  messages: ReportMessage[];
};

type ReportMessage = {
  id: number;
  reportId: number;
  senderType: string;
  message: string;
  createdAt: string;
};

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [isAdmin, setIsAdmin] = useState(isAdminLoggedIn());
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Report states
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportSubject, setReportSubject] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [loadingReports, setLoadingReports] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);

  // Confirmation dialog states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch reports untuk semua user (admin + regular)
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const response = await fetch("/api/reports");
      if (!response.ok) throw new Error("Failed to fetch reports");
      const data = await response.json();
      setReports(data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleAdminLogin = () => {
    if (loginAdmin(password)) {
      setIsAdmin(true);
      setPassword("");
      setError("");
      fetchReports();
    } else {
      setError("Password salah!");
      setPassword("");
    }
  };

  const handleAdminLogout = () => {
    logoutAdmin();
    setIsAdmin(false);
    setPassword("");
    setError("");
    setSelectedReport(null);
  };

  const handleSubmitReport = async () => {
    if (!reportSubject.trim() || !reportMessage.trim()) {
      toast.error("Subjek dan pesan tidak boleh kosong!");
      return;
    }

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: reportSubject,
          message: reportMessage,
        }),
      });

      if (!response.ok) throw new Error("Failed to create report");
      
      setReportSubject("");
      setReportMessage("");
      setShowReportForm(false);
      toast.success("Report berhasil dikirim ke admin!");
      await fetchReports();
    } catch (err) {
      console.error("Error submitting report:", err);
      toast.error("Gagal mengirim report");
    }
  };

  const handleSendReply = async (senderType: "admin" | "user") => {
    if (!selectedReport || !replyMessage.trim()) {
      toast.error("Balasan tidak boleh kosong!");
      return;
    }

    try {
      const response = await fetch(`/api/reports/${selectedReport.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: replyMessage,
          senderType: senderType,
        }),
      });

      if (!response.ok) throw new Error("Failed to send reply");
      
      setReplyMessage("");
      await fetchReports();
      
      // Re-select the report to see the new message
      const updatedReport = reports.find(r => r.id === selectedReport.id);
      if (updatedReport) setSelectedReport(updatedReport);
    } catch (err) {
      console.error("Error sending reply:", err);
      toast.error("Gagal mengirim balasan");
    }
  };

  const handleCloseReport = async () => {
    if (!selectedReport) return;

    try {
      const response = await fetch(`/api/reports/${selectedReport.id}/close`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to close report");
      
      setSelectedReport(null);
      await fetchReports();
      toast.success("Report berhasil ditutup");
    } catch (err) {
      console.error("Error closing report:", err);
      toast.error("Gagal menutup report");
    }
  };

  const handleDeleteReport = async () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteReport = async () => {
    if (!selectedReport) return;

    setShowDeleteConfirm(false);

    try {
      const response = await fetch(`/api/reports/${selectedReport.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to delete report");
      
      setSelectedReport(null);
      await fetchReports();
      toast.success("Report berhasil dihapus");
    } catch (err) {
      console.error("Error deleting report:", err);
      toast.error("Gagal menghapus report");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Pengaturan Aplikasi</h1>

      <div className="space-y-6 max-w-4xl">
        {/* Admin Login */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Admin Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isAdmin ? (
              <div className="space-y-3">
                <Input
                  type="password"
                  placeholder="Masukkan password admin"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAdminLogin();
                    }
                  }}
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button onClick={handleAdminLogin} className="w-full">
                  Login Admin
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-green-600 font-medium">✓ Admin Terlogin</p>
                <p className="text-sm text-muted-foreground">
                  Anda sekarang dapat upload/delete foto dan video di menu Foto dan Album Video, serta menerima report dari user
                </p>
                <Button onClick={handleAdminLogout} variant="destructive" className="w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Report & Chat dengan Admin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin ? (
              // Admin View - Report Dashboard
              <div>
                <h3 className="font-semibold mb-3">Laporan dari User</h3>
                
                {loadingReports ? (
                  <p className="text-muted-foreground">Memuat reports...</p>
                ) : reports.length === 0 ? (
                  <p className="text-muted-foreground">Belum ada report dari user</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Reports List */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium mb-2">Daftar Report ({reports.length})</div>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {reports.map((report) => (
                          <div
                            key={report.id}
                            onClick={() => setSelectedReport(report)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedReport?.id === report.id
                                ? "bg-primary/10 border-primary"
                                : "bg-muted/50 border-border hover:bg-muted"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{report.subject}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(report.createdAt).toLocaleString("id-ID")}
                                </p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                                report.status === "open"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {report.status === "open" ? "Buka" : "Tutup"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Chat View */}
                    {selectedReport && (
                      <div className="flex flex-col border rounded-lg p-4 bg-muted/30">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <p className="font-semibold">{selectedReport.subject}</p>
                            <p className="text-xs text-muted-foreground">
                              Status: {selectedReport.status === "open" ? "Buka" : "Tutup"}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedReport(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 space-y-3 mb-4 overflow-y-auto max-h-48">
                          {selectedReport.messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`p-2 rounded-lg text-sm ${
                                msg.senderType === "admin"
                                  ? "bg-blue-100 text-blue-900 ml-4"
                                  : "bg-gray-100 text-gray-900 mr-4"
                              }`}
                            >
                              <p className="text-xs font-semibold mb-1">
                                {msg.senderType === "admin" ? "Admin" : "User"}
                              </p>
                              <p>{msg.message}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(msg.createdAt).toLocaleTimeString("id-ID")}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Reply Input */}
                        {selectedReport.status === "open" && (
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Tulis balasan..."
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              className="min-h-20 text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSendReply("admin")}
                                className="flex-1"
                              >
                                <Send className="mr-1 h-3 w-3" />
                                Kirim Balasan
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCloseReport}
                              >
                                Tutup Report
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Delete Button (Admin Only) - Always visible */}
                        {selectedReport && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleDeleteReport}
                            className="w-full"
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Hapus Report Selamanya
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // User View - Report Form + Report List
              <div className="space-y-4">
                {!showReportForm ? (
                  <Button onClick={() => setShowReportForm(true)} className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Buat Report Baru
                  </Button>
                ) : (
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Kirim laporan atau masukan Anda kepada admin. Admin akan membalasnya di chat ini.
                    </p>
                    <Input
                      placeholder="Subjek / Judul report"
                      value={reportSubject}
                      onChange={(e) => setReportSubject(e.target.value)}
                    />
                    <Textarea
                      placeholder="Ceritakan masalah atau masukan Anda..."
                      value={reportMessage}
                      onChange={(e) => setReportMessage(e.target.value)}
                      className="min-h-24"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSubmitReport} className="flex-1">
                        <Send className="mr-2 h-4 w-4" />
                        Kirim Report
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowReportForm(false)}
                        className="flex-1"
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                )}

                {/* User Reports List and Chat */}
                {reports.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Report Anda</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Reports List */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium mb-2">Daftar Report ({reports.length})</div>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {reports.map((report) => (
                            <div
                              key={report.id}
                              onClick={() => setSelectedReport(report)}
                              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                selectedReport?.id === report.id
                                  ? "bg-primary/10 border-primary"
                                  : "bg-muted/50 border-border hover:bg-muted"
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{report.subject}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(report.createdAt).toLocaleString("id-ID")}
                                  </p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                                  report.status === "open"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}>
                                  {report.status === "open" ? "Buka" : "Tutup"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Chat View */}
                      {selectedReport && (
                        <div className="flex flex-col border rounded-lg p-4 bg-muted/30">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <p className="font-semibold">{selectedReport.subject}</p>
                              <p className="text-xs text-muted-foreground">
                                Status: {selectedReport.status === "open" ? "Buka" : "Tutup"}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedReport(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Messages */}
                          <div className="flex-1 space-y-3 mb-4 overflow-y-auto max-h-48">
                            {selectedReport.messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`p-2 rounded-lg text-sm ${
                                  msg.senderType === "admin"
                                    ? "bg-blue-100 text-blue-900 ml-4"
                                    : "bg-green-100 text-green-900 mr-4"
                                }`}
                              >
                                <p className="text-xs font-semibold mb-1">
                                  {msg.senderType === "admin" ? "Admin" : "Anda"}
                                </p>
                                <p>{msg.message}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {new Date(msg.createdAt).toLocaleTimeString("id-ID")}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Reply Input */}
                          {selectedReport.status === "open" && (
                            <div className="space-y-2">
                              <Textarea
                                placeholder="Tulis balasan..."
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                className="min-h-20 text-sm"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSendReply("user")}
                                className="w-full"
                              >
                                <Send className="mr-1 h-3 w-3" />
                                Kirim Balasan
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

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

        {/* Fitur dan Informasi - Accordion */}
        <Card>
          <Accordion type="single" collapsible className="w-full">
            {/* Fitur */}
            <AccordionItem value="fitur">
              <AccordionTrigger className="hover:no-underline px-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold">Fitur</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 space-y-4 text-sm leading-relaxed">
                <div>
                  <p className="font-semibold mb-2">Report</p>
                  <p>
                    Pengguna dapat mengirimkan laporan atau keluhan langsung melalui aplikasi. Setiap laporan akan diterima dan ditinjau oleh admin, kemudian akan dibalas oleh admin.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Informasi */}
            <AccordionItem value="informasi">
              <AccordionTrigger className="hover:no-underline px-6">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  <span className="font-semibold">Informasi</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 space-y-4 text-sm leading-relaxed">
                <p>
                  Aplikasi ini dibuat khusus sebagai tempat menyimpan jejak waktu yang perlahan pergi.
                  Foto, video, nama siswa, dan nomor kontak dikumpulkan bukan sekadar sebagai data,
                  tapi sebagai potongan cerita yang suatu hari mungkin sulit kita temukan lagi.
                </p>

                <p>
                  Di sini, setiap momen direkam agar tetap hidup
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
                  melainkan dijaga karena waktu tak selalu memberi kesempatan kedua
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
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Hapus Report?</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus report ini? Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteReport} className="bg-destructive text-destructive-foreground">
              Hapus
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
