const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // يسمح بالوصول من أي دومين (يمكن تخصيصه لاحقاً)
app.use(express.static('public'));
app.use(express.json());

// استخدم المتغيرات البيئية (من إعدادات Railway)
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const SECRET = process.env.PAYPAL_SECRET;

// توكن الوصول
async function generateAccessToken() {
  const auth = Buffer.from(CLIENT_ID + ':' + SECRET).toString('base64');
  const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await response.json();
  return data.access_token;
}

// إنشاء الطلب
app.post('/create-order', async (req, res) => {
  try {
    const accessToken = await generateAccessToken();

    const response = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: {
            currency_code: "USD",
            value: "10.00"
          }
        }]
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error creating PayPal order', details: error });
  }
});

// تأكيد الدفع
app.post('/capture-order/:orderId', async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const accessToken = await generateAccessToken();

    const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error capturing PayPal order', details: error });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
