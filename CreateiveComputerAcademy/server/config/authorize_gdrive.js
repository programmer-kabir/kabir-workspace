const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

// Attempt to load existing client details from local credentials file or env
let localCreds = {};
try {
  const credsPath = path.join(__dirname, 'google_drive_credentials.json');
  if (fs.existsSync(credsPath)) {
    localCreds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
  }
} catch (e) {}

const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID || localCreds.client_id || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET || localCreds.client_secret || 'YOUR_GOOGLE_CLIENT_SECRET';
const PORT = 8085;
const REDIRECT_URI = `http://127.0.0.1:${PORT}`;

const SCOPES = 'https://www.googleapis.com/auth/drive';
const AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPES)}&access_type=offline&prompt=consent`;

console.log('--------------------------------------------------');
console.log('CCA Google Drive 5TB Authorization Service');
console.log('Listening on ' + REDIRECT_URI);
console.log('--------------------------------------------------');
console.log('Please click or open this URL in your browser:');
console.log(AUTH_URL);
console.log('--------------------------------------------------');

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  if (parsed.pathname === '/' && parsed.query.code) {
    const code = parsed.query.code;
    console.log('Authorization code received! Exchanging for tokens...');

    const postData = new URLSearchParams({
      code: code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    }).toString();

    const tokenReq = https.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (tRes) => {
      let tBody = '';
      tRes.on('data', chunk => tBody += chunk);
      tRes.on('end', () => {
        try {
          const json = JSON.parse(tBody);
          if (json.refresh_token) {
            console.log('SUCCESS: Refresh Token Received!');

            const credsData = {
              client_id: CLIENT_ID,
              client_secret: CLIENT_SECRET,
              refresh_token: json.refresh_token,
              access_token: json.access_token,
              expires_at: Math.floor(Date.now() / 1000) + (json.expires_in || 3600),
              type: 'authorized_user',
              user_email: 'creativecomputeracademybd@gmail.com'
            };

            const credsPath = path.join(__dirname, 'google_drive_credentials.json');
            fs.writeFileSync(credsPath, JSON.stringify(credsData, null, 2), 'utf8');
            console.log('Updated:', credsPath);

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
              <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #10b981; font-size: 28px;">🎉 Google Drive 5TB Connected Successfully!</h1>
                <p style="font-size: 16px; color: #475569;">Refresh Token সফলভাবে সেভ হয়েছে। এখন সব ফাইল সরাসরি আপনার ৫টিবি ড্রাইভের CCA_Vault ফোল্ডারে আপলোড হবে।</p>
                <p style="color: #94a3b8; font-size: 13px;">আপনি এই ব্রাউজার ট্যাবটি বন্ধ করে দিতে পারেন।</p>
              </div>
            `);

            setTimeout(() => {
              console.log('Server shutting down successfully.');
              process.exit(0);
            }, 1000);
          } else {
            console.error('Failed to get refresh token:', tBody);
            res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<h3>Error: Refresh token not returned.</h3><pre>${tBody}</pre>`);
          }
        } catch (e) {
          console.error('Error parsing token response:', e);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error parsing token response');
        }
      });
    });

    tokenReq.write(postData);
    tokenReq.end();
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Waiting for authorization code...');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running at http://127.0.0.1:${PORT}/`);
});
