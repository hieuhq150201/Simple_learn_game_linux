// Chương 6 — Mission 17: CSP bypass qua JSONP endpoint được whitelist.
// curl là tool -> output canned (CSP header + payload qua domain trusted). FS giữ response header dump.
export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/headers.txt': {
    type: 'file',
    content: [
      'HTTP/1.1 200 OK',
      "Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted-cdn.acme-corp.com",
      'X-Frame-Options: DENY',
    ].join('\n'),
  },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content:
      'Trang search.php vẫn echo q ra HTML (không sanitize) nhưng CSP đã chặn inline <script>. Tuy nhiên script-src whitelist nguyên domain https://trusted-cdn.acme-corp.com — domain đó có endpoint JSONP callback=... tuỳ ý.',
  },
};
