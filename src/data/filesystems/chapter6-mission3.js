// Chương 6 — Mission 3: API endpoint có IDOR, access data user khác
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/api-docs.txt': {
    type: 'file',
    content: [
      'API DOCS — Acme App',
      'GET /api/user/{id}  -> trả về profile của user id',
      'Tài khoản của mày: user id = 1002 (token đã có sẵn).',
      'VULN: endpoint không kiểm tra ownership -> đổi id để xem user khác.',
      'Mục tiêu: đọc data của admin (user id = 1).',
    ].join('\n'),
  },
};
