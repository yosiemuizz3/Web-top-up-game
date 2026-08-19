const crypto = require('crypto');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const rawBody = JSON.stringify(req.body);
  const signature = req.headers['x-casaku-signature'];
  const SECRET = process.env.CASAKU_WEBHOOK_SECRET;

  const expected = crypto.createHmac('sha256', SECRET).update(rawBody).digest('hex');
  if (signature !== expected) {
    console.log('❌ Signature tidak valid!');
    return res.status(403).send('Invalid Signature');
  }

  const { transactionId, status } = req.body;
  console.log('✅ Webhook diterima:', transactionId, status);

  if (status === 'paid') {
    const order = global.__pendingOrders?.[transactionId];
    if (order) {
      console.log('📤 Kirim ke OkeConnect:', order.kode_produk, order.tujuan);
      const okeRes = await fetch(process.env.OKECONNECT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userid: process.env.OKECONNECT_USERID,
          password: process.env.OKECONNECT_PASSWORD,
          ref_id: transactionId,
          kode_produk: order.kode_produk,
          tujuan: order.tujuan,
          amount: order.amount
        })
      });
      console.log('✅ Respons OkeConnect:', await okeRes.text());
      delete global.__pendingOrders?.[transactionId];
    }
  }
  res.send('OK');
};
