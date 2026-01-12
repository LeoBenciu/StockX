const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/invoices',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer test'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', (d) => {
    console.log('Response:', d.toString());
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.end();
