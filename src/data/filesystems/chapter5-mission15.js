// Chương 5 — Mission 15: nmap timing/evasion (-T, fragment, decoy) để tránh IDS.
// nmap là tool -> output canned. FS giữ note ngữ cảnh.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: 'Lần scan -p- trước có vẻ đã bị soi (log SOC ghi nhận). Lần này phải quét chậm và lẫn vào nhiễu để né IDS.',
  },
};
