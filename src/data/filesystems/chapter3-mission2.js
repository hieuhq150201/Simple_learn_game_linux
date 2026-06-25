// Chương 3 — Mission 2: DNS domain trỏ sai, dùng dig debug
// dig là network tool, output do AI generate. Filesystem tối thiểu + note manh mối.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/ticket.txt': {
    type: 'file',
    content: [
      'TICKET #4821',
      'Domain: shop.acme-corp.com không vào được từ chiều qua.',
      'IP đúng của server production: 203.0.113.42',
      'Nghi A record bị trỏ sai sau lần đổi DNS hôm qua.',
      'Kiểm tra A record và CNAME bằng dig.',
    ].join('\n'),
  },
};
