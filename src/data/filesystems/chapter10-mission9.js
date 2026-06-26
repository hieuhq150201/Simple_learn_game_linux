// Chương 10 — ROP chain / ret2libc (NX+ASLR bật, canary tắt). Elite, no-hint. Flag RANDOM ở /root/flag.txt.
// Binary có overflow nhưng NX chặn shellcode trên stack, ASLR random hoá libc -> phải leak
// địa chỉ libc qua puts@GOT, tính base, dựng ROP chain gọi system("/bin/sh") -> shell -> flag.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: 'ELITE — service nhị phân lắng nghe port 41414. NX bật, ASLR bật, canary tắt. Không hint. Tự lực.',
  },
  '/home/hacker/recon.txt': {
    type: 'file',
    content: [
      'checksec ./vault -> Canary=No  NX=Enabled  PIE=No  RELRO=Partial',
      '(NX bật nên KHÔNG thể chạy shellcode trực tiếp trên stack -> phải ret2libc/ROP)',
      '(PIE=No -> địa chỉ code/PLT/GOT trong binary CỐ ĐỊNH, chỉ libc bị ASLR random hoá)',
      'objdump -d ./vault | grep -E "puts@plt|puts@got" -> puts@plt: 0x401040   puts@got: 0x404018',
      'objdump -d ./vault | grep "main\\b" -> main bắt đầu tại 0x401196, gọi vuln() đọc input 256 byte vào buffer 64 byte',
      'Ý tưởng: overflow -> gọi puts(puts@got) để LEAK địa chỉ thật của puts trong libc -> tính libc base (offset cố định)',
      '-> dựng ROP chain thứ 2: pop rdi; ret -> "/bin/sh" -> call system trong libc -> execve shell.',
    ].join('\n'),
  },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{{{flag}}}' },
};
