// =====================================================================
// LOGIN PAGE HANDLER
// =====================================================================
// Menangani interaksi form di login.html:
// - Submit form -> panggil login() dari auth.js
// - Tampilkan error jika gagal
// - Redirect ke admin.html jika sudah login (auto-guard)
// =====================================================================

import { login, redirectIfAlreadyLoggedIn } from "./auth.js";

// Jika admin sudah login sebelumnya, langsung lempar ke dashboard
redirectIfAlreadyLoggedIn();

const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

/**
 * Menerjemahkan kode error Firebase Auth ke pesan berbahasa Indonesia
 * yang ramah untuk admin (bukan pesan teknis Firebase).
 */
function translateAuthError(code) {
  switch (code) {
    case "auth/invalid-email":
      return "Format email tidak valid.";
    case "auth/user-disabled":
      return "Akun ini telah dinonaktifkan.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email atau password salah.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan gagal. Coba lagi beberapa saat lagi.";
    case "auth/network-request-failed":
      return "Koneksi internet terputus. Periksa jaringan Anda.";
    default:
      return "Gagal login. Silakan coba lagi.";
  }
}

function showError(message) {
  loginError.textContent = message;
  loginError.classList.remove("hidden");
}

function hideError() {
  loginError.classList.add("hidden");
}

function setLoading(isLoading) {
  loginBtn.disabled = isLoading;
  loginBtn.textContent = isLoading ? "Memproses..." : "Masuk";
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showError("Email dan password wajib diisi.");
    return;
  }

  setLoading(true);
  try {
    await login(email, password);
    // onAuthStateChanged di redirectIfAlreadyLoggedIn() akan menangani redirect
    window.location.href = "admin.html";
  } catch (err) {
    showError(translateAuthError(err.code));
    setLoading(false);
  }
});
