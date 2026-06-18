// =====================================================================
// FIREBASE CONFIGURATION
// =====================================================================
// File ini adalah SATU-SATUNYA tempat konfigurasi Firebase didefinisikan.
// Semua file lain (app.js, admin.js, auth.js) mengimpor instance dari sini.
//
// CARA MENDAPATKAN CONFIG INI:
// 1. Buka https://console.firebase.google.com
// 2. Pilih project Anda (atau buat baru)
// 3. Klik ikon gear (Project Settings)
// 4. Scroll ke "Your apps" > pilih Web App (</>) 
// 5. Copy object firebaseConfig ke bawah ini
// =====================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// GANTI dengan konfigurasi project Firebase Anda sendiri.
// Nilai-nilai ini AMAN untuk berada di sisi client (bukan rahasia),
// keamanan sesungguhnya diatur lewat Firestore Security Rules, bukan di sini.
const firebaseConfig = {
  apiKey: "AIzaSyAvHHsmn7Fi4FUk7kMBbsqYLmuNAXZbXFc",
  authDomain: "aurum-gold-38739.firebaseapp.com",
  projectId: "aurum-gold-38739",
  storageBucket: "aurum-gold-38739.firebasestorage.app",
  messagingSenderId: "670517281068",
  appId: "1:670517281068:web:354d2fa95c885d0a766c89",
  measurementId: "G-EB9XMSV541"
};


// Inisialisasi Firebase App (singleton, dipakai bersama oleh semua module)
const app = initializeApp(firebaseConfig);

// Export instance Auth & Firestore agar bisa dipakai di file lain
export const auth = getAuth(app);
export const db = getFirestore(app);
