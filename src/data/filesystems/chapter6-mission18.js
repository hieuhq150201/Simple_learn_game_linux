// Chương 6 — Mission 18: Session fixation — ép nạn nhân dùng session ID biết trước.
// curl là tool -> output canned (set session trước login, valid sau khi nạn nhân login). FS giữ source login.php.
export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/login.php': {
    type: 'file',
    content: [
      '<?php',
      '// VULN: session_start() KHÔNG kèm session_regenerate_id() sau khi login thành công',
      '// -> session ID trước và sau khi đăng nhập là MỘT, attacker đặt sẵn ID thì chiếm được phiên',
      'session_start();',
      'if (check_credentials($_POST["user"], $_POST["pass"])) {',
      '  $_SESSION["user"] = $_POST["user"];',
      '  // thiếu: session_regenerate_id(true);',
      '  echo "Logged in.";',
      '}',
      '?>',
    ].join('\n'),
  },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content:
      'Kế hoạch: gửi link có sẵn PHPSESSID cho nạn nhân (vd http://target/login.php?PHPSESSID=fixed1234), chờ nạn nhân login bằng session đó, rồi mày dùng CHÍNH session ID đó để vào — vì server không đổi ID sau login.',
  },
};
