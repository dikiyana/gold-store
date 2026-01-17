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
