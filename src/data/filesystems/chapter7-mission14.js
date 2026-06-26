// Chương 7 — Mission 14: /etc/passwd ghi được trực tiếp (writable bởi other) -> thêm user uid 0.
// ls -l, cat đều thật trên FS. echo >> /etc/passwd: lệnh thật, engine tự append nếu hỗ trợ; còn lại canned ở step cuối.
export default {
  '/': { type: 'dir' },
  '/etc': { type: 'dir' },
  '/etc/passwd': {
    type: 'file',
    content: [
      'root:x:0:0:root:/root:/bin/bash',
      'daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin',
      'hacker:x:1000:1000:hacker:/home/hacker:/bin/bash',
      // perm thật: -rw-rw-rw- (lộ trong ls -l) -> world-writable, lỗi cấu hình nghiêm trọng
    ].join('\n'),
  },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{writable_etc_passwd_add_root_user}' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/note.txt': {
    type: 'file',
    content: 'Thử ls -l /etc/passwd xem quyền. Nếu other có quyền w, mày không cần exploit gì cả — tự thêm một user uid 0 là xong.',
  },
};
