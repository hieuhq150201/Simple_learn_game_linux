// Chương 6 — Mission 6: Reflected & DOM XSS.
// curl là tool -> output canned (phản chiếu payload). FS giữ source bộc lộ sink.
export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/search.php': {
    type: 'file',
    content: [
      '<?php',
      '// VULN reflected XSS: in thẳng q ra HTML, không htmlspecialchars',
      '$q = $_GET["q"];',
      'echo "<h2>Kết quả cho: $q</h2>";',
      '?>',
    ].join('\n'),
  },
  '/var/www/html/profile.js': {
    type: 'file',
    content: [
      '// VULN DOM XSS: source = location.hash, sink = innerHTML (không sanitize)',
      'const name = decodeURIComponent(location.hash.slice(1));',
      'document.getElementById("greeting").innerHTML = "Xin chào " + name;',
    ].join('\n'),
  },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': { type: 'file', content: 'http://target/search.php?q=... (reflected) và profile.js đọc location.hash -> innerHTML (DOM).' },
};
