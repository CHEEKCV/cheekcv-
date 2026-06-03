const https = require('https');

const TAP_SECRET_KEY = process.env.TAP_SECRET_KEY;

function tapPost(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.tap.company',
      path: '/v2/charges',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + TAP_SECRET_KEY,
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); } catch(e) { reject(new Error('Invalid response')); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { customerEmail, customerName } = JSON.parse(event.body || '{}');

    const charge = await tapPost({
      amount: 3.99,
      currency: 'USD',
      customer_initiated: true,
      threeDSecure: true,
      save_card: false,
      description: 'شيًك — تقرير مهني شخصي',
      metadata: { product: 'cheekcv-report' },
      reference: { transaction: 'cheekcv-' + Date.now(), order: 'order-' + Date.now() },
      receipt: { email: true, sms: false },
      customer: {
        first_name: customerName || 'Customer',
        email: customerEmail || ''
      },
      source: { id: 'src_all' },
      post: { url: 'https://cheekcv.xyz/netlify/functions/tap-webhook' },
      redirect: { url: 'https://cheekcv.xyz/ascend_thankyou.html' }
    });

    if (charge.transaction && charge.transaction.url) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ url: charge.transaction.url })
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: charge.errors?.[0]?.description || 'فشل إنشاء الدفع' })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
