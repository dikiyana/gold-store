# AurumGold — Gold Price Management System
## Dokumentasi Lengkap Setup & Deployment

Sistem ini terdiri dari **public website** (menampilkan harga emas realtime) dan **admin dashboard** (untuk mengubah harga), keduanya berjalan murni di static hosting (Netlify) tanpa backend server, dengan Firebase sebagai database & autentikasi.

---

## 1. Struktur Folder

```
/
├── index.html          # Website publik (tampilan harga emas)
├── admin.html          # Dashboard admin (ubah harga)
├── login.html          # Halaman login admin
├── firestore.rules     # Security rules (di-deploy ke Firebase, bukan ke Netlify)
├── css/
│   ├── style.css        # Style untuk website publik
│   └── admin.css        # Style untuk admin & login (tema luxury gold/black)
├── js/
│   ├── firebase.js      # Konfigurasi & inisialisasi Firebase (SATU sumber kebenaran)
│   ├── auth.js          # Fungsi reusable: login, logout, proteksi halaman
│   ├── auth-page.js      # Handler khusus untuk form di login.html
│   ├── app.js            # Logika website publik (realtime listener, kalkulator)
│   └── admin.js          # Logika dashboard admin (form, validasi, simpan data)
└── assets/                # Folder untuk gambar/logo (kosong, isi sesuai kebutuhan)
```

---

## 2. Penjelasan Setiap File

### `js/firebase.js`
Satu-satunya tempat konfigurasi Firebase (`firebaseConfig`) didefinisikan. Mengekspor instance `auth` dan `db` yang diimpor oleh semua file lain. Jika project Firebase berganti, **hanya file ini yang perlu diubah**.

### `js/auth.js`
Modul reusable berisi:
- `login(email, password)` — login dengan Firebase Auth.
- `logout()` — logout lalu redirect ke `login.html`.
- `protectAdminPage(callback)` — guard yang dipasang di `admin.js`; jika user belum login, otomatis redirect ke `login.html`.
- `redirectIfAlreadyLoggedIn()` — dipakai di `login.html` agar user yang sudah login tidak melihat form login lagi.

### `js/auth-page.js`
Khusus menangani interaksi form di `login.html` (submit, validasi kosong, terjemahan pesan error Firebase ke Bahasa Indonesia, loading state tombol).

### `js/app.js`
Logika untuk `index.html`:
- Subscribe ke Firestore dengan `onSnapshot()` (realtime, bukan `getDoc()` sekali saja) → setiap kali admin mengubah harga, halaman publik update otomatis tanpa refresh.
- Merender tabel harga, dropdown kalkulator, dan ringkasan harga — semuanya dari data Firestore, **tidak ada angka hardcode**.
- Kalkulator transaksi: Harga Beli dikalikan jumlah keping; Harga Jual dikalikan (gram × jumlah keping) karena sell price berlaku per gram, sama untuk semua ukuran.
- Error handling jika Firestore tidak bisa diakses atau koneksi internet putus.

### `js/admin.js`
Logika untuk `admin.html`:
- Memanggil `protectAdminPage()` di awal — halaman tidak akan menampilkan apa pun sampai status login terverifikasi.
- Memuat harga saat ini ke dalam form (`getDoc`).
- Validasi setiap input: tidak boleh kosong, tidak boleh negatif, tidak boleh nol, harus berupa angka (otomatis menolak input teks karena `<input type="number">` + `Number.isNaN` check).
- Saat disimpan: menulis ke `gold_prices/current` (`setDoc`) **dan** menambah entri baru ke `price_history` (`addDoc`) untuk keperluan fitur grafik/riwayat di masa depan.
- Menampilkan notifikasi sukses "Gold prices updated successfully.", loading state pada tombol Save, dan banner peringatan jika koneksi internet terputus.

### `firestore.rules`
Aturan keamanan: siapa pun bisa **membaca** (`read`) data harga (diperlukan agar website publik bisa menampilkan harga tanpa login), tetapi hanya user yang **sudah login** (`request.auth != null`) yang bisa **menulis**. Ada juga validasi struktur data sebagai lapisan keamanan kedua di level server (selain validasi di `admin.js`).

---

## 3. Setup Firebase dari Nol

### Langkah 1 — Buat Project Firebase
1. Buka [console.firebase.google.com](https://console.firebase.google.com)
2. Klik **Add project** → beri nama (misal `aurumgold`) → ikuti wizard sampai selesai.

### Langkah 2 — Aktifkan Authentication
1. Di sidebar, klik **Build → Authentication → Get started**.
2. Pilih tab **Sign-in method** → aktifkan provider **Email/Password**.
3. Klik tab **Users** → **Add user** → masukkan email & password admin Anda.
   (Ini adalah akun yang akan dipakai untuk login ke `admin.html`.)

### Langkah 3 — Aktifkan Firestore Database
1. Klik **Build → Firestore Database → Create database**.
2. Pilih lokasi server (misalnya `asia-southeast2` untuk Indonesia) → mode **Production**.
3. Setelah database aktif, buka tab **Rules**, hapus semua isi, lalu copy-paste seluruh isi file `firestore.rules` dari proyek ini → klik **Publish**.

### Langkah 4 — Buat Dokumen Awal Harga (opsional, bisa juga lewat admin panel)
1. Di Firestore, klik **Start collection** → nama collection: `gold_prices`.
2. Document ID: `current`.
3. Tambahkan field-field berikut (atau lewati langkah ini — admin panel akan otomatis membuatnya saat pertama kali klik Save):

| Field | Type | Contoh nilai |
|---|---|---|
| buyPrices | map | `{"0.5": 1120000, "1": 2050000, ...}` |
| sellPrice | number | `1850000` |
| updatedAt | timestamp | (otomatis dari server) |
| updatedBy | string | `"admin@aurumgold.com"` |

### Langkah 5 — Daftarkan Web App & Ambil Config
1. Klik ikon **gear (⚙) → Project settings**.
2. Scroll ke bawah ke **Your apps** → klik ikon **`</>`  (Web)**.
3. Beri nama app (misal `aurumgold-web`) → **Register app**.
4. Copy object `firebaseConfig` yang muncul.
5. Buka file `js/firebase.js` di proyek ini, ganti nilai `firebaseConfig` dengan yang baru Anda copy.

> **Catatan keamanan:** `apiKey` dan config lain di `firebase.js` **bukan rahasia** — mereka aman untuk berada di kode client. Keamanan sesungguhnya diatur oleh Firestore Security Rules (`firestore.rules`), bukan dengan menyembunyikan config ini.

---

## 4. Deployment ke Netlify

Karena ini tetap proyek static site (HTML/CSS/JS murni, tanpa build step), deployment ke Netlify sangat sederhana:

### Opsi A — Drag & Drop
1. Buka [app.netlify.com](https://app.netlify.com) → login.
2. Pada dashboard, drag seluruh folder proyek (yang sudah berisi `index.html`, `admin.html`, `login.html`, `css/`, `js/`) ke area "Drag and drop your site folder here".
3. Netlify otomatis deploy dan memberi URL (misal `aurumgold.netlify.app`).

### Opsi B — Hubungkan ke Git Repository (disarankan untuk update berkelanjutan)
1. Push seluruh folder proyek ini ke repository GitHub/GitLab.
2. Di Netlify, klik **Add new site → Import an existing project**.
3. Pilih repository Anda.
4. Build settings: kosongkan **Build command**, set **Publish directory** ke `.` (root), karena tidak ada proses build (vanilla JS, tidak perlu bundler).
5. Klik **Deploy site**.

### Langkah Penting Setelah Deploy: Authorized Domains
Firebase Authentication hanya mengizinkan login dari domain yang terdaftar:
1. Buka Firebase Console → **Authentication → Settings → Authorized domains**.
2. Klik **Add domain** → masukkan domain Netlify Anda (misal `aurumgold.netlify.app`, dan domain custom jika ada).

Tanpa langkah ini, login di `login.html` akan gagal saat diakses dari domain Netlify.

---

## 5. Cara Pakai Sehari-hari

1. Admin membuka `https://domainanda.com/login.html` → login dengan email & password yang dibuat di Langkah 2.
2. Setelah login, otomatis diarahkan ke `admin.html`.
3. Isi/ubah harga beli per gramasi dan harga jual → klik **Simpan Perubahan**.
4. Website publik (`index.html`) yang sedang dibuka siapa pun di seluruh dunia akan **otomatis update** dalam hitungan detik, tanpa perlu refresh — ini berkat `onSnapshot()` realtime listener.
5. Setiap kali Save, sebuah snapshot baru juga tersimpan di collection `price_history` — siap dipakai nanti untuk fitur grafik tren harga.

---

## 6. Keamanan — Ringkasan

- **Autentikasi**: hanya Email+Password lewat Firebase Auth; tidak ada self-registration di `login.html` (admin dibuat manual lewat Firebase Console, mencegah orang sembarangan membuat akun admin).
- **Firestore Rules**: publik hanya bisa `read`; hanya user terautentikasi yang bisa `write`, dan strukturnya divalidasi di level server.
- **Validasi ganda**: input divalidasi di client (`admin.js`, UX cepat) **dan** di server (`firestore.rules`, mencegah manipulasi via DevTools/network request langsung).
- **Auth guard**: `admin.html` tidak pernah menampilkan konten sebelum status login dipastikan (mencegah "flash" data admin ke pengunjung biasa yang sempat membuka URL admin).

---

## 7. Pengembangan Selanjutnya (sesuai bonus requirement)

Collection `price_history` sudah disiapkan dan otomatis terisi setiap kali admin menyimpan harga. Untuk membuat fitur grafik tren harga di masa depan, tinggal query collection ini dengan `orderBy("updatedAt")` dan render menggunakan library chart seperti Chart.js.
