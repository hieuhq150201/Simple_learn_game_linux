// Chương 6 — Mission 1: Login form có SQLi, bypass không cần password
export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/login.php': {
    type: 'file',
    content: [
      '<?php',
      '// VULN: input concatenated straight into the query, no prepared statement',
      '$user = $_POST["username"];',
      '$pass = $_POST["password"];',
      '$q = "SELECT * FROM users WHERE username=\'$user\' AND password=\'$pass\'";',
      '$res = mysqli_query($conn, $q);',
      'if (mysqli_num_rows($res) > 0) { echo "Welcome admin"; }',
      '?>',
    ].join('\n'),
  },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': { type: 'file', content: 'Login form: http://target/login.php — nghi có SQLi.' },
};
