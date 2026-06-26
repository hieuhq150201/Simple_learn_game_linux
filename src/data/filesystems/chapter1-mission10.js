// Ch1 M10 — xem log (head/tail -f/less). Bước có output canned; fs đủ để cat/cd nếu cần.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/etc': { type: 'dir' },
  '/etc/app.conf': {
    type: 'file',
    content: [
      'server { listen 80;',
      '  root /var/www;',
      '  index index.html;',
      '  access_log /var/log/app/access.log;',
      '  error_log /var/log/app/error.log;',
      '}',
    ].join('\n'),
  },
  '/var': { type: 'dir' },
  '/var/log': { type: 'dir' },
  '/var/log/app': { type: 'dir' },
  '/var/log/app/production.log': {
    type: 'file',
    content: '12:00:01 GET /health 200\n12:00:04 GET /api/users 200\n12:00:07 POST /login 500',
  },
};
