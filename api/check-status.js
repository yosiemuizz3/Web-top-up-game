const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const txid = req.query.txid;
  const CASAKU_LICENSE_KEY = process.env.CASAKU_LICENSE_KEY;

  const checkRes = await fetch('https://api.casaku.id/api/generate/check-status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-license-key': CASAKU_LICENSE_KEY
    },
    body: JSON.stringify({ transactionId: txid })
  });

  const data = await checkRes.json();
  res.json({ status: data?.data?.status || 'pending' });
};
