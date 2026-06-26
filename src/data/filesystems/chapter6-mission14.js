// Chương 6 — Mission 14: Insecure Deserialization — PHP object injection qua cookie.
// curl là tool -> output canned. FS giữ source profile.php lộ class có magic method __wakeup/__destruct nguy hiểm.
export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/profile.php': {
    type: 'file',
    content: [
      '<?php',
      '// VULN: unserialize() trực tiếp dữ liệu từ cookie do client gửi, không validate',
      'class Logger {',
      '  public $logFile = "/var/log/app.log";',
      '  public function __destruct() { file_put_contents($this->logFile, "closed\\n", FILE_APPEND); }',
      '}',
      '$data = unserialize(base64_decode($_COOKIE["prefs"]));',
      'echo "Prefs loaded.";',
      '?>',
    ].join('\n'),
  },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content:
      'Endpoint: http://target/profile.php — cookie "prefs" là base64(serialize(...)). Class Logger có __destruct ghi file: đổi $logFile -> ghi đè file tuỳ ý (vd webshell).',
  },
};
