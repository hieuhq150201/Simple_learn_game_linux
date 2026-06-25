// Chương 5 — Mission 10: Đào DNS nâng cao (NS, MX, zone transfer AXFR).
// dig là tool -> output canned trong extra/chapter5.js. FS giữ note ngữ cảnh.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: 'Domain: acme-corp.com. Name server thấy ở WHOIS là ns1/ns2.digitalocean.com. Đào kỹ NS/MX rồi thử zone transfer.',
  },
};
