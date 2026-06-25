// Chương 9 — Mission 1 (Kerberoasting): enum SPN, crack TGS. Output đóng hộp, filesystem chứa note recon.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/engagement.txt': {
    type: 'file',
    content: [
      'AD PENTEST — Domain: CORP.LOCAL  (DC: 10.10.10.5)',
      'Đã có 1 tài khoản domain user low-priv: corp\\jdoe : Welcome1',
      'Mục tiêu giai đoạn này: Kerberoasting — request TGS cho các tài khoản có SPN,',
      'crack offline để lấy mật khẩu service account.',
    ].join('\n'),
  },
  '/home/hacker/loot': { type: 'dir' },
};
