// Ch1 M9 — Redirect & exit code: find 2>/dev/null chạy thật (engine strip stderr); $? canned.
export default {
  '/': { type: 'dir' },
  '/etc': { type: 'dir' },
  '/etc/ssl': { type: 'dir' },
  '/etc/ssl/cert.pem': { type: 'file', content: '-----BEGIN CERTIFICATE-----\nMIIB...\n-----END CERTIFICATE-----' },
  '/etc/app.conf': { type: 'file', content: 'mode=prod\nport=8080' },
  '/var': { type: 'dir' },
  '/var/secret': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/find-me.conf': { type: 'file', content: 'found=true' },
};
