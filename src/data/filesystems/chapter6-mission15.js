// Chương 6 — Mission 15: JWT alg:none bypass.
// curl/jwt_tool là tool -> output canned (token decode + forge thành admin). FS giữ source auth.php.
export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/auth.php': {
    type: 'file',
    content: [
      '<?php',
      '// VULN: verify JWT bằng jwt_decode($token, $key, $allowed_algs = ["HS256","none"])',
      '// -> cho phép alg "none" nghĩa là KHÔNG kiểm chữ ký gì cả',
      '$token = $_COOKIE["jwt"];',
      '$payload = jwt_decode($token, SECRET_KEY, ["HS256", "none"]);',
      'if ($payload->role === "admin") { echo "Welcome to admin panel"; }',
      '?>',
    ].join('\n'),
  },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/my_token.txt': {
    type: 'file',
    content:
      'JWT của mày (role=user): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiaGFja2VyIiwicm9sZSI6InVzZXIifQ.AbCdEf123signature',
  },
  '/home/hacker/target.txt': { type: 'file', content: 'Endpoint: http://target/auth.php — JWT trong cookie "jwt". Server chấp nhận alg "none".' },
};
