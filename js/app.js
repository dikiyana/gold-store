// =====================================================================
// PUBLIC WEBSITE LOGIC (index.html)
// =====================================================================
// Tanggung jawab file ini:
// 1. Subscribe realtime ke Firestore (onSnapshot) -> harga update otomatis
//    tanpa refresh halaman saat admin mengubah data.
// 2. Render harga beli per gramasi ke tabel & ke dropdown kalkulator
// 3. Render harga jual tunggal
// 4. Render waktu update terakhir
// 5. Menjalankan kalkulator transaksi berdasarkan data live (bukan hardcode)
// 6. Menangani form pemesanan -> kirim ke WhatsApp
// 7. Error handling jika Firestore/internet tidak tersedia
// =====================================================================

import { db } from "./firebase.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const GRAM_KEYS = ["0.5", "1", "2", "3", "5", "10", "25", "50", "100"];

// State harga yang sedang aktif, diisi oleh listener realtime.
// Kalkulator & form selalu membaca dari sini, BUKAN dari angka hardcode.
let livePrices = {
  buyPrices: {},
  sellPrice: 0,
  updatedAt: null
};

// ----------------------------------------------------------------------
// ELEMENT REFERENCES
// ----------------------------------------------------------------------
const hargaBeliEl = document.getElementById("hargaBeli");     // ringkasan harga termurah (0.5gr) di hero price-box
const hargaJualEl = document.getElementById("hargaJual");
const updateTimeEl = document.getElementById("updateTime");
const tableBody = document.getElementById("hargaTableBody");
const gramasiSelect = document.getElementById("gramasi");
const connectionWarning = document.getElementById("connectionWarning");

// ----------------------------------------------------------------------
// FORMAT HELPERS
// ----------------------------------------------------------------------
function formatRupiah(value) {
  if (value === undefined || value === null || Number.isNaN(value)) return "0";
  return Number(value).toLocaleString("id-ID");
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "-";
  const dateObj = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return dateObj.toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });
}

// ----------------------------------------------------------------------
// RENDER: Tabel Harga Beli per Gramasi
// ----------------------------------------------------------------------
function renderPriceTable() {
  if (!tableBody) return;
  tableBody.innerHTML = "";

  // Urutkan dari gramasi terbesar ke terkecil, konsisten dengan desain awal
  [...GRAM_KEYS].reverse().forEach((gram) => {
    const price = livePrices.buyPrices[gram];
    if (price === undefined) return; // skip gramasi yang belum diisi admin

    const row = document.createElement("tr");
    row.innerHTML = `<td>${gram}</td><td>Rp ${formatRupiah(price)}</td>`;
    tableBody.appendChild(row);
  });
}

// ----------------------------------------------------------------------
// RENDER: Dropdown Kalkulator (hanya gramasi yang punya harga)
// ----------------------------------------------------------------------
function renderGramasiOptions() {
  if (!gramasiSelect) return;
  const previousValue = gramasiSelect.value;
  gramasiSelect.innerHTML = "";

  GRAM_KEYS.forEach((gram) => {
    if (livePrices.buyPrices[gram] === undefined) return;
    const option = document.createElement("option");
    option.value = gram;
    option.textContent = `${gram} gram`;
    gramasiSelect.appendChild(option);
  });

  // Pertahankan pilihan user jika masih tersedia setelah update data
  if ([...gramasiSelect.options].some((o) => o.value === previousValue)) {
    gramasiSelect.value = previousValue;
  }
}

// ----------------------------------------------------------------------
// RENDER: Ringkasan Harga di Hero (Beli termurah & Jual)
// ----------------------------------------------------------------------
function renderSummary() {
  if (hargaBeliEl) {
    const cheapestGram = GRAM_KEYS.find((g) => livePrices.buyPrices[g] !== undefined);
    hargaBeliEl.textContent = cheapestGram ? formatRupiah(livePrices.buyPrices[cheapestGram]) : "0";
  }
  if (hargaJualEl) {
    hargaJualEl.textContent = formatRupiah(livePrices.sellPrice);
  }
  if (updateTimeEl) {
    updateTimeEl.textContent = formatTimestamp(livePrices.updatedAt);
  }
}

function renderAll() {
  renderPriceTable();
  renderGramasiOptions();
  renderSummary();
}

// ----------------------------------------------------------------------
// REALTIME LISTENER
// ----------------------------------------------------------------------
// onSnapshot() dipakai (bukan getDoc sekali saja) sesuai requirement:
// jika admin mengganti harga, halaman ini update otomatis tanpa refresh.
const currentPriceRef = doc(db, "gold_prices", "current");

onSnapshot(
  currentPriceRef,
  (snap) => {
    hideConnectionWarning();

    if (!snap.exists()) {
      showConnectionWarning("Data harga belum tersedia. Silakan hubungi admin.");
      return;
    }

    const data = snap.data();
    livePrices = {
      buyPrices: data.buyPrices || {},
      sellPrice: data.sellPrice || 0,
      updatedAt: data.updatedAt || null
    };

    renderAll();
  },
  (error) => {
    // Error handling: Firestore unavailable / permission issue
    console.error("Gagal memuat harga realtime:", error);
    showConnectionWarning("Gagal memuat harga terbaru. Periksa koneksi internet Anda.");
  }
);

function showConnectionWarning(message) {
  if (!connectionWarning) return;
  connectionWarning.textContent = message;
  connectionWarning.classList.remove("hidden");
}

function hideConnectionWarning() {
  if (!connectionWarning) return;
  connectionWarning.classList.add("hidden");
}

window.addEventListener("offline", () => showConnectionWarning("Anda sedang offline. Harga yang ditampilkan mungkin tidak terbaru."));
window.addEventListener("online", hideConnectionWarning);

// ----------------------------------------------------------------------
// KALKULATOR TRANSAKSI (memakai livePrices, tidak ada angka hardcode)
// ----------------------------------------------------------------------
window.hitung = function hitung() {
  const jenis = document.getElementById("jenis").value;
  const gramasi = document.getElementById("gramasi").value;
  const jumlah = document.getElementById("jumlah").value;

  if (!jumlah || jumlah <= 0) {
    alert("Masukkan jumlah keping yang valid.");
    return;
  }

  let hargaSatuan = 0;

  if (jenis === "beli") {
    hargaSatuan = livePrices.buyPrices[gramasi];
    if (hargaSatuan === undefined) {
      alert("Harga untuk gramasi ini belum tersedia.");
      return;
    }
  } else {
    // Sell price sama untuk semua gramasi, dikalikan dengan total gram (gram x jumlah keping)
    hargaSatuan = livePrices.sellPrice * Number(gramasi);
  }

  const total = hargaSatuan * Number(jumlah);
  document.getElementById("total").innerText = formatRupiah(total);
};

// ----------------------------------------------------------------------
// FORM PEMESANAN -> WHATSAPP
// ----------------------------------------------------------------------
const orderForm = document.getElementById("orderForm");
if (orderForm) {
  orderForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const nama = document.getElementById("nama").value;
    const berat = document.getElementById("berat").value;
    const jenis = document.getElementById("jenisOrder").value;

    const pesan = `Assalamu'alaikum,
Saya ingin *${jenis} emas*.

Nama: ${nama}
Berat: ${berat} gram

Mohon info harga hari ini.`;

    const nomorAdmin = "6285741162115";
    const url = `https://wa.me/${nomorAdmin}?text=${encodeURIComponent(pesan)}`;
    window.open(url, "_blank");
  });
}
