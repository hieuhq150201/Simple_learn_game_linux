// Chương 7 — Mission 15: NFS no_root_squash.
// cat /etc/exports thật. showmount/mount/chmod +s trên máy attacker: tool -> canned.
export default {
  '/': { type: 'dir' },
  '/etc': { type: 'dir' },
  '/etc/exports': {
    type: 'file',
    content: [
      '# misconfig: no_root_squash cho phép root của client giữ nguyên uid 0 trên share NFS',
      '/srv/nfs/share  10.10.14.0/24(rw,sync,no_root_squash)',
    ].join('\n'),
  },
  '/srv': { type: 'dir' },
  '/srv/nfs': { type: 'dir' },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{nfs_no_root_squash_suid_shell}' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/note.txt': {
    type: 'file',
    content: 'Server có export NFS. Đọc /etc/exports xem cờ no_root_squash — nếu có, root ở máy mày = root trên share.',
  },
};
