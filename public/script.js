let allProducts = [];
let selectedCategory = 'pulsa';
let selectedProduct = null;
let transactionId = null;

const OKE_HARGA_URL = "https://okeconnect.com/harga/json?id=905ccd028329b0a";

function getCategory(kategori) {
  if (!kategori) return "lainnya";
  const kat = kategori.toUpperCase();
  if (kat.includes("PULSA")) return "pulsa";
  if (kat.includes("KUOTA") || kat.includes("DATA")) return "kuota";
  if (kat.includes("GAME") || kat.includes("DIGITAL")) return "game";
  if (kat.includes("PLN") || kat.includes("EWALLET") || kat.includes("TAGIHAN")) return "lainnya";
  return "lainnya";
}

async function loadProducts() {
  try {
    const res = await fetch(OKE_HARGA_URL);
    const data = await res.json();

    allProducts = data
      .filter(p => p.status === "1")
      .map(p => {
        const modal = parseInt(p.harga);
        const hargaJual = modal + 3000;
        return {
          code: p.kode,
          name: p.keterangan,
          modal: modal,
          price: hargaJual,
          category: getCategory(p.kategori)
        };
      });

    renderProducts();
    console.log(`✅ Harga terupdate! Total ${allProducts.length} produk | Untung: Rp 3.000/produk`);
  } catch (err) {
    console.error("❌ Gagal ambil harga:", err);
    alert("⚠️ Gagal memuat daftar produk. Coba muat ulang halaman.");
  }
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '';
  const filtered = allProducts.filter(p => p.category === selectedCategory);
  if (filtered.length === 0) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#888;padding:20px;">Produk sedang kosong</p>';
    return;
  }
  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `<h3>${p.name}</h3><p>Rp ${p.price.toLocaleString()}</p>`;
    card.addEventListener('click', () => selectProduct(p, card));
    grid.appendChild(card);
  });
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedCategory = btn.dataset.category;
    selectedProduct = null;
    document.getElementById('orderForm').style.display = 'none';
    document.getElementById('qrisBox').style.display = 'none';
    renderProducts();
  });
});

function selectProduct(product, card) {
  document.querySelectorAll('.product-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  selectedProduct = product;
  document.getElementById('totalPrice').textContent = `Rp ${product.price.toLocaleString()}`;
  document.getElementById('orderForm').style.display = 'block';
  document.getElementById('qrisBox').style.display = 'none';
  window.scrollTo(0, document.body.scrollHeight);
}

document.getElementById('payBtn').addEventListener('click', async () => {
  const destination = document.getElementById('destination').value.trim();
  if (!destination) return alert('⚠️ Masukkan Nomor HP / User ID Game!');
  document.getElementById('payBtn').textContent = '⏳ Membuat QRIS...';
  document.getElementById('payBtn').disabled = true;

  const res = await fetch('/api/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kode_produk: selectedProduct.code,
      nama_produk: selectedProduct.name,
      amount: selectedProduct.price,
      tujuan: destination
    })
  });

  const data = await res.json();
  if (!data.success) return alert('❌ Gagal: ' + (data.error || 'Coba lagi nanti'));

  transactionId = data.transactionId;
  document.getElementById('qrisImg').src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data.qr_string)}`;
  document.getElementById('payAmount').textContent = `Rp ${selectedProduct.price.toLocaleString()}`;
  document.getElementById('txId').textContent = transactionId;
  document.getElementById('payLink').href = data.payment_url;
  document.getElementById('orderForm').style.display = 'none';
  document.getElementById('qrisBox').style.display = 'block';

  checkStatusLoop();
});

async function checkStatusLoop() {
  const interval = setInterval(async () => {
    if (!transactionId) return;
    const res = await fetch(`/api/check-status?txid=${transactionId}`);
    const data = await res.json();
    if (data.status === 'paid') {
      document.getElementById('statusText').innerHTML = '✅ <strong>BERHASIL!</strong><br>Produk sedang diproses...';
      document.getElementById('statusText').style.color = '#00ff88';
      clearInterval(interval);
    } else if (data.status === 'expired' || data.status === 'cancel') {
      document.getElementById('statusText').textContent = `❌ Transaksi ${data.status}`;
      document.getElementById('statusText').style.color = '#ff6b6b';
      clearInterval(interval);
    }
  }, 5000);
}

document.addEventListener('DOMContentLoaded', loadProducts);
