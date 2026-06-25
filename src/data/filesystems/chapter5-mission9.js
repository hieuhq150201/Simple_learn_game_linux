// Chương 5 — Mission 9: Soi lỗ hổng web (whatweb, nikto, rồi cat flag ở path tìm được).
// whatweb/nikto là tool -> output canned (nikto lộ /backup/). Flag đặt thật trong /backup.
export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/index.php': { type: 'file', content: '<h1>Acme Corp Portal</h1>' },
  // Directory indexing bật -> nikto report ra, và flag để lộ trong backup cũ.
  '/var/www/html/backup': { type: 'dir' },
  '/var/www/html/backup/note.txt': {
    type: 'file',
    content: 'Thư mục backup quên xoá, lại bật directory listing. Flag recon nằm cạnh đây.',
  },
  '/var/www/html/backup/flag.txt': { type: 'file', content: 'FLAG{passive_then_active_recon_owns_the_surface}' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': { type: 'file', content: 'Web: http://10.10.14.55/. Fingerprint tech stack + scan lỗ hổng, tìm path để lộ.' },
};
