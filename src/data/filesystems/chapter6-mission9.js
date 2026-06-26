// Chương 6 — Mission 9: Phá xác thực (hydra brute + token yếu + cookie bypass).
// hydra/curl là tool -> output canned. Đặt file token THẬT để cat -> giải mã base64 thấy cấu trúc đoán được.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': { type: 'file', content: 'http://target/login — không có rate-limit. Brute creds, rồi soi session token (base64) xem có đoán được không.' },
  // Token bắt được từ Burp — cat ra rồi tự nhận ra nó chỉ là base64 của "user:role".
  '/home/hacker/captured_cookie.txt': {
    type: 'file',
    content: 'Set-Cookie: session=Z3Vlc3Q6dXNlcjoxMDAy; Path=/; HttpOnly\n# Z3Vlc3Q6dXNlcjoxMDAy = base64("guest:user:1002")',
  },
};
