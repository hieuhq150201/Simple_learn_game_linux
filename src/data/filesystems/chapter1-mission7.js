// Ch1 M7 — Đường ống thần thánh: pipe (canned) + redirect > (chạy thật).
const access = [
  '10.0.0.5 - - "GET /api/login" 200',
  '203.0.113.7 - - "GET /api/login" 401',
  '203.0.113.7 - - "GET /admin" 403',
  '10.0.0.6 - - "GET /api/login" 200',
  '203.0.113.7 - - "GET /admin" 403',
  '198.51.100.9 - - "POST /api/login" 401',
  '10.0.0.5 - - "GET /dashboard" 200',
].join('\n');

export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/log': { type: 'dir' },
  '/var/log/nginx': { type: 'dir' },
  '/var/log/nginx/access.log': { type: 'file', content: access },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
};
