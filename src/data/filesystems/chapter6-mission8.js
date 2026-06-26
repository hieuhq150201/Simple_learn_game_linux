// Chương 6 — Mission 8: Directory traversal & upload bypass -> webshell RCE.
// curl là tool -> output canned. FS giữ source upload.php lộ filter yếu.
export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/upload.php': {
    type: 'file',
    content: [
      '<?php',
      '// VULN: chỉ chặn đuôi ".php" chính xác (case-sensitive, không chặn .pHp / .php.jpg)',
      '$name = $_FILES["file"]["name"];',
      'if (substr($name, -4) === ".php") { die("Cấm upload .php"); }',
      'move_uploaded_file($_FILES["file"]["tmp_name"], "uploads/" . $name);',
      'echo "Upload xong: uploads/$name";',
      '?>',
    ].join('\n'),
  },
  '/var/www/html/uploads': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': { type: 'file', content: 'http://target/upload.php — filter đuôi yếu. Bypass bằng .pHp/.php.jpg, drop webshell, gọi ?cmd=id.' },
};
