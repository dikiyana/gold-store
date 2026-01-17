const hargaEmas = {
  0.5: 1597000,
  1: 3054000,
  2: 6040000,
  3: 9032000,
  5: 14615000,
  10: 29080000,
  25: 72000000,
  50: 143200000,
  100: 284400000
};

function hitung() {
  const jenis = document.getElementById("jenis").value;
  const gramasi = document.getElementById("gramasi").value;

  let harga = hargaEmas[gramasi];

  if (jenis === "jual") {
    // contoh buyback lebih rendah
    harga = harga - 5000 * gramasi;
  }

  document.getElementById("total").innerText =
    harga.toLocaleString("id-ID");
}

document.getElementById("orderForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const nama = document.getElementById("nama").value;
  const wa = document.getElementById("wa").value;
  const berat = document.getElementById("berat").value;
  const jenis = document.getElementById("jenisOrder").value;


  const pesan = `Assalamu’alaikum,
Saya ingin *${jenis} emas*.

Nama: ${nama}
No WA: ${wa}
Berat: ${berat} gram

Mohon info harga hari ini.`;

  const nomorAdmin = "6285741162115";
  const url = `https://wa.me/${nomorAdmin}?text=${encodeURIComponent(pesan)}`;

  window.open(url, "_blank");
});
