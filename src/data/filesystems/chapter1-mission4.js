// Ch1 M4 — Lạc trong cây thư mục: điều hướng + long listing thật.
export default {
  '/': { type: 'dir' },
  '/etc': { type: 'dir' },
  '/etc/passwd': { type: 'file', content: 'root:x:0:0:root:/root:/bin/bash\ndeploy:x:1000:1000:Deploy User:/home/deploy:/bin/bash' },
  '/etc/hostname': { type: 'file', content: 'prod-web-01' },
  '/etc/.hidden_note': { type: 'file', content: 'backup mật khẩu cũ — nhớ xoá file này' },
  '/etc/nginx': { type: 'dir' },
  '/etc/nginx/nginx.conf': { type: 'file', content: 'user www-data;\nworker_processes auto;\ninclude /etc/nginx/conf.d/*.conf;' },
  '/etc/nginx/conf.d': { type: 'dir' },
  '/etc/nginx/conf.d/app.conf': { type: 'file', content: 'server {\n  listen 80;\n  root /var/www/app;\n}' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/.bashrc': { type: 'file', content: 'export PATH=$PATH:/usr/local/bin\nalias ll="ls -la"' },
};
