// Chương 10 — Crypto Padding Oracle Attack. Elite, no-hint. Flag RANDOM ở /root/flag.txt.
// API giải mã cookie AES-CBC và rò thông tin padding qua lỗi khác nhau (valid/invalid padding)
// -> byte-by-byte padding oracle decrypt token admin -> forge cookie admin=true -> truy cập /admin -> flag.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: 'ELITE — API nội bộ tại 10.10.40.5:8443 dùng cookie mã hoá AES-CBC để xác thực. Không hint. Tự lực.',
  },
  '/home/hacker/recon.txt': {
    type: 'file',
    content: [
      'curl -i https://10.10.40.5:8443/profile -H "Cookie: session=<ciphertext-hex>"',
      '  -> với padding HỎNG: HTTP 500 "Internal Server Error: bad padding"',
      '  -> với padding ĐÚNG (nhưng nội dung sai): HTTP 403 "Forbidden: invalid session"',
      '(2 mã lỗi KHÁC NHAU cho 2 trường hợp khác nhau = padding oracle lộ ra qua response code)',
      'cookie session là AES-CBC: ciphertext = IV || C1 || C2 || ... || Cn (mỗi block 16 byte)',
      'Mục tiêu: dùng oracle để decrypt block chứa "role=user" thành "role=admin" mà KHÔNG cần biết key,',
      'bằng cách brute byte cuối mỗi block intermediate (chuẩn kỹ thuật POODLE/padding-oracle CBC).',
    ].join('\n'),
  },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{{{flag}}}' },
};
