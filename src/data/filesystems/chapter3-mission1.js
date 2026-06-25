// Chương 3 — Mission 1: App deploy port 8080 không access được từ ngoài
export default {
  '/': { type: 'dir' },
  '/etc': { type: 'dir' },
  '/etc/nginx': { type: 'dir' },
  '/etc/nginx/sites-enabled': { type: 'dir' },
  '/etc/nginx/sites-enabled/app.conf': {
    type: 'file',
    content: [
      'server {',
      '    listen 127.0.0.1:8080;  # binds localhost only — not reachable from outside',
      '    server_name app.internal;',
      '    location / {',
      '        proxy_pass http://127.0.0.1:3000;',
      '    }',
      '}',
    ].join('\n'),
  },
  '/var': { type: 'dir' },
  '/var/log': { type: 'dir' },
  '/var/log/nginx': { type: 'dir' },
  '/var/log/nginx/access.log': {
    type: 'file',
    content: '127.0.0.1 - - [24/Jun/2026:09:00:01] "GET / HTTP/1.1" 200 512',
  },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
};
