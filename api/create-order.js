const fetch = require('node-fetch');

global.__pendingOrders = global.__pendingOrders || {};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { kode_produk, nama_produk, amount, tujuan } = req.body;
  const CASAKU_LICENSE_KEY = process.env.CASAKU_LICENSE_KEY;
  const CASAKU_QRIS_ID = process.env.CASAKU_QRIS_ID;

  const casakuRes = await fetch('https://api.casaku.id/api/generate/qris', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-license-key': CASAKU_LICENSE_KEY
    },
    body: JSON.stringify({
      id: CASAKU_QRIS_ID,
      amount: amount,
      useUniqueCode: true,
      packageIds: [kode_produk],
      expiredInMinutes: 30,
      prefix: 'OKE'
    })
  });

  const casakuData = await casakuRes.json();
  if (!casakuData || !casakuData.data) {
    return res.json({ success: false, error: 'Gagal generate QRIS' });
  }

  const tx = casakuData.data;
  global.__pendingOrders[tx.transactionId] = {
    kode_produk, nama_produk, tujuan, amount, ref_id: tx.transactionId
  };

  res.json({
    success: true,
    transactionId: tx.transactionId,
    qr_string: tx.qr_string,
    payment_url: tx.payment_url,
    totalAmount: tx.totalAmount
  });
};
