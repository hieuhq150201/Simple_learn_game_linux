// Chương 7 — Mission 4: Liệt kê đặc quyền (id, sudo -l, uname -a canned; cat /etc/passwd THẬT).
export default {
  '/': { type: 'dir' },
  '/etc': { type: 'dir' },
  '/etc/passwd': {
    type: 'file',
    content: [
      'root:x:0:0:root:/root:/bin/bash',
      'daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin',
      'www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
      'backup:x:34:34:backup:/var/backups:/usr/sbin/nologin',
      // user thường có shell -> đáng chú ý khi enum
      'jenkins:x:1001:1001:Jenkins CI:/var/lib/jenkins:/bin/bash',
      'hacker:x:1000:1000:hacker:/home/hacker:/bin/bash',
    ].join('\n'),
  },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/note.txt': {
    type: 'file',
    content: 'Vừa có shell user thường. Việc đầu tiên: enum — mình là ai, sudo được gì, kernel nào, có user lạ nào có shell.',
  },
};
