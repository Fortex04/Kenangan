# Kenangan Kelas - Album Foto & Video

## Overview
Aplikasi web untuk menyimpan kenangan kelas dengan fitur album foto, video, daftar siswa, dan pengaturan tema.

## Fitur Utama

### 1. Album Foto
- Tampilkan koleksi foto kelas dalam format galeri grid
- Tambah foto dengan judul, deskripsi, dan URL
- Hapus foto dari album
- Responsive di semua ukuran layar

### 2. Album Video
- Simpan dan tampilkan video YouTube/Vimeo
- Embed video langsung dengan preview
- Tambah video dengan judul, deskripsi, dan URL
- Hapus video dari album

### 3. Daftar Siswa/Siswi
- Kelola data siswa dengan nama lengkap dan nomor telepon
- Tampilkan dalam format tabel terstruktur
- Fitur tambah, edit, dan hapus siswa
- Nomor urut otomatis

### 4. Pengaturan Aplikasi
- Toggle antara tema gelap dan terang
- Preferensi tersimpan di local storage
- Interface yang user-friendly dengan icon indikator

## Teknologi

### Frontend
- React 18 + TypeScript
- Tailwind CSS untuk styling
- Radix UI untuk komponen accessible
- Tema dengan next-themes context

### Backend
- Express.js server
- Node.js runtime
- Vite untuk development

### Database
- PostgreSQL (Neon)
- Drizzle ORM untuk query builder
- Drizzle Zod untuk validation

## Struktur Project

```
client/
├── src/
│   ├── pages/
│   │   ├── photos.tsx      # Halaman album foto
│   │   ├── videos.tsx      # Halaman album video
│   │   ├── students.tsx    # Halaman daftar siswa
│   │   └── settings.tsx    # Halaman pengaturan tema
│   ├── lib/
│   │   └── theme.tsx       # Theme provider dan hook
│   ├── components/
│   │   └── ui/            # Radix UI components
│   ├── App.tsx            # App layout dengan navigation
│   └── index.css          # Global styles dengan dark mode
├── index.html
└── public/

server/
├── app.ts                 # Express app setup
├── routes.ts              # API routes
├── storage.ts             # Database operations
└── index-*.ts             # Dev/prod entry points

shared/
└── schema.ts              # Drizzle database schema
```

## API Endpoints

### Fotos
- `GET /api/photos` - Ambil semua foto
- `POST /api/photos` - Tambah foto baru
- `DELETE /api/photos/:id` - Hapus foto

### Videos
- `GET /api/videos` - Ambil semua video
- `POST /api/videos` - Tambah video baru
- `DELETE /api/videos/:id` - Hapus video

### Siswa/Siswi
- `GET /api/students` - Ambil daftar siswa
- `POST /api/students` - Tambah siswa baru
- `PUT /api/students/:id` - Edit data siswa
- `DELETE /api/students/:id` - Hapus siswa

## Cara Menggunakan

1. **Tambah Foto**: Klik tab "Foto" → tombol "Tambah Foto" → isi form
2. **Tambah Video**: Klik tab "Video" → tombol "Tambah Video" → isi form dengan URL YouTube/Vimeo
3. **Kelola Siswa**: Klik tab "Siswa" → gunakan tombol untuk tambah/edit/hapus
4. **Ubah Tema**: Klik ikon pengaturan di header → toggle tema gelap/terang

## Theme System

- **Tema Terang**: Background putih, text gelap
- **Tema Gelap**: Background gelap, text terang
- Preferensi disimpan di browser's local storage
- Transition smooth dengan durasi 300ms

## Database Schema

### Photos Table
- `id` (serial, primary key)
- `title` (text)
- `description` (text, optional)
- `url` (text)
- `uploadedAt` (timestamp)

### Videos Table
- `id` (serial, primary key)
- `title` (text)
- `description` (text, optional)
- `url` (text)
- `uploadedAt` (timestamp)

### Students Table
- `id` (serial, primary key)
- `name` (text)
- `phoneNumber` (text)
- `createdAt` (timestamp)

## Environment Variables

Database configuration (otomatis diset):
- `DATABASE_URL` - PostgreSQL connection string
- `PGPORT` - Database port
- `PGHOST` - Database host
- `PGUSER` - Database user
- `PGPASSWORD` - Database password
- `PGDATABASE` - Database name

## Running the Application

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Database migrations
npm run db:push
```

## UI Components

Menggunakan Radix UI + Tailwind CSS:
- Dialog untuk form modal
- Tabs untuk navigation
- Button dengan variants
- Input dan Textarea untuk form
- Table untuk daftar siswa
- Switch untuk tema toggle
- Badge dan Card untuk content display

## Accessibility

- Semantic HTML structure
- Dialog descriptions untuk screen readers
- Keyboard navigation support
- Color contrast ratio yang valid
- ARIA labels di button dan form elements

## Notes

- Data disimpan di PostgreSQL database
- Tidak ada login system (bersifat publik)
- Theme preference disimpan client-side
- Responsive design untuk mobile dan desktop
