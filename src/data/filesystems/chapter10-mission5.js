// Chương 10 — Initial Access qua Phishing (elite, no-hint). Flag RANDOM ở /root/flag.txt.
// OSINT email + msfvenom macro/HTA + AV/egress bypass + C2 beacon -> foothold -> privesc. Output canned.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: 'ELITE — Mục tiêu: globex.io (client-side). Không scope chi tiết, không hint. Tự lực.',
  },
  // Kết quả OSINT email để người chơi cat ra (đầu chuỗi phishing).
  '/home/hacker/osint/emails.txt': {
    type: 'file',
    content: [
      'Thu thập từ theHarvester / LinkedIn:',
      '  j.rivera@globex.io   (Finance)',
      '  m.tan@globex.io      (IT Helpdesk)',
      'Mail gateway: O365. Định dạng địa chỉ: <chữ-cái-đầu>.<họ>@globex.io',
    ].join('\n'),
  },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{{{flag}}}' },
};
