// =====================================================================
// AUTH MODULE
// =====================================================================
// Berisi fungsi-fungsi reusable untuk autentikasi:
// - login()        : login dengan email + password
// - logout()       : logout & redirect ke login.html
// - protectAdminPage() : guard yang dipasang di admin.html,
//                        redirect ke login.html jika belum login
// =====================================================================

import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

/**
 * Login admin dengan email & password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Logout user yang sedang login, lalu redirect ke login.html.
 */
export function logout() {
  return signOut(auth).then(() => {
    window.location.href = "login.html";
  });
}

/**
 * Guard untuk halaman admin.
 * Dipasang di admin.js paling atas, sebelum render apapun.
 *
 * Perilaku:
 * - Jika user TIDAK login -> redirect ke login.html
 * - Jika user login -> jalankan callback(user) yang diberikan
 *
 * @param {(user: import("firebase/auth").User) => void} onAuthenticated
 */
export function protectAdminPage(onAuthenticated) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // Belum login sama sekali -> tendang ke halaman login
      window.location.href = "login.html";
      return;
    }
    // User valid -> lanjutkan render dashboard
    onAuthenticated(user);
  });
}

/**
 * Guard kebalikan untuk login.html:
 * Jika user SUDAH login, langsung lempar ke admin.html
 * supaya tidak melihat form login lagi.
 */
export function redirectIfAlreadyLoggedIn() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.href = "admin.html";
    }
  });
}
