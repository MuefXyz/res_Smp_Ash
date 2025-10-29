# Real-Time Attendance System - Testing Guide

## 🚀 **System Overview**

SMP Ash sekarang memiliki sistem **Real-Time Attendance** dengan Socket.IO yang memberikan update langsung saat ada data kehadiran masuk.

## 🔧 **Fitur Real-Time yang Tersedia**

### 1. **Admin Dashboard Real-Time Updates**
- ✅ **Live Notifications** - Notifikasi instan saat guru/staff melakukan absensi
- ✅ **Connection Status** - Indikator koneksi real-time (hijau = connected, merah = disconnected)
- ✅ **Auto Refresh** - Dashboard otomatis refresh saat ada data baru
- ✅ **Toast Notifications** - Pop-up notifikasi untuk setiap aksi

### 2. **Teacher Absence Real-Time**
- ✅ **Instant Admin Notification** - Admin langsung dapat notifikasi saat guru input absensi
- ✅ **Live Dashboard Update** - Statistik dashboard update otomatis
- ✅ **Real-time Status** - Status kehadiran update langsung

### 3. **Staff Card Scan Real-Time**
- ✅ **Live Scan Notification** - Notifikasi instan saat staff scan kartu
- ✅ **Attendance Auto-Update** - Data kehadiran otomatis terupdate
- ✅ **Multi-Client Sync** - Semua admin yang online dapat notifikasi bersamaan

## 🧪 **Cara Testing Real-Time**

### **Persiapan:**
1. **Buka 2 Browser:**
   - Browser 1: Login sebagai **Admin** (http://localhost:3000/admin)
   - Browser 2: Login sebagai **Guru** atau **Staff**

2. **Periksa Koneksi:**
   - Di admin dashboard, lihat indikator "Real-time" harus hijau

---

### **Test 1: Teacher Absence Real-Time**

**Langkah 1: Admin Preparation**
- Buka admin dashboard di Browser 1
- Perhatikan statistik notifikasi (biasanya 0)

**Langkah 2: Teacher Action**
- Di Browser 2, login sebagai guru
- Lakukan absensi (klik tombol "Hadir", "Sakit", atau "Izin")

**Expected Result:**
- ✅ **Browser 1 (Admin):** 
  - Toast notification muncul: "Nama Guru telah melakukan absensi"
  - Statistik notifikasi bertambah
  - Dashboard auto-refresh (jika di tab notifikasi)
- ✅ **Browser 2 (Guru):** 
  - Sukses message muncul
  - Button status berubah

---

### **Test 2: Staff Card Scan Real-Time**

**Langkah 1: Admin Preparation**
- Buka admin dashboard di Browser 1
- Perhatikan notifikasi dan statistik

**Langkah 2: Staff Action**
- Di Browser 2, login sebagai staff
- Pilih card ID dari dropdown
- Klik "Process Scan"

**Expected Result:**
- ✅ **Browser 1 (Admin):**
  - Toast notification: "Nama User telah scan kartu"
  - Notifikasi baru muncul di list
  - Dashboard update otomatis
- ✅ **Browser 2 (Staff):**
  - Success message dengan detail user
  - Scan history terupdate

---

### **Test 3: Multiple Admin Real-Time**

**Langkah 1: Multiple Admin**
- Buka admin dashboard di 3 browser berbeda dengan login admin yang sama

**Langkah 2: Trigger Action**
- Di browser ke-4, login sebagai guru/staff dan lakukan absensi

**Expected Result:**
- ✅ **Semua Admin Browser** (1, 2, 3):
  - Semua dapat notifikasi bersamaan
  - Semua dashboard update otomatis
  - Connection status semua hijau

---

## 🔍 **Troubleshooting**

### **Jika Real-Time Tidak Berfungsi:**

1. **Check Connection Status:**
   - Indikator harus hijau ("Real-time")
   - Jika merah ("Offline"), refresh browser admin

2. **Check Console:**
   - Buka Developer Tools (F12)
   - Cek Console untuk error messages
   - Harus ada: "Socket connected: [socket_id]"

3. **Check Server Log:**
   - Server harus menampilkan: "Socket.IO server running"
   - Harus ada log: "Client connected: [socket_id]"

4. **Manual Refresh:**
   - Refresh admin dashboard
   - Coba lakukan absensi lagi

### **Common Issues:**

❌ **"Connection Failed"**
- Solusi: Refresh browser admin
- Cause: Socket.IO terputus

❌ **"No Notification"**
- Solusi: Check apakah admin sudah join room
- Cause: Socket event tidak ter-register

❌ **"Dashboard Not Update"**
- Solusi: Check fetchData() function
- Cause: Event listener tidak aktif

---

## 📊 **Technical Details**

### **Socket.IO Events:**

#### **Server → Client:**
- `new-notification` - Notifikasi baru untuk admin
- `attendance-update` - Update data kehadiran
- `card-scan-notification` - Notifikasi scan kartu

#### **Client → Server:**
- `join-admin` - Admin join notification room
- `card-scan` - Trigger scan kartu
- `message` - General messaging

### **API Endpoints dengan Real-Time:**

1. **POST /api/guru/absence**
   - Emit: `new-notification`, `attendance-update`

2. **POST /api/staff/scan**
   - Emit: `new-notification`, `card-scan-notification`, `attendance-update`

### **Data Structure:**

```javascript
// Notification Data
{
  id: "absence_1234567890",
  title: "Absensi Guru", 
  message: "Nama Guru telah melakukan absensi (HADIR) hari ini",
  type: "ABSENCE",
  userId: "user_id",
  userName: "Nama Guru",
  timestamp: "2024-01-01T12:00:00.000Z"
}

// Attendance Update
{
  type: "teacher",
  action: "created",
  data: {
    userId: "user_id",
    userName: "Nama Guru", 
    status: "HADIR",
    timestamp: "2024-01-01T12:00:00.000Z"
  }
}
```

---

## ✅ **Success Criteria**

**System berfungsi dengan baik jika:**
- [ ] Admin dapat notifikasi real-time saat guru absensi
- [ ] Admin dapat notifikasi real-time saat staff scan kartu
- [ ] Multiple admin dapat notifikasi bersamaan
- [ ] Dashboard update otomatis tanpa refresh manual
- [ ] Connection status indicator berfungsi
- [ ] Toast notifications muncul dengan tepat
- [ ] Tidak ada error di console browser
- [ ] Server log menunjukkan koneksi aktif

---

**🎉 Selamat! Sistem absensi SMP Ash sekarang real-time!**