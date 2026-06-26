// Chương 7 — Mission 8: Crack mật khẩu.
// cat /etc/shadow THẬT (chứa hash $6$ lab). unshadow/john/hashcat là tool -> output canned.
// LƯU Ý: đây là hash giả của lab, password đã biết = "password123" để dạy, KHÔNG phải hash thật.
export default {
  '/': { type: 'dir' },
  '/etc': { type: 'dir' },
  '/etc/passwd': {
    type: 'file',
    content: [
      'root:x:0:0:root:/root:/bin/bash',
      'svc:x:1001:1001:Service:/home/svc:/bin/bash',
      'hacker:x:1000:1000:hacker:/home/hacker:/bin/bash',
    ].join('\n'),
  },
  '/etc/shadow': {
    type: 'file',
    content: [
      // $6$ = SHA-512; format user:hash:lastchg:min:max:warn:::  (hash lab, không phải thật)
      'root:$6$xyzsalt$3kHq9LpVbN2cR7tWmZ0fJ1dGsP8aQeU5oI4yX6vL.lab.demo.hash.only:19000:0:99999:7:::',
      'svc:$6$abcsalt$Wk2mN9pQ7rT4vY1xZ3cB8dF5gH0jK6lM.lab.weakpass.password123.demo:19000:0:99999:7:::',
      'hacker:$6$mysalt$Aa1Bb2Cc3Dd4Ee5Ff6Gg7Hh8Ii9Jj0.lab.user.hash.placeholder.x:19000:0:99999:7:::',
    ].join('\n'),
  },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/note.txt': {
    type: 'file',
    content: 'Mình đọc được /etc/shadow (đáng ra chỉ root đọc). Gộp với passwd rồi crack offline bằng wordlist.',
  },
};
