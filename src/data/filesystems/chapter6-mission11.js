// Chương 6 — Mission 11: Command Injection qua ping tool.
// curl là tool -> output canned (kết quả lệnh chèn thêm). FS giữ source ping.php để cat thấy lỗi.
export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/ping.php': {
    type: 'file',
    content: [
      '<?php',
      '// VULN: host nối thẳng vào shell_exec, không lọc ký tự shell',
      '$host = $_GET["host"];',
      'echo shell_exec("ping -c 1 " . $host);',
      '?>',
    ].join('\n'),
  },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': { type: 'file', content: 'Endpoint: http://target/ping.php?host=... — tool ping nội bộ, nghi command injection.' },
};
