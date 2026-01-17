const hargaBeli = 1050000;
const hargaJual = 1020000;

function hitung() {
  const jenis = document.getElementById("jenis").value;
  const berat = document.getElementById("berat").value || 0;

  let total = jenis === "beli"
    ? berat * hargaBeli
    : berat * hargaJual;

  document.getElementById("total").innerText =
    total.toLocaleString("id-ID");
}
