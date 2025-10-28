# Sistem Kehadiran Guru - SMP ASH SOLIHIN

## 📋 Overview

Sistem kehadiran guru yang telah dikembangkan untuk menangani skenario yang Anda berikan, di mana guru dapat hadir pada hari di luar jadwal resmi mereka.

## 🏗️ Struktur Database

### 1. TeacherSchedule (Jadwal Guru)
- Menyimpan jadwal resmi guru berdasarkan hari (Senin-Minggu)
- Contoh: Guru A jadwal Senin, Rabu, Jumat (07:00-15:00)

### 2. TeacherAttendanceLog (Log Kehadiran Aktual)
- Mencatat kehadiran aktual guru setiap hari
- Memiliki field `isScheduled` untuk menandai apakah kehadiran sesuai jadwal
- Menghitung overtime (lembur) otomatis

## 🔄 Alur Kerja Sistem

### Skenario: Guru Hadir di Luar Jadwal

**Contoh Kasus:**
- Guru A dijadwalkan hari Senin, Rabu, Jumat
- Guru A datang pada hari Selasa (luar jadwal)

**Proses Sistem:**

1. **Penentuan Jadwal**
   ```sql
   -- Sistem mengecek jadwal guru untuk hari tersebut
   SELECT * FROM teacher_schedules 
   WHERE teacherId = 'guru-A-id' AND dayOfWeek = 2; -- 2 = Selasa
   -- Result: Tidak ada jadwal (NULL)
   ```

2. **Pencatatan Kehadiran**
   ```sql
   -- Saat guru check-in pada hari Selasa
   INSERT INTO teacher_attendance_logs (
     teacherId, date, checkInTime, status, isScheduled
   ) VALUES (
     'guru-A-id', '2024-01-16', '08:00:00', 'HADIR', false
   );
   ```

3. **Penandaan Status**
   - `isScheduled: false` → Menandakan kehadiran luar jadwal
   - Sistem akan menampilkan badge "Lu Jadwal" pada interface

## 🎯 Fitur Utama

### 1. Manajemen Jadwal (Admin)
- **Create**: Menambah jadwal reguler guru
- **Read**: Melihat semua jadwal guru
- **Update**: Mengubah jadwal yang ada
- **Delete**: Menghapus jadwal
- **Conflict Detection**: Mencegah jadwal bentrok

### 2. Pencatatan Kehadiran (Admin & Guru)
- **Manual Check-in**: Admin dapat mencatat kehadiran guru
- **Auto Check-in**: Guru dapat check-in sendiri
- **Overtime Calculation**: Hitung lembur otomatis
- **Schedule Detection**: Otomatis deteksi jadwal vs aktual

### 3. Monitoring Kehadiran (Guru)
- **Today's Status**: Lihat status hari ini
- **Weekly View**: Lihat jadwal dan kehadiran mingguan
- **Statistics**: Tingkat kehadiran, total lembur
- **Time Tracking**: Jam masuk/keluar real-time

## 📱 Interface Pengguna

### Admin Dashboard
```
Manajemen Jadwal Guru
├── Tambah Jadwal Baru
├── Edit Jadwal Exist
├── Hapus Jadwal
└── Lihat Semua Jadwal

Manajemen Kehadiran
├── Catat Kehadiran Manual
├── Filter Berdasarkan Tanggal/Guru
├── Lihat Log Kehadiran
└── Export Data
```

### Guru Dashboard
```
Kehadiran Guru
├── Status Hari Ini
│   ├── Jadwal (Sesuai/Lu Jadwal)
│   ├── Check-in/Check-out Button
│   └── Jam Kerja
├── Statistik Mingguan
│   ├── Total Hadir
│   ├── Tingkat Kehadiran
│   └── Total Lembur
└── Kalender Mingguan
    ├── Jadwal Resmi
    ├── Kehadiran Aktual
    └── Status Setiap Hari
```

## 🔧 API Endpoints

### Admin Routes
- `GET /api/admin/schedule` - Ambil semua jadwal
- `POST /api/admin/schedule` - Buat jadwal baru
- `PUT /api/admin/schedule/:id` - Update jadwal
- `DELETE /api/admin/schedule/:id` - Hapus jadwal
- `GET /api/admin/attendance` - Ambil log kehadiran
- `POST /api/admin/attendance` - Catat kehadiran manual

### Guru Routes
- `GET /api/guru/attendance` - Lihat jadwal & kehadiran
- `POST /api/guru/attendance` - Check-in/Check-out

## 📊 Contoh Data

### TeacherSchedule
| teacherId | dayOfWeek | startTime | endTime | subject |
|-----------|-----------|-----------|---------|---------|
| guru-1    | 1         | 07:00     | 15:00   | Matematika |
| guru-1    | 3         | 07:00     | 15:00   | Matematika |
| guru-1    | 5         | 07:00     | 15:00   | Matematika |

### TeacherAttendanceLog
| teacherId | date       | checkInTime | checkOutTime | status | isScheduled | overtimeHours |
|-----------|------------|-------------|--------------|--------|-------------|---------------|
| guru-1    | 2024-01-15 | 07:00       | 15:30        | HADIR  | true        | 0.5           |
| guru-1    | 2024-01-16 | 08:00       | 16:00        | HADIR  | false       | 0.0           |

## 🎨 Visual Indicators

### Status Kehadiran
- **HADIR** (Green): Sesuai jadwal
- **HADIR** (Blue): Luar jadwal
- **SAKIT** (Yellow): Sakit
- **IZIN** (Gray): Izin
- **ALPHA** (Red): Tanpa keterangan

### Badge Indicators
- **"Sesuai Jadwal"**: Kehadiran sesuai jadwal resmi
- **"Lu Jadwal"**: Kehadiran di luar jadwal resmi
- **"X jam lembur"**: Total jam lembur terakumulasi

## 🔄 Real-time Updates

Sistem menggunakan WebSocket untuk:
- Real-time check-in/check-out notifications
- Live attendance status updates
- Schedule change notifications

## 📈 Reporting

### Admin Reports
- Attendance summary per period
- Overtime reports
- Schedule compliance analysis
- Individual teacher reports

### Guru Reports
- Personal attendance history
- Overtime accumulation
- Schedule adherence rate
- Monthly summaries

## 🎯 Use Cases

### Case 1: Guru Hadir Sesuai Jadwal
1. Guru A check-in hari Senin 07:00
2. Sistem detect: `isScheduled = true`
3. Status: "Hadir - Sesuai Jadwal"
4. Check-out 15:30 → 0.5 jam lembur

### Case 2: Guru Hadir Luar Jadwal
1. Guru A check-in hari Selasa 08:00
2. Sistem detect: `isScheduled = false`
3. Status: "Hadir - Lu Jadwal"
4. Check-out 16:00 → Tidak ada lembur (luar jadwal)

### Case 3: Guru Tidak Hadir Sesuai Jadwal
1. Guru A tidak check-in hari Rabu
2. Admin catat: "Alpha"
3. Status: "Alpha - Sesuai Jadwal"
4. Memengaruhi tingkat kehadiran

## 🔒 Security & Validation

- JWT authentication untuk semua API
- Role-based access control
- Time validation (tidak bisa check-in di masa depan)
- Duplicate check prevention
- Schedule conflict detection

Sistem ini memberikan fleksibilitas penuh untuk menangani berbagai skenario kehadiran guru sambil tetap mempertahankan akurasi data dan validasi yang ketat.