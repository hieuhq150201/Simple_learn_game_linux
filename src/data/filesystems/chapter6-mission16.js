// Chương 6 — Mission 16: JWT weak secret — crack HS256 bằng hashcat rồi tự ký token admin.
// hashcat/jwt_tool là tool -> output canned (secret crack được + forge token mới). FS giữ token bắt được.
export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/captured.jwt': {
    type: 'file',
    content: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZ3Vlc3QiLCJyb2xlIjoidXNlciJ9.3K1q9z8mP2vYxN7wL5tHj0aRkX4dQbZ6c8eGfV1nMpI',
  },
  '/home/hacker/rockyou-small.txt': {
    type: 'file',
    content: ['123456', 'password', 'secret123', 'letmein', 'qwerty', 's3cr3t'].join('\n'),
  },
  '/home/hacker/target.txt': { type: 'file', content: 'JWT bắt được khi sniff traffic của user guest. Server ký HS256 — nếu secret yếu, crack được rồi tự ký token admin.' },
};
