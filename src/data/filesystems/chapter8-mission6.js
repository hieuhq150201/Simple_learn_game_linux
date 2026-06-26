// Chương 8 — Box Hard Chain (Hard): nmap -p- -> gobuster /dev API -> JWT alg=none bypass
// -> command injection (user shell) -> find SUID THẬT -> GTFOBins privesc.
// HAI flag: user.txt (sau foothold) và root.txt (sau privesc). SUID liệt kê thật từ FS.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: [
      'BOX HARD CHAIN — Target: 10.10.10.50 (black-box, không hint nhiều).',
      'Chain: nmap -p- (cổng lạ) -> gobuster ra /dev API -> bypass JWT (alg=none)',
      '-> command injection thành user -> find SUID -> GTFOBins -> root. 2 cờ: user.txt + root.txt.',
    ].join('\n'),
  },
  // SUID binaries — find / -perm -4000 sẽ liệt kê THẬT từ đây. /usr/bin/python là vector privesc.
  '/usr/bin/passwd': { type: 'file', mode: '4755', content: '<binary> passwd (suid root)' },
  '/usr/bin/mount': { type: 'file', mode: '4755', content: '<binary> mount (suid root)' },
  '/usr/bin/python3.9': { type: 'file', mode: '4755', content: '<binary> python3.9 (suid root) <- GTFOBins privesc' },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/dev': { type: 'dir' },
  '/var/www/dev/api.js': {
    type: 'file',
    content: "// /dev API — verify(token, secret, {algorithms:['HS256','none']}) // VULN: chấp nhận alg=none",
  },
  '/home/svc': { type: 'dir' },
  // Flag 1: đọc được ngay sau foothold (command injection -> user svc).
  '/home/svc/user.txt': { type: 'file', content: 'FLAG{jwt_none_alg_then_cmd_injection}' },
  '/root': { type: 'dir' },
  // Flag 2: chỉ đọc được sau khi privesc qua SUID lên root.
  '/root/root.txt': { type: 'file', content: 'FLAG{suid_python_gtfobins_root}' },
};
