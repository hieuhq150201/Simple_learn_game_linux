// Chương 6 — Mission 19: Burp Repeater + Intruder workflow trên reset-password token đoán được.
// burpsuite/curl là tool -> output canned (intruder brute token 4 số, repeater confirm). FS giữ note quan sát ban đầu.
export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/reset.php': {
    type: 'file',
    content: [
      '<?php',
      '// VULN: token reset password chỉ là số 4 chữ số (0000-9999), không rate-limit, không hết hạn',
      '$token = $_GET["token"];',
      '$email = $_GET["email"];',
      'if (check_reset_token($email, $token)) { echo "Token valid. Set new password."; }',
      'else { echo "Invalid token."; }',
      '?>',
    ].join('\n'),
  },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/burp_note.txt': {
    type: 'file',
    content:
      'Intercept request GET /reset.php?email=admin@acme-corp.com&token=0000 bằng Burp Proxy. Gửi sang Repeater để chỉnh tay từng token thử nghiệm; gửi sang Intruder, đặt payload position ở token, dùng Numbers payload 0000-9999 để brute toàn bộ trong vài giây.',
  },
};
