// Chương 6 — Mission 2: Comment section có stored XSS, payload steal cookie
export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/comments.php': {
    type: 'file',
    content: [
      '<?php',
      '// VULN: echoes the comment straight into HTML, no htmlspecialchars',
      '$c = $_POST["comment"];',
      'file_put_contents("comments.txt", $c, FILE_APPEND);',
      'foreach (file("comments.txt") as $line) { echo "<div>$line</div>"; }',
      '?>',
    ].join('\n'),
  },
  '/var/www/html/comments.txt': { type: 'file', content: 'Great post!\nThanks admin.' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': { type: 'file', content: 'Trang comment: http://target/comments.php — admin sẽ xem comment. Steal cookie admin.' },
};
