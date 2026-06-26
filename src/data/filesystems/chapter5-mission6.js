// Chương 5 — Mission 6: Đào sâu dịch vụ (NSE smb-enum-shares, http-title, nc banner grab).
// nmap/nc là tool -> output canned. FS giữ note.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/services.txt': {
    type: 'file',
    content: 'Từ scan trước: 10.10.14.55 mở 22(ssh) 80(http) 139/445(smb). Soi sâu từng service, đặc biệt SMB.',
  },
};
