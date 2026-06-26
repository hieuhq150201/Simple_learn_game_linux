// Chương 5 — Mission 4: Trinh sát thụ động (WHOIS, dig, Certificate Transparency).
// Lệnh whois/dig là tool -> output canned trong missions.js. File CT-log đặt thật ở đây để cat/grep.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/scope.txt': {
    type: 'file',
    content: 'Hợp đồng OSINT — target: acme-corp.com. Chỉ recon thụ động trước, chưa được chạm trực tiếp vào host.',
  },
  // Dump tải về từ crt.sh (Certificate Transparency) — đọc/lọc bằng cat/grep được thật.
  '/home/hacker/crtsh.txt': {
    type: 'file',
    content: [
      'crt.sh | dump for %.acme-corp.com',
      'id           name_value',
      '-----------  ----------------------------',
      '882013441    acme-corp.com',
      '882013442    www.acme-corp.com',
      '901225017    mail.acme-corp.com',
      '903771820    dev.acme-corp.com',
      '903771821    staging.acme-corp.com',
      '915002288    vpn.acme-corp.com',
      '927440190    gitlab-internal.acme-corp.com',
      '927440191    admin.acme-corp.com',
    ].join('\n'),
  },
};
