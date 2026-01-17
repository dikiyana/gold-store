function hitung() {
  const hargaBeli = 1050000;
  const hargaJual = 1020000;

  const jenis = document.getElementById("jenis").value;
  const berat = document.getElementById("berat").value;

  let total = 0;

  if (jenis === "beli") {
    total = berat * hargaBeli;
  } else {
    total = berat * hargaJual;
  }

  document.getElementById("total").innerText =
    total.toLocaleString("id-ID");
}
