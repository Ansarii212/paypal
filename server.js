const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

const CLIENT_ID = 'AeFqVpOKkOztbT1Ifp62Hml9ON6xd7XLX7Wuqy6PcSxd35K6WmcCj66tnAZmqpLoQ_ImiEZKB5ZdDJ8B';
const SECRET = 'EDM_xgdkjnFFWxFHpzluk38boQ2RSE3AWvHPLkkKHkA221bzS-j96GafbXjfGn-lmU0CCl4XyC7FIHwk';

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

app.post('/create-order', async (req, res) => {
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
});

app.post('/capture-order/:orderId', async (req, res) => {
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
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
