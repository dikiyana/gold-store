const harga = {
  beli: {
    "0.5": 1597000,
    "1": 3054000,
    "2": 6040000,
    "3": 9032000,
    "5": 14615000,
    "10": 29080000,
    "25": 72000000,
    "50": 143200000,
    "100": 284400000
  },
  jual: {
    "0.5": 1500000,
    "1": 2950000,
    "2": 5900000,
    "3": 8800000,
    "5": 14200000,
    "10": 28500000,
    "25": 71000000,
    "50": 141000000,
    "100": 280000000
  }
};


function hitung() {
  const jenis = document.getElementById("jenis").value;
  const gramasi = document.getElementById("gramasi").value;
  const jumlah = document.getElementById("jumlah").value;

  if (!jumlah || jumlah <= 0) {
    alert("Masukkan jumlah gram");
    return;
  }

  const hargaPerGramasi = harga[jenis][gramasi];
  const total = hargaPerGramasi * jumlah;

  document.getElementById("total").innerText =
    total.toLocaleString("id-ID");
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
