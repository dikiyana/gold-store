// =====================================================================
// ADMIN DASHBOARD LOGIC
// =====================================================================
// Tanggung jawab file ini:
// 1. Memastikan hanya admin yang login bisa melihat dashboard (protectAdminPage)
// 2. Memuat data harga saat ini ke dalam form
// 3. Validasi input (no negative, no empty, no text)
// 4. Simpan perubahan ke Firestore (gold_prices/current)
// 5. Membuat snapshot history di collection price_history
// 6. Menangani UX: loading state, notifikasi sukses/error, status koneksi
// =====================================================================

import { db } from "./firebase.js";
import { protectAdminPage, logout } from "./auth.js";
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Daftar gramasi yang dipakai berulang kali -> didefinisikan sekali di sini
// agar tidak ada duplikasi (DRY) saat membaca/menulis form atau Firestore.
const GRAM_KEYS = ["0.5", "1", "2", "3", "5", "10", "25", "50", "100"];

// Referensi dokumen utama harga emas
const currentPriceRef = doc(db, "gold_prices", "current");

// ----------------------------------------------------------------------
// ELEMENT REFERENCES
// ----------------------------------------------------------------------
const authGate = document.getElementById("authGate");
const adminApp = document.getElementById("adminApp");
const adminEmailEl = document.getElementById("adminEmail");
const logoutBtn = document.getElementById("logoutBtn");
const priceForm = document.getElementById("priceForm");
const saveBtn = document.getElementById("saveBtn");
const formAlert = document.getElementById("formAlert");
const lastUpdatedEl = document.getElementById("lastUpdated");
const lastUpdatedByEl = document.getElementById("lastUpdatedBy");
const offlineBanner = document.getElementById("offlineBanner");

// ----------------------------------------------------------------------
// AUTH GUARD
// ----------------------------------------------------------------------
// Halaman ini diblok sampai status auth diketahui. Jika tidak login,
// protectAdminPage() otomatis redirect ke login.html.
protectAdminPage((user) => {
  authGate.classList.add("hidden");
  adminApp.classList.remove("hidden");
  adminEmailEl.textContent = user.email;
  loadCurrentPrices();
});

logoutBtn.addEventListener("click", () => {
  logout();
});

// ----------------------------------------------------------------------
// KONEKSI INTERNET (Error Handling untuk koneksi terputus)
// ----------------------------------------------------------------------
function updateOnlineStatus() {
  offlineBanner.classList.toggle("hidden", navigator.onLine);
}
window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);
updateOnlineStatus();

// ----------------------------------------------------------------------
// HELPER: Format Tanggal Indonesia
// ----------------------------------------------------------------------
function formatTimestamp(timestamp) {
  if (!timestamp) return "Belum ada data";
  const dateObj = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
  return dateObj.toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short"
  });
}

// ----------------------------------------------------------------------
// LOAD DATA SAAT INI KE FORM
// ----------------------------------------------------------------------
async function loadCurrentPrices() {
  try {
    const snap = await getDoc(currentPriceRef);

    if (!snap.exists()) {
      // Dokumen belum pernah dibuat -> ini wajar untuk first-time setup
      lastUpdatedEl.textContent = "Belum ada data";
      lastUpdatedByEl.textContent = "-";
      return;
    }

    const data = snap.data();

    // Isi setiap field harga beli berdasarkan data Firestore
    GRAM_KEYS.forEach((gram) => {
      const input = document.getElementById(`buy-${gram.replace(".", "_")}`);
      if (input && data.buyPrices && data.buyPrices[gram] !== undefined) {
        input.value = data.buyPrices[gram];
      }
    });

    document.getElementById("sellPrice").value = data.sellPrice ?? "";
    lastUpdatedEl.textContent = formatTimestamp(data.updatedAt);
    lastUpdatedByEl.textContent = data.updatedBy || "-";

  } catch (err) {
    console.error("Gagal memuat data harga:", err);
    showAlert("Gagal memuat data harga saat ini. Periksa koneksi internet Anda.", "error");
  }
}

// ----------------------------------------------------------------------
// VALIDASI FORM
// ----------------------------------------------------------------------
/**
 * Validasi satu input angka harga.
 * Mengembalikan { valid, value, message }
 */
function validatePriceInput(rawValue) {
  // Cek kosong
  if (rawValue === "" || rawValue === null || rawValue === undefined) {
    return { valid: false, message: "Wajib diisi." };
  }

  const value = Number(rawValue);

  // Cek apakah hasil parsing adalah angka valid (menangkap kasus input teks)
  if (Number.isNaN(value)) {
    return { valid: false, message: "Harus berupa angka." };
  }

  // Cek negatif
  if (value < 0) {
    return { valid: false, message: "Tidak boleh bernilai negatif." };
  }

  // Cek nol (opsional secara bisnis, tapi mencegah kesalahan input harga 0)
  if (value === 0) {
    return { valid: false, message: "Harga tidak boleh nol." };
  }

  return { valid: true, value };
}

/**
 * Validasi seluruh form. Menampilkan pesan error di setiap field
 * yang gagal, mengembalikan objek hasil { isValid, buyPrices, sellPrice }.
 */
function validateForm() {
  let isValid = true;
  const buyPrices = {};

  // Bersihkan semua pesan error sebelumnya
  document.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));

  GRAM_KEYS.forEach((gram) => {
    const inputId = `buy-${gram.replace(".", "_")}`;
    const input = document.getElementById(inputId);
    const errorEl = document.getElementById(`err-${inputId}`);

    const result = validatePriceInput(input.value);
    if (!result.valid) {
      errorEl.textContent = result.message;
      input.classList.add("input-error");
      isValid = false;
    } else {
      input.classList.remove("input-error");
      buyPrices[gram] = result.value;
    }
  });

  const sellInput = document.getElementById("sellPrice");
  const sellErrorEl = document.getElementById("err-sellPrice");
  const sellResult = validatePriceInput(sellInput.value);

  let sellPrice = null;
  if (!sellResult.valid) {
    sellErrorEl.textContent = sellResult.message;
    sellInput.classList.add("input-error");
    isValid = false;
  } else {
    sellInput.classList.remove("input-error");
    sellPrice = sellResult.value;
  }

  return { isValid, buyPrices, sellPrice };
}

// ----------------------------------------------------------------------
// NOTIFIKASI UI
// ----------------------------------------------------------------------
function showAlert(message, type = "success") {
  formAlert.textContent = message;
  formAlert.className = `alert alert-${type}`;
  formAlert.classList.remove("hidden");

  // Auto-hide notifikasi sukses setelah beberapa detik
  if (type === "success") {
    setTimeout(() => formAlert.classList.add("hidden"), 4000);
  }
}

function setSaving(isSaving) {
  saveBtn.disabled = isSaving;
  saveBtn.textContent = isSaving ? "Menyimpan..." : "Simpan Perubahan";
}

// ----------------------------------------------------------------------
// SUBMIT FORM -> SIMPAN KE FIRESTORE
// ----------------------------------------------------------------------
priceForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!navigator.onLine) {
    showAlert("Tidak ada koneksi internet. Tidak dapat menyimpan perubahan.", "error");
    return;
  }

  const { isValid, buyPrices, sellPrice } = validateForm();
  if (!isValid) {
    showAlert("Periksa kembali input yang ditandai merah.", "error");
    return;
  }

  setSaving(true);

  try {
    const adminEmail = adminEmailEl.textContent;

    const payload = {
      buyPrices,
      sellPrice,
      updatedAt: serverTimestamp(),
      updatedBy: adminEmail
    };

    // 1. Update dokumen utama yang dibaca oleh website publik
    await setDoc(currentPriceRef, payload);

    // 2. Simpan snapshot ke price_history untuk fitur chart/riwayat di masa depan.
    //    Menggunakan addDoc agar setiap perubahan menjadi dokumen baru (bukan overwrite).
    await addDoc(collection(db, "price_history"), payload);

    showAlert("Gold prices updated successfully.", "success");

    // Refresh tampilan "Last Updated" tanpa perlu reload halaman
    lastUpdatedEl.textContent = formatTimestamp(Timestamp.now());
    lastUpdatedByEl.textContent = adminEmail;

  } catch (err) {
    console.error("Gagal menyimpan harga:", err);

    if (err.code === "permission-denied") {
      showAlert("Akses ditolak. Pastikan akun Anda memiliki izin admin.", "error");
    } else if (!navigator.onLine) {
      showAlert("Koneksi internet terputus saat menyimpan. Coba lagi.", "error");
    } else {
      showAlert("Gagal menyimpan ke server. Silakan coba lagi.", "error");
    }
  } finally {
    setSaving(false);
  }
});
