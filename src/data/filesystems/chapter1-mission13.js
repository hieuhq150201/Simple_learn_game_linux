// Ch1 M13 — find nâng cao (-mtime, -size, -exec). Bước dùng output canned; fs tối thiểu.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/upload.php': { type: 'file', content: '<?php /* webshell nghi vấn */ ?>' },
  '/var/www/index.html': { type: 'file', content: '<h1>home</h1>' },
};
