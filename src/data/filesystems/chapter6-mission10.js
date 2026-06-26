// Chương 6 — Mission 10: SSRF & lộ thông tin (internal, cloud metadata, file://, flag).
// curl là tool -> output canned. Flag đặt THẬT trong /var/www để step cuối cat đọc được.
export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/fetch.php': {
    type: 'file',
    content: [
      '<?php',
      '// VULN SSRF: lấy URL người dùng nhập rồi server tự đi request, không whitelist host',
      '$url = $_GET["url"];',
      'echo file_get_contents($url);',
      '?>',
    ].join('\n'),
  },
  '/var/www/html/admin': { type: 'dir' },
  '/var/www/html/admin/flag.txt': { type: 'file', content: 'FLAG{ssrf_to_cloud_metadata_and_internal_admin}' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': { type: 'file', content: 'http://target/fetch.php?url=... — SSRF. Thử localhost/admin, 169.254.169.254 metadata, file:///etc/passwd.' },
};
