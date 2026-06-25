// Chương 8 — CTF Medium: FTP anonymous + file upload RCE + SUID binary -> flag
// Flag nằm ở /root/flag.txt (đọc được sau khi leo root qua SUID binary).
export default {
  '/': { type: 'dir' },
  '/srv': { type: 'dir' },
  '/srv/ftp': { type: 'dir' },
  '/srv/ftp/readme.txt': {
    type: 'file',
    content: 'FTP cho phép anonymous login. Thư mục upload có thể ghi -> thử upload webshell.',
  },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/uploads': { type: 'dir' },
  '/usr': { type: 'dir' },
  '/usr/bin': { type: 'dir' },
  // foothold là www-data, leo root qua SUID
  '/usr/bin/nmap': { type: 'file', content: '(binary) nmap — SUID bit set, owner root. GTFOBins: nmap interactive mode -> root shell.' },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{ftp_upload_rce_suid_nmap}' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': { type: 'file', content: 'CTF MEDIUM — Target IP: 10.10.10.35. FTP + web. Tìm flag.' },
};
