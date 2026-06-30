// Chương 14 — Cryptography & Hash Cracking. 15 mission, FS inline, engine offline.
// Lệnh tool (hashcat/john/zip2john/ssh2john/hashid/python3/...) => có `output` đóng hộp tiếng Anh giống tool thật.
// Lệnh file-based (cat/grep/ls/find) => KHÔNG đặt output; nội dung nằm trong initialFilesystem.
// Mạch truyện: nhận diện hash → crack MD5/SHA256/shadow/bcrypt → zip/SSH/WPA → encoding → cipher → RSA → JWT → NTLM → salt → flag.

const ROOT_FS = {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
};

export default [
  // ── 1 ────────────────────────────────────────────────────────────────────
  {
    id: 1,
    chapterId: 14,
    title: 'Nhận diện loại hash',
    story:
      'Trong lần dump dữ liệu trước, mày vớ được một file chứa đủ loại hash lẫn lộn. Trước khi crack, phải biết đang đối mặt với loại hash nào: MD5, SHA-256, bcrypt hay NTLM? Nhận diện sai loại là mất thời gian, có thể mất cả ngày với sai -m mode.',
    steps: [
      {
        id: 'read_hashes',
        description: 'Đọc file hashes.txt để xem các hash cần nhận diện',
        match: /^cat\b.*hashes\.txt/,
      },
      {
        id: 'hashid_identify',
        description: 'Dùng hashid để nhận diện loại hash trong file',
        match: /^hashid\b/i,
        output: [
          "Analyzing '$2y$12$LKJHGFDSApoiuytrewq098765432100000000000000000000000000'",
          '[+] Blowfish(OpenBSD)',
          '[+] Woltlab Burning Board 4.x',
          '[+] bcrypt',
          '',
          "Analyzing '5f4dcc3b5aa765d61d8327deb882cf99'",
          '[+] MD2',
          '[+] MD5',
          '[+] MD4',
          '',
          "Analyzing '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'",
          '[+] SHA-256',
          '[+] Haval-256',
          '[+] RIPEMD-256',
        ].join('\n'),
      },
    ],
    hints: [
      'Mày có một file hash lộn xộn. Bước đầu: đọc nó bằng `cat /home/hacker/hashes.txt` để thấy từng hash.',
      'Sau khi đọc xong, dùng công cụ nhận diện tự động: `hashid /home/hacker/hashes.txt` — nó phân tích từng dòng và liệt kê ứng viên loại hash.',
      'Muốn nhận diện một hash cụ thể: `hashid \'$2y$12$LKJHGFDSApoiuytrewq098765432100000000000000000000000000\'` — bcrypt luôn bắt đầu bằng $2y$, MD5 là 32 hex, SHA-256 là 64 hex.',
    ],
    terms: [
      { term: 'Hash', def: 'Hàm một chiều biến đổi dữ liệu thành chuỗi cố định; không thể đảo ngược trực tiếp, chỉ crack bằng brute-force/dictionary.' },
      { term: 'hashid', def: 'Công cụ nhận diện loại hash từ định dạng chuỗi; hỗ trợ 200+ loại hash phổ biến.' },
      { term: 'bcrypt', def: 'Thuật toán hash mật khẩu chậm cố ý (cost factor); $2y$ prefix là dấu hiệu nhận biết.' },
      { term: 'Hash mode (-m)', def: 'Tham số hashcat chỉ định loại hash: -m 0 là MD5, -m 1400 là SHA-256, -m 3200 là bcrypt.' },
    ],
    debrief: [
      'Nhận diện đúng loại hash là bước 0 của crack — chọn sai -m mode, hashcat báo "No hashes loaded" hoặc crack sai hoàn toàn.',
      'MD5 dài 32 hex; SHA-256 dài 64 hex; bcrypt bắt đầu bằng $2y$ với cost factor; NTLM là 32 hex nhưng context từ SAM/LSASS.',
      'DEFENDER: không bao giờ dùng MD5/SHA-1/SHA-256 thô để hash mật khẩu — chúng quá nhanh để brute-force. Dùng bcrypt, Argon2, hoặc scrypt với cost factor đủ cao.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/hashes.txt': {
        type: 'file',
        content: [
          '# Hash dump từ target - cần nhận diện + crack',
          '5f4dcc3b5aa765d61d8327deb882cf99',
          '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
          '$2y$12$LKJHGFDSApoiuytrewq098765432100000000000000000000000000',
          'aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0',
          '',
          '# Ghi chú:',
          '# - Hash 1: user "guest", MD5',
          '# - Hash 2: admin panel, SHA-256',
          '# - Hash 3: database admin, bcrypt cost=12',
          '# - Hash 4: Windows NTLM (LM:NT format)',
        ].join('\n'),
      },
    },
  },

  // ── 2 ────────────────────────────────────────────────────────────────────
  {
    id: 2,
    chapterId: 14,
    title: 'Crack MD5 với wordlist',
    story:
      'Hash MD5 đầu tiên trông quen quen — "password" băm bằng MD5 đúng là 5f4dcc3b... đây rồi. Nhưng để chứng minh bằng tool, mày cần crack nó bằng wordlist rockyou.txt — bộ wordlist khổng lồ chứa hơn 14 triệu mật khẩu bị leak theo thứ tự phổ biến.',
    steps: [
      {
        id: 'cat_md5',
        description: 'Đọc file chứa hash MD5 cần crack',
        match: /^cat\b.*md5\.txt/,
      },
      {
        id: 'crack_md5',
        description: 'Crack MD5 bằng hashcat với wordlist rockyou.txt (-m 0)',
        match: /^hashcat\b.*-m\s*0\b/i,
        output: [
          'hashcat (v6.2.6) starting...',
          '',
          'OpenCL API (OpenCL 3.0 PoCL 3.1) - Platform #1 [The pocl project]',
          '* Device #1: pthread-Intel(R) Core(TM) i7, 1933/3931 MB, 4MCU',
          '',
          'Hashes: 1 digests; 1 unique digests, 1 unique salts',
          '',
          '5f4dcc3b5aa765d61d8327deb882cf99:password',
          '',
          'Session..........: hashcat',
          'Status...........: Cracked',
          'Hash.Mode........: 0 (MD5)',
          'Hash.Target......: 5f4dcc3b5aa765d61d8327deb882cf99',
          'Time.Started.....: 0 secs',
          'Kernel.Speed.....: 152.7 MH/s (0.51ms)',
          'Recovered........: 1/1 (100.00%) Digests',
          'Progress.........: 142/14344392 (0.00%)',
        ].join('\n'),
      },
    ],
    hints: [
      'MD5 là loại hash nhanh nhất và yếu nhất. GPU bình thường crack hàng trăm triệu MD5/giây với wordlist rockyou.',
      'Đọc file hash: `cat /home/hacker/md5.txt`. Crack bằng hashcat: `hashcat -m 0 /home/hacker/md5.txt /usr/share/wordlists/rockyou.txt`.',
      'Xem kết quả sau khi crack: `hashcat -m 0 /home/hacker/md5.txt /usr/share/wordlists/rockyou.txt --show` — kết quả dạng hash:plaintext.',
    ],
    terms: [
      { term: 'MD5', def: 'Message Digest 5 — hash 128-bit (32 hex), rất nhanh, đã bị phá về collision; không dùng cho mật khẩu.' },
      { term: 'hashcat', def: 'Công cụ crack hash GPU-accelerated nhanh nhất; hỗ trợ 300+ loại hash với nhiều attack mode.' },
      { term: 'rockyou.txt', def: 'Wordlist 14 triệu mật khẩu bị leak từ vụ RockYou 2009; chuẩn mực đầu tiên thử khi crack.' },
      { term: 'Dictionary attack', def: 'Thử từng từ trong wordlist lần lượt; hiệu quả vì người dùng hay chọn mật khẩu đơn giản.' },
    ],
    debrief: [
      'MD5("password") = 5f4dcc3b... — một trong những hash bị crack nhiều nhất lịch sử; lookup bảng rainbow là ra ngay.',
      'Tốc độ trên GPU RTX 3090 là ~50 GH/s — 50 tỷ hash/giây. Rockyou 14M từ crack trong chưa đầy 1ms.',
      'DEFENDER: không bao giờ lưu mật khẩu bằng MD5/SHA-1/SHA-256 thô. Dùng bcrypt (cost >= 10), Argon2id, hoặc scrypt.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/md5.txt': {
        type: 'file',
        content: '5f4dcc3b5aa765d61d8327deb882cf99',
      },
    },
  },

  // ── 3 ────────────────────────────────────────────────────────────────────
  {
    id: 3,
    chapterId: 14,
    title: 'Crack SHA-256',
    story:
      'Hash thứ hai là SHA-256 — dài hơn MD5 (64 hex), nhưng vẫn quá nhanh để crack bằng GPU nếu không có salt. Admin panel dùng SHA-256 thuần để hash password "admin" — một sai lầm kinh điển mà mày sẽ chứng minh ngay.',
    steps: [
      {
        id: 'cat_sha256',
        description: 'Đọc file hash SHA-256',
        match: /^cat\b.*sha256\.txt/,
      },
      {
        id: 'crack_sha256',
        description: 'Crack SHA-256 bằng hashcat với -m 1400',
        match: /^hashcat\b.*-m\s*1400\b/i,
        output: [
          'hashcat (v6.2.6) starting...',
          '',
          'Hashes: 1 digests; 1 unique digests, 1 unique salts',
          '',
          '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918:admin',
          '',
          'Session..........: hashcat',
          'Status...........: Cracked',
          'Hash.Mode........: 1400 (SHA2-256)',
          'Hash.Target......: 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
          'Time.Started.....: 0 secs',
          'Kernel.Speed.....: 421.3 MH/s (0.83ms)',
          'Recovered........: 1/1 (100.00%) Digests',
          'Progress.........: 3/14344392 (0.00%)',
        ].join('\n'),
      },
    ],
    hints: [
      'SHA-256 vẫn là hash nhanh — GPU hiện đại crack hàng trăm triệu SHA-256/giây. Mật khẩu yếu không trụ được lâu.',
      'Đọc hash: `cat /home/hacker/sha256.txt`. Crack: `hashcat -m 1400 /home/hacker/sha256.txt /usr/share/wordlists/rockyou.txt`.',
      'Kết quả: 8c6976e5...:admin — admin panel bị crack ngay từ từ đầu tiên trong rockyou. SHA-256 dùng mode -m 1400 trong hashcat.',
    ],
    terms: [
      { term: 'SHA-256', def: 'Secure Hash Algorithm 256-bit — hash 64 hex, tốt cho toàn vẹn dữ liệu nhưng quá nhanh để hash mật khẩu.' },
      { term: 'hashcat -m 1400', def: 'Mode SHA2-256 trong hashcat; SHA-224 là 1300, SHA-384 là 10800, SHA-512 là 1700.' },
      { term: 'Unsalted hash', def: 'Hash không có salt — cùng mật khẩu luôn ra cùng hash; dễ bị rainbow table và tấn công từ điển song song.' },
      { term: 'GPU cracking', def: 'Dùng card đồ hoạ để crack hash song song; nhanh hơn CPU hàng nghìn lần nhờ kiến trúc SIMD.' },
    ],
    debrief: [
      'SHA256("admin") = 8c6976e5... — lookup trong bất kỳ rainbow table online nào ra ngay trong 0 giây.',
      'Tốc độ SHA-256 trên RTX 3090: ~8 GH/s. Rockyou 14M crack trong ~2ms. Không có salt = không có bảo vệ thực sự.',
      'DEFENDER: nếu phải dùng SHA-256 (VD: HMAC), bắt buộc salt ngẫu nhiên >= 16 byte. Nhưng tốt hơn: dùng bcrypt/Argon2.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/sha256.txt': {
        type: 'file',
        content: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
      },
    },
  },

  // ── 4 ────────────────────────────────────────────────────────────────────
  {
    id: 4,
    chapterId: 14,
    title: 'Crack /etc/shadow (sha512crypt)',
    story:
      'Trong một mission trước mày đã có shell trên server và dump được /etc/shadow — file chứa hash mật khẩu của mọi user hệ thống. Linux dùng sha512crypt ($6$) với salt ngẫu nhiên. Chậm hơn MD5 nhiều, nhưng vẫn crack được nếu mật khẩu nằm trong wordlist.',
    steps: [
      {
        id: 'cat_shadow',
        description: 'Đọc file shadow dump để xem hash dạng $6$',
        match: /^cat\b.*shadow/,
      },
      {
        id: 'crack_shadow',
        description: 'Crack shadow hash bằng john the ripper với format sha512crypt',
        match: /^john\b.*(sha512crypt|shadow)/i,
        output: [
          'Using default input encoding: UTF-8',
          'Loaded 2 password hashes with 2 different salts (sha512crypt, crypt(3) $6$ [SHA512 256/256 AVX2 4x])',
          'Cost 1 (iteration count) is 5000 for all loaded hashes',
          'Will run 4 OpenMP threads',
          'Proceeding with single, rules:Single',
          "Press 'q' or Ctrl-C to abort, almost any other key for status",
          'Proceeding with wordlist:/usr/share/wordlists/rockyou.txt',
          '0g 0:00:00:03 DONE 1/3 (2026-06-29 10:14) 0g/s 1398p/s',
          'Proceeding with wordlist:/usr/share/wordlists/rockyou.txt, rules:Wordlist',
          'toor             (root)',
          'letmein          (sysadmin)',
          '2g 0:00:00:47 DONE 2/3 (2026-06-29 10:15) 0.04255g/s 3847p/s',
          'Use the "--show" option to display all of the cracked passwords reliably',
          'Session completed.',
        ].join('\n'),
      },
    ],
    hints: [
      '/etc/shadow chứa hash $6$ (sha512crypt) với salt — chậm hơn MD5 khoảng 500x nhưng mật khẩu yếu vẫn bị crack bằng john trong vài phút.',
      'Đọc shadow: `cat /home/hacker/shadow`. Crack với john: `john --format=sha512crypt /home/hacker/shadow`.',
      'Xem kết quả sau khi crack: `john --format=sha512crypt --show /home/hacker/shadow`. Root dùng mật khẩu "toor" — đảo ngược của "root", cực kỳ phổ biến.',
    ],
    terms: [
      { term: '/etc/shadow', def: 'File Linux chứa hash mật khẩu của user; chỉ root đọc được; format: user:$type$salt$hash:...' },
      { term: 'sha512crypt ($6$)', def: 'Thuật toán hash mặc định cho shadow trên Linux hiện đại; 5000 vòng lặp, chậm hơn MD5 nhiều.' },
      { term: 'john (John the Ripper)', def: 'Công cụ crack hash offline phổ biến; tự nhận diện định dạng hash và có bộ rules biến thể từ điển.' },
      { term: 'Salt', def: 'Chuỗi ngẫu nhiên gắn vào trước khi hash; ngăn rainbow table và buộc crack từng hash riêng lẻ.' },
    ],
    debrief: [
      'sha512crypt với 5000 vòng lặp chậm hơn MD5 ~5000x — nhưng "toor", "letmein" vẫn bị crack trong dưới 1 phút vì wordlist.',
      'John tự động nhận diện $6$ không cần chỉ --format, nhưng khai báo tường minh chạy nhanh hơn vì bỏ qua bước detect.',
      'DEFENDER: tăng iteration count (rounds=) lên 50000-100000 trong /etc/pam.d để tăng chi phí crack; enforce độ phức tạp mật khẩu để loại mật khẩu phổ biến.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/shadow': {
        type: 'file',
        content: [
          'root:$6$rounds=5000$randomsalt1$WUjm.qkTRhSRY3TRnkTqBGhm3GCjt1TUInX7lnHJRcLEqSH3DX5UqKnWVPfGlCc9j0y8zQ1k2w3e4r5t:19000:0:99999:7:::',
          'sysadmin:$6$rounds=5000$anothersalt2$fP6Q2K7N9XzRmVbJ8CdL0eYwA1iU3oTsH4gF5hE6jI2kM7lNpWrOqXyZvSuBcDaE:19001:0:99999:7:::',
          'www-data:!:19000:0:99999:7:::',
          'nobody:*:18812:0:99999:7:::',
        ].join('\n'),
      },
    },
  },

  // ── 5 ────────────────────────────────────────────────────────────────────
  {
    id: 5,
    chapterId: 14,
    title: 'Crack bcrypt — hash chậm nhất',
    story:
      'Database admin dùng bcrypt với cost factor 12 — loại hash được thiết kế chậm cố ý để làm crack không hiệu quả. GPU RTX 3090 chỉ crack được khoảng 184 bcrypt/giây so với 21 tỷ MD5/giây. Nhưng mật khẩu ngắn hoặc nằm đầu rockyou vẫn trong tầm tay.',
    steps: [
      {
        id: 'cat_bcrypt',
        description: 'Đọc file chứa hash bcrypt ($2y$)',
        match: /^cat\b.*bcrypt\.txt/,
      },
      {
        id: 'crack_bcrypt',
        description: 'Crack bcrypt bằng hashcat -m 3200',
        match: /^hashcat\b.*-m\s*3200\b/i,
        output: [
          'hashcat (v6.2.6) starting...',
          '',
          'Hashes: 1 digests; 1 unique digests, 1 unique salts',
          '',
          '$2y$12$LKJHGFDSApoiuytrewq098765.nPX5XJJaYOAy5.RUzBiU7fmxMHuvy:dragon',
          '',
          'Session..........: hashcat',
          'Status...........: Cracked',
          'Hash.Mode........: 3200 (bcrypt $2*$, Blowfish (Unix))',
          'Hash.Target......: $2y$12$LKJHGFDSApoiuytrewq098765.nPX5XJJaYOAy5.RUzBiU7fmxMHuvy',
          'Time.Started.....: Mon Jun 29 10:20:01 2026 (3 mins, 41 secs)',
          'Kernel.Speed.....: 184 H/s (88.96ms)',
          'Recovered........: 1/1 (100.00%) Digests',
          'Progress.........: 40672/14344392 (0.28%)',
          '',
          'Started: Mon Jun 29 10:20:01 2026',
          'Stopped: Mon Jun 29 10:23:42 2026',
        ].join('\n'),
      },
    ],
    hints: [
      'bcrypt ($2y$) được thiết kế chậm cố ý — 184 H/s so với hàng tỷ MD5/s. Nhưng "dragon" (mật khẩu phổ biến top 100) vẫn crack được trong vài phút.',
      'Đọc hash: `cat /home/hacker/bcrypt.txt`. Crack với hashcat: `hashcat -m 3200 /home/hacker/bcrypt.txt /usr/share/wordlists/rockyou.txt`.',
      'bcrypt cost=12 nghĩa là 2^12 = 4096 vòng lặp. Tăng cost lên 14 làm chậm thêm 4x — nhưng vẫn chặn được bằng mật khẩu mạnh (>12 ký tự ngẫu nhiên).',
    ],
    terms: [
      { term: 'bcrypt', def: 'Thuật toán hash mật khẩu dựa trên Blowfish; cost factor điều chỉnh độ chậm; $2y$ là biến thể chuẩn.' },
      { term: 'Cost factor', def: 'Tham số bcrypt (thường 10-14) xác định số vòng lặp = 2^cost; tăng 1 là chậm gấp đôi.' },
      { term: 'hashcat -m 3200', def: 'Mode bcrypt trong hashcat; cực chậm nên thường chạy trên GPU farm hoặc dùng wordlist ngắn.' },
      { term: 'H/s (hashes per second)', def: 'Đơn vị tốc độ crack; bcrypt 184 H/s so với MD5 50 GH/s — sự khác biệt 200 triệu lần.' },
    ],
    debrief: [
      '"dragon" đứng thứ #57 trong rockyou — crack bcrypt cost 12 chỉ mất ~3 phút với GPU. Cost 14 sẽ mất ~12 phút cho cùng kết quả.',
      'Với mật khẩu 8 ký tự ngẫu nhiên (chữ+số+ký tự đặc biệt), bcrypt cost 12 cần ~1000 năm ngay cả với GPU farm.',
      'DEFENDER: dùng bcrypt cost >= 12 (12 cho UX nhanh, 14 cho hệ thống ít đăng nhập); tăng dần cost theo năm vì phần cứng nhanh hơn.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/bcrypt.txt': {
        type: 'file',
        content: '$2y$12$LKJHGFDSApoiuytrewq098765.nPX5XJJaYOAy5.RUzBiU7fmxMHuvy',
      },
    },
  },

  // ── 6 ────────────────────────────────────────────────────────────────────
  {
    id: 6,
    chapterId: 14,
    title: 'Bẻ mật khẩu file ZIP',
    story:
      'Trong thư mục share của target mày tìm thấy một file ZIP được mã hoá bằng mật khẩu. Bên trong chắc chắn có gì đó nhạy cảm mới cần khoá. Workflow: extract hash từ ZIP bằng zip2john, rồi crack hash đó bằng john như bình thường.',
    steps: [
      {
        id: 'ls_zip',
        description: 'Xem file ZIP cần bẻ có trong thư mục không',
        match: /^ls\b/i,
      },
      {
        id: 'zip2john_extract',
        description: 'Extract hash từ ZIP bằng zip2john, lưu ra zip.hash',
        match: /^zip2john\b/i,
        output: [
          '$pkzip2$1*2*2*0*2a*1e*3b4a0e4d*0*42*8*2a*3b4a*1234567890abcdef1234567890abcdef12345678*$/pkzip2$:secret.txt:secret.zip:secret.zip',
          'ver 2.0 efh 5455 efh 7875 secret.zip/secret.txt PKZIP Encr: 2b chk, TS_chk, cmplen=42, decmplen=30, crc=3B4A0E4D',
        ].join('\n'),
      },
      {
        id: 'john_zip',
        description: 'Crack hash ZIP bằng john với wordlist',
        match: /^john\b.*zip/i,
        output: [
          'Using default input encoding: UTF-8',
          'Loaded 1 password hash (PKZIP [32/64])',
          'Will run 4 OpenMP threads',
          'Proceeding with wordlist:/usr/share/wordlists/rockyou.txt',
          'sunshine         (secret.zip/secret.txt)',
          '1g 0:00:00:02 DONE 2/3 (2026-06-29 10:31) 0.4831g/s 1204Kp/s',
          'Use the "--show" option to display all of the cracked passwords reliably',
          'Session completed.',
        ].join('\n'),
      },
    ],
    hints: [
      'ZIP có password không crack trực tiếp — cần extract hash từ format ZIP trước. Xem file ZIP có ở đó không: `ls /home/hacker`.',
      'Extract hash: `zip2john /home/hacker/secret.zip > /home/hacker/zip.hash`. Rồi crack: `john /home/hacker/zip.hash --wordlist=/usr/share/wordlists/rockyou.txt`.',
      'Mật khẩu ZIP là "sunshine". Workflow *2john → john là chuẩn: zip2john, ssh2john, keepass2john đều convert sang format john.',
    ],
    terms: [
      { term: 'zip2john', def: 'Tool convert file ZIP/RAR/7z có password thành format hash john có thể crack.' },
      { term: 'PKZIP encryption', def: 'Mã hoá tích hợp trong ZIP chuẩn cũ; yếu, hash extract được bằng zip2john và crack bằng john nhanh.' },
      { term: 'john --wordlist', def: 'Chỉ định wordlist cho john; không chỉ định sẽ dùng wordlist nội bộ nhỏ.' },
      { term: 'Hash extraction', def: 'Bước tách thông tin xác thực (hash) từ file/protocol ra dạng crack được; *2john là họ tool làm việc này.' },
    ],
    debrief: [
      'Workflow *2john → john là chuẩn: zip2john, ssh2john, keepass2john, office2john... tất cả convert sang format john, rồi crack chung một pipeline.',
      '"sunshine" là mật khẩu #13 trong rockyou — ZIP bị bẻ trong 2 giây. Mã hoá ZIP chuẩn (không phải AES-256) thậm chí còn dễ crack hơn.',
      'DEFENDER: dùng AES-256 encryption khi tạo ZIP (7-zip hỗ trợ); mật khẩu phải random >= 20 ký tự; với dữ liệu nhạy cảm thật sự, dùng GPG thay ZIP.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/secret.zip': {
        type: 'file',
        content: '[binary zip file - use zip2john to extract hash]',
      },
    },
  },

  // ── 7 ────────────────────────────────────────────────────────────────────
  {
    id: 7,
    chapterId: 14,
    title: 'Crack passphrase SSH private key',
    story:
      'Trên server backup mày tìm thấy một private key SSH — nhưng nó được bảo vệ bằng passphrase. Không có passphrase, key này vô dụng. Dùng ssh2john để convert sang hash, rồi crack bằng wordlist.',
    steps: [
      {
        id: 'cat_key_header',
        description: 'Đọc phần đầu private key để xác nhận có passphrase (ENCRYPTED)',
        match: /^cat\b.*id_rsa/,
      },
      {
        id: 'ssh2john_extract',
        description: 'Extract hash từ SSH key bằng ssh2john',
        match: /^ssh2john\b/i,
        output: [
          '/home/hacker/id_rsa:$sshng$1$16$B4C8D2E9F1A0B3C5D6E7F8A9B0C1D2E3$1200$8f3b2a1c9e7d5f4b...(truncated)',
        ].join('\n'),
      },
      {
        id: 'john_ssh',
        description: 'Crack passphrase SSH key bằng john với wordlist',
        match: /^john\b.*ssh/i,
        output: [
          'Using default input encoding: UTF-8',
          'Loaded 1 password hash (SSH, SSH private key [RSA/DSA/EC/OPENSSH 32/64])',
          'Cost 1 (KDF/cipher [0=MD5/AES 1=MD5/3DES 2=Bcrypt/AES]) is 0 for all loaded hashes',
          'Will run 4 OpenMP threads',
          'Proceeding with wordlist:/usr/share/wordlists/rockyou.txt',
          'trustno1         (id_rsa)',
          '1g 0:00:00:05 DONE (2026-06-29 10:35) 0.1961g/s 1421Kp/s',
          'Use the "--show" option to display all of the cracked passwords reliably',
          'Session completed.',
        ].join('\n'),
      },
    ],
    hints: [
      'SSH private key có passphrase không dùng trực tiếp được. Cần ssh2john để convert sang format crackable.',
      'Đọc key trước: `cat /home/hacker/id_rsa` (thấy chữ ENCRYPTED là có passphrase). Extract hash: `ssh2john /home/hacker/id_rsa > /home/hacker/ssh.hash`.',
      'Crack passphrase: `john /home/hacker/ssh.hash --wordlist=/usr/share/wordlists/rockyou.txt`. Passphrase là "trustno1" — cổ điển nhưng vẫn crack được ngay.',
    ],
    terms: [
      { term: 'SSH private key passphrase', def: 'Mật khẩu mã hoá file private key; bảo vệ key ngay cả khi file bị đánh cắp.' },
      { term: 'ssh2john', def: 'Tool convert private key SSH (RSA/DSA/ECDSA/Ed25519) sang hash format john crackable.' },
      { term: 'KDF (Key Derivation Function)', def: 'Hàm biến passphrase thành khoá mã hoá cho private key; cũ dùng MD5, mới dùng bcrypt (OPENSSH format).' },
      { term: 'OPENSSH format', def: 'Format private key mới (BEGIN OPENSSH PRIVATE KEY); dùng bcrypt KDF — chậm hơn nhiều để crack.' },
    ],
    debrief: [
      '"trustno1" là mật khẩu từ phim X-Files — tồn tại trong mọi wordlist, crack trong giây lát.',
      'Key format cũ (BEGIN RSA PRIVATE KEY) dùng MD5 KDF — rất nhanh để crack. Format mới (OPENSSH PRIVATE KEY) dùng bcrypt — chậm như bcrypt mật khẩu.',
      'DEFENDER: luôn dùng passphrase dài (>= 20 ký tự) cho SSH key; tốt hơn, dùng ssh-keygen -a 100 (bcrypt 100 rounds) để tạo key với KDF chậm.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/id_rsa': {
        type: 'file',
        content: [
          '-----BEGIN RSA PRIVATE KEY-----',
          'Proc-Type: 4,ENCRYPTED',
          'DEK-Info: AES-128-CBC,B4C8D2E9F1A0B3C5D6E7F8A9B0C1D2E3',
          '',
          'MIIEpAIBAAKCAQEA2a5EoamTt8v3AVdgIY2yw5RuJvPHEWX7+Sz4ZGBZ+UqPOvD',
          'REDACTED_ENCRYPTED_KEY_CONTENT_FOR_DEMO_PURPOSES',
          '-----END RSA PRIVATE KEY-----',
        ].join('\n'),
      },
    },
  },

  // ── 8 ────────────────────────────────────────────────────────────────────
  {
    id: 8,
    chapterId: 14,
    title: 'Crack WPA handshake Wi-Fi',
    story:
      'Trong quá trình recon văn phòng target, mày capture được WPA2 4-way handshake của mạng WiFi nội bộ bằng airodump-ng. File .hc22000 này chứa đủ thông tin để crack offline mà không cần ở gần điểm phát. Nếu crack được, mày có thể vào mạng nội bộ.',
    steps: [
      {
        id: 'cat_wifi_notes',
        description: 'Đọc ghi chú về handshake đã capture',
        match: /^cat\b.*wifi_notes\.txt/,
      },
      {
        id: 'crack_wpa',
        description: 'Crack WPA handshake bằng hashcat -m 22000',
        match: /^hashcat\b.*-m\s*22000\b/i,
        output: [
          'hashcat (v6.2.6) starting...',
          '',
          'Hashes: 1 digests; 1 unique digests, 1 unique salts',
          '',
          'acme-office:monkey123',
          '',
          'Session..........: hashcat',
          'Status...........: Cracked',
          'Hash.Mode........: 22000 (WPA-PBKDF2-PMKID+EAPOL)',
          'Hash.Target......: /home/hacker/capture.hc22000',
          'Time.Started.....: Mon Jun 29 10:40:00 2026 (0 secs)',
          'Kernel.Speed.....: 82.3 kH/s (67.22ms)',
          'Recovered........: 1/1 (100.00%) Digests',
          'Progress.........: 982342/14344392 (6.85%)',
        ].join('\n'),
      },
    ],
    hints: [
      'WPA2 handshake capture được bằng airodump-ng; crack offline bằng hashcat không cần ở gần AP. File .hc22000 là format mới của WPA crack.',
      'Đọc ghi chú: `cat /home/hacker/wifi_notes.txt`. Crack: `hashcat -m 22000 /home/hacker/capture.hc22000 /usr/share/wordlists/rockyou.txt`.',
      'Password WiFi là "monkey123". hashcat -m 22000 xử lý cả PMKID lẫn EAPOL handshake trong cùng một mode — tổng quát hơn mode cũ.',
    ],
    terms: [
      { term: 'WPA2 4-way handshake', def: 'Quá trình xác thực giữa client và AP khi kết nối WiFi; có thể capture và crack offline.' },
      { term: 'hc22000', def: 'Format file hashcat cho WPA PMKID và EAPOL handshake; thay thế .cap cũ; tương thích hkpcapwng.' },
      { term: 'PBKDF2', def: 'Password-Based Key Derivation Function 2 — WPA dùng PBKDF2 với 4096 vòng lặp + SSID làm salt.' },
      { term: 'airodump-ng', def: 'Tool capture packet WiFi (Aircrack-ng suite); dùng để bắt handshake và lưu file .cap/.hc22000.' },
    ],
    debrief: [
      'WPA2 dùng PBKDF2 (4096 iterations + SSID làm salt) — nên chậm hơn MD5 đáng kể: ~82k H/s so với 50 GH/s. Nhưng "monkey123" nằm trong rockyou.',
      'SSID làm salt nghĩa là crack cho từng network riêng biệt — không dùng được rainbow table chung. Nhưng SSID "linksys"/"default" thì có bảng đặc biệt.',
      'DEFENDER: dùng mật khẩu WiFi random >= 20 ký tự; WPA3 (SAE) không bị crack kiểu này; tách mạng khách và mạng nội bộ bằng VLAN.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/capture.hc22000': {
        type: 'file',
        content: '[WPA2 EAPOL handshake capture - binary format hc22000]',
      },
      '/home/hacker/wifi_notes.txt': {
        type: 'file',
        content: [
          'WiFi Recon — Văn phòng acme-corp',
          '=====================================',
          'SSID: acme-office',
          'BSSID: 00:11:22:33:44:55',
          'Channel: 6',
          'Encryption: WPA2 Personal (AES)',
          '',
          'Handshake captured: 2026-06-28 14:32:11',
          'File: /home/hacker/capture.hc22000',
          '',
          'Client deauth và capture thành công.',
          'hashcat mode: -m 22000 (WPA-PBKDF2-PMKID+EAPOL)',
        ].join('\n'),
      },
    },
  },

  // ── 9 ────────────────────────────────────────────────────────────────────
  {
    id: 9,
    chapterId: 14,
    title: 'Giải encoding lồng nhau',
    story:
      'Trên server target mày tìm thấy một chuỗi trông như rác — nhưng thực ra là thông tin nhạy cảm được encode nhiều lớp: base64 rồi ROT13. Đây không phải mã hoá thật (không có key), chỉ là obscuration. Giải từng lớp một là ra.',
    steps: [
      {
        id: 'cat_encoded',
        description: 'Đọc chuỗi encoded từ file',
        match: /^cat\b.*encoded\.txt/,
      },
      {
        id: 'decode_layers',
        description: 'Dùng python3 để giải nhiều lớp encoding cùng lúc',
        match: /^python3\b.*decode/i,
        output: [
          'Decoding layers...',
          'Layer 1 (ROT13): WkpIe2VuY29kaW5nX2lzX25vdF9lbmNyeXB0aW9ufQ==',
          'Layer 2 (Base64): ZJH{encoding_is_not_encryption}',
          'Layer 3 (prefix fix): FLAG{encoding_is_not_encryption}',
          '',
          'Decoded result: FLAG{encoding_is_not_encryption}',
        ].join('\n'),
      },
    ],
    hints: [
      'Encoding lồng nhau trông phức tạp nhưng chỉ là biến đổi có thể đảo ngược, không cần key. Nhận diện từng lớp: ROT13, base64, hex...',
      'Đọc file: `cat /home/hacker/encoded.txt`. Sau đó dùng script giải mã: `python3 /home/hacker/decode.py`.',
      'Script decode.py giải 2 lớp: ROT13 → base64. Kết quả: FLAG{encoding_is_not_encryption} — nhắc nhở rằng base64 không phải mã hoá.',
    ],
    terms: [
      { term: 'Encoding vs Encryption', def: 'Encoding (base64/hex) là biến đổi không cần key, đảo ngược dễ; Encryption cần key bí mật.' },
      { term: 'Base64', def: 'Biểu diễn binary dưới dạng text ASCII (A-Za-z0-9+/=); không phải mã hoá, ai cũng decode được.' },
      { term: 'ROT13', def: 'Cipher thay thế xoay 13 vị trí trong bảng chữ cái; tự đảo ngược (ROT13(ROT13(x)) = x).' },
      { term: 'Obscuration', def: 'Che giấu thông tin bằng cách làm khó đọc nhưng không dùng khoá bí mật; không an toàn thực sự.' },
    ],
    debrief: [
      'base64, hex, ROT13 không phải mã hoá — chúng là encoding; bất kỳ ai cũng decode được mà không cần key.',
      'Security by obscurity là ảo tưởng: attacker nhận ra base64 trong 5 giây, ROT13 trong 10 giây.',
      'DEFENDER: muốn bảo mật thật sự dùng AES-GCM; không bao giờ dựa vào encode để ẩn dữ liệu nhạy cảm.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/encoded.txt': {
        type: 'file',
        content: [
          '# Chuỗi tìm thấy trong config server target:',
          'WmtIe2VuY29kaW5nX2lzX25vdF9lbmNyeXB0aW9ufQ==',
          '',
          '# Ghi chú: có nhiều lớp encoding',
          '# Thử: python3 /home/hacker/decode.py',
        ].join('\n'),
      },
      '/home/hacker/decode.py': {
        type: 'file',
        content: [
          '#!/usr/bin/env python3',
          'import base64, codecs',
          '',
          'encoded = "WmtIe2VuY29kaW5nX2lzX25vdF9lbmNyeXB0aW9ufQ=="',
          'print("Decoding layers...")',
          'layer1 = codecs.decode(encoded, "rot_13")',
          'print(f"Layer 1 (ROT13): {layer1}")',
          'layer2 = base64.b64decode(layer1).decode()',
          'print(f"Layer 2 (Base64): {layer2}")',
          'layer3 = layer2.replace("ZJH", "FLAG")',
          'print(f"Layer 3 (prefix fix): {layer3}")',
          'print(f"\\nDecoded result: {layer3}")',
        ].join('\n'),
      },
    },
  },

  // ── 10 ───────────────────────────────────────────────────────────────────
  {
    id: 10,
    chapterId: 14,
    title: 'Phá Caesar & Vigenère cipher',
    story:
      'Trong một file log mã hoá thủ công, mày thấy text trông như tiếng Anh nhưng bị shift. Đây là Caesar cipher — cổ điển nhất lịch sử. Sau đó tìm thêm một đoạn Vigenère — khó hơn nhưng vẫn phá được bằng frequency analysis.',
    steps: [
      {
        id: 'cat_cipher',
        description: 'Đọc văn bản mã hoá Caesar/Vigenère',
        match: /^cat\b.*cipher\.txt/,
      },
      {
        id: 'crack_cipher',
        description: 'Phá Caesar cipher bằng python3 brute-force 26 shift',
        match: /^python3\b.*caesar/i,
        output: [
          'Caesar brute-force (shift 1-26):',
          '---',
          'Shift 13: ATTACK AT DAWN — SEND REINFORCEMENTS TO SECTOR SEVEN',
          'Shift 13 có nghĩa! (ROT13 là trường hợp đặc biệt của Caesar)',
          '',
          'Vigenère analysis:',
          'Key length estimate (Kasiski): 6',
          'Most likely key: SECRET',
          'Decrypted: THE FLAG IS FLAG{caesar_vigenere_cracked}',
        ].join('\n'),
      },
    ],
    hints: [
      'Caesar cipher chỉ có 26 trường hợp — brute-force thử hết 26 shift là ra. Vigenère cần frequency analysis nhưng key ngắn thì Kasiski phá được.',
      'Đọc cipher: `cat /home/hacker/cipher.txt`. Chạy tool phá: `python3 /home/hacker/caesar_crack.py`.',
      'Script caesar_crack.py thử tất cả 26 shift và dùng Kasiski test cho Vigenère. Caesar shift 13 = "ATTACK AT DAWN"; Vigenère key = "SECRET".',
    ],
    terms: [
      { term: 'Caesar cipher', def: 'Mã hoá thay thế đơn giản nhất: dịch mỗi ký tự đi N vị trí; chỉ 26 khả năng, brute-force tức thì.' },
      { term: 'Vigenère cipher', def: 'Mã hoá thay thế với key nhiều ký tự; mạnh hơn Caesar nhưng phá được bằng Kasiski/Index of Coincidence.' },
      { term: 'Kasiski test', def: 'Kỹ thuật tìm độ dài key Vigenère bằng cách phân tích khoảng cách giữa các đoạn lặp lại trong ciphertext.' },
      { term: 'Frequency analysis', def: 'Phân tích tần suất xuất hiện của chữ cái trong ciphertext; chữ E xuất hiện nhiều nhất (~13%) trong tiếng Anh.' },
    ],
    debrief: [
      'Caesar/Vigenère bị phá trong millisecond bằng máy tính — chúng là ví dụ lịch sử về tại sao cần mã hoá hiện đại (AES, ChaCha20).',
      'Bài học quan trọng: độ phức tạp có vẻ của mã hoá không quan trọng bằng độ bí mật của key và thuật toán.',
      'DEFENDER: không dùng cipher cổ điển hay "tự chế" trong production. AES-256-GCM là tiêu chuẩn hiện đại.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/cipher.txt': {
        type: 'file',
        content: [
          '# Caesar cipher (shift unknown):',
          'NGGNPX NG QNJA — FRAQ ERWASBEPRZBAGF GB FRPGBE FRIRA',
          '',
          '# Vigenère cipher (key unknown):',
          'LFY NPPZ ZJ NPPZ{QIUTHGV_DXPOXOPO_QVIUMUQR}',
          '',
          '# Tool: python3 /home/hacker/caesar_crack.py',
        ].join('\n'),
      },
      '/home/hacker/caesar_crack.py': {
        type: 'file',
        content: [
          '#!/usr/bin/env python3',
          'caesar_ct = "NGGNPX NG QNJA"',
          'print("Caesar brute-force (shift 1-26):")',
          'print("---")',
          'for shift in range(1, 27):',
          '    pt = "".join(chr((ord(c)-65-shift)%26+65) if c.isalpha() else c for c in caesar_ct)',
          '    if shift == 13: print(f"Shift 13: {pt}"); print("Shift 13 có nghĩa! (ROT13)")',
          'print("\\nVigenère analysis:")',
          'print("Key length estimate (Kasiski): 6")',
          'print("Most likely key: SECRET")',
          'print("Decrypted: THE FLAG IS FLAG{caesar_vigenere_cracked}")',
        ].join('\n'),
      },
    },
  },

  // ── 11 ───────────────────────────────────────────────────────────────────
  {
    id: 11,
    chapterId: 14,
    title: 'RSA modulus nhỏ — factoring attack',
    story:
      'Trong certificate của một service nội bộ cũ, mày thấy RSA key chỉ 512 bits. RSA bảo mật dựa trên độ khó phân tích thừa số nguyên tố của modulus N — nhưng N quá nhỏ thì factoring là khả thi. Factor được p và q nghĩa là tính được private key.',
    steps: [
      {
        id: 'cat_rsa_challenge',
        description: 'Đọc thông số RSA challenge (n, e, ciphertext)',
        match: /^cat\b.*rsa_challenge\.txt/,
      },
      {
        id: 'factor_rsa',
        description: 'Chạy script Python để factor RSA modulus nhỏ và giải mã',
        match: /^python3\b.*factor/i,
        output: [
          'RSA Factoring Attack',
          '===================',
          'n = 176561... (512-bit)',
          'e = 65537',
          '',
          'Factoring n (Fermat method — p and q are close)...',
          'p = 13294... (257-bit prime)',
          'q = 13283... (255-bit prime)',
          '',
          'Computing private key...',
          'phi(n) = (p-1)(q-1)',
          'd = modinv(e, phi(n)) = 97432...',
          '',
          'Decrypting ciphertext...',
          'Plaintext: FLAG{rsa_small_key_is_weak}',
          '',
          'Time taken: 0.3 seconds (Fermat factorization)',
        ].join('\n'),
      },
    ],
    hints: [
      'RSA 512-bit có thể bị factor. Nếu p và q gần nhau (lỗi implement phổ biến), Fermat factorization cực nhanh.',
      'Đọc thông số: `cat /home/hacker/rsa_challenge.txt`. Chạy factor và giải mã: `python3 /home/hacker/factor.py`.',
      'Script factor.py dùng Fermat method: nếu n = p*q với p ≈ q thì sqrt(n) ≈ p, tìm được p,q chỉ trong vài vòng lặp. Kết quả: FLAG{rsa_small_key_is_weak}.',
    ],
    terms: [
      { term: 'RSA', def: 'Thuật toán mã hoá bất đối xứng; bảo mật dựa trên độ khó phân tích n = p*q với p,q nguyên tố lớn.' },
      { term: 'Modulus (n)', def: 'Tích p*q trong RSA; phải đủ lớn (>= 2048 bit hiện nay) để phân tích nguyên tố là không khả thi.' },
      { term: 'Fermat factorization', def: 'Kỹ thuật factor n = a²-b² khi p và q gần nhau; chạy trong O(|p-q|) bước — nhanh với key generate sai.' },
      { term: 'RSA-512', def: '512-bit RSA đã bị factor bởi team nghiên cứu năm 1999 trong 35.7 CPU-years; không an toàn từ thế kỷ trước.' },
    ],
    debrief: [
      'RSA-512 factor được trong giây với Fermat nếu p,q gần nhau — hoặc trong vài giờ với GNFS ngay cả p,q cách xa nhau.',
      'Tiêu chuẩn hiện tại: RSA >= 2048 bit; 3072 bit cho đến 2030; 4096 bit sau đó. RSA-1024 cũng đang bên bờ vực.',
      'DEFENDER: dùng RSA >= 2048 bit, tốt hơn dùng ECC (ECDSA P-256 tương đương RSA-3072 với key nhỏ hơn); generate key với nguồn entropy tốt.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/rsa_challenge.txt': {
        type: 'file',
        content: [
          '# RSA Challenge — Service nội bộ (legacy system, 512-bit)',
          'n = 179769313486231590772930519078902473361797697894230657273430081',
          'e = 65537',
          '',
          '# Ciphertext (hex):',
          'c = 0x1a2b3c4d5e6f7890abcdef1234567890...(truncated)',
          '',
          '# Ghi chú: p và q được chọn gần nhau (lỗi generate key)',
          '# Tool: python3 /home/hacker/factor.py',
        ].join('\n'),
      },
      '/home/hacker/factor.py': {
        type: 'file',
        content: [
          '#!/usr/bin/env python3',
          'import math',
          'print("RSA Factoring Attack")',
          'print("===================")',
          'print("n = 176561... (512-bit)")',
          'print("e = 65537")',
          'print()',
          'print("Factoring n (Fermat method — p and q are close)...")',
          'print("p = 13294... (257-bit prime)")',
          'print("q = 13283... (255-bit prime)")',
          'print()',
          'print("Computing private key...")',
          'print("phi(n) = (p-1)(q-1)")',
          'print("d = modinv(e, phi(n)) = 97432...")',
          'print()',
          'print("Decrypting ciphertext...")',
          'print("Plaintext: FLAG{rsa_small_key_is_weak}")',
          'print()',
          'print("Time taken: 0.3 seconds (Fermat factorization)")',
        ].join('\n'),
      },
    },
  },

  // ── 12 ───────────────────────────────────────────────────────────────────
  {
    id: 12,
    chapterId: 14,
    title: 'Bẻ JWT secret yếu',
    story:
      'API của target dùng JWT (JSON Web Token) để xác thực. Mày intercept được một token hợp lệ. Nếu secret signing key yếu (nằm trong rockyou), mày tự ký token của mình với bất kỳ claims nào — kể cả role: admin.',
    steps: [
      {
        id: 'cat_jwt',
        description: 'Đọc JWT token cần crack',
        match: /^cat\b.*jwt\.txt/,
      },
      {
        id: 'crack_jwt',
        description: 'Crack JWT HMAC secret bằng hashcat -m 16500',
        match: /^hashcat\b.*-m\s*16500\b/i,
        output: [
          'hashcat (v6.2.6) starting...',
          '',
          'Hashes: 1 digests; 1 unique digests, 1 unique salts',
          '',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiam9obiIsInJvbGUiOiJ1c2VyIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c:supersecret',
          '',
          'Session..........: hashcat',
          'Status...........: Cracked',
          'Hash.Mode........: 16500 (JWT (JSON Web Token))',
          'Time.Started.....: Mon Jun 29 10:50:00 2026 (0 secs)',
          'Kernel.Speed.....: 156.3 MH/s',
          'Recovered........: 1/1 (100.00%) Digests',
          'Progress.........: 8192/14344392 (0.06%)',
          '',
          'Secret: supersecret',
        ].join('\n'),
      },
    ],
    hints: [
      'JWT HS256/HS384/HS512 dùng HMAC với secret để ký. Nếu secret yếu, hashcat -m 16500 crack được bằng wordlist.',
      'Đọc token: `cat /home/hacker/jwt.txt`. Crack: `hashcat -m 16500 /home/hacker/jwt.txt /usr/share/wordlists/rockyou.txt`.',
      'Secret là "supersecret". Dùng jwt.io để forge token với role:admin — ghi claims mới, ký lại bằng secret vừa crack.',
    ],
    terms: [
      { term: 'JWT (JSON Web Token)', def: 'Token xác thực dạng base64url(header).base64url(payload).signature; HS256 dùng HMAC-SHA256 với shared secret.' },
      { term: 'JWT forgery', def: 'Giả mạo JWT bằng cách biết secret và ký claims bất kỳ (VD: role:admin); nguy hiểm nhất khi secret yếu.' },
      { term: 'hashcat -m 16500', def: 'Mode JWT trong hashcat; crack phần signature bằng wordlist để tìm HMAC secret.' },
      { term: 'Algorithm confusion attack', def: 'Đổi JWT alg từ RS256 sang HS256, dùng public key làm secret — một lỗ hổng classic khác của JWT.' },
    ],
    debrief: [
      '"supersecret" là secret nghiêm túc nhất của mọi tutorial không đọc documentation — và nó nằm đầu mọi wordlist chuyên JWT.',
      'Khi có secret: forge token với role:admin, sub: bất kỳ user, exp: xa trong tương lai. Server không biết token giả hay thật.',
      'DEFENDER: JWT secret phải là random >= 32 bytes; tốt hơn, dùng RS256/ES256 (public key verify, không cần chia secret); đặt expiry ngắn và rotate key.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/jwt.txt': {
        type: 'file',
        content: [
          '# JWT token capture từ traffic intercept',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiam9obiIsInJvbGUiOiJ1c2VyIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          '',
          '# Decode header: {"alg":"HS256","typ":"JWT"}',
          '# Decode payload: {"user":"john","role":"user"}',
          '# Target: crack secret -> forge token với role:admin',
        ].join('\n'),
      },
    },
  },

  // ── 13 ───────────────────────────────────────────────────────────────────
  {
    id: 13,
    chapterId: 14,
    title: 'Crack NTLM Windows hash',
    story:
      'Sau khi dump LSASS trên DC (từ chương Active Directory), mày có NTLM hash của các admin. NTLM là MD4 của Unicode mật khẩu — cực nhanh, không có salt. GPU crack NTLM nhanh gần gấp đôi MD5.',
    steps: [
      {
        id: 'cat_ntlm',
        description: 'Đọc file NTLM hash dump từ SAM/LSASS',
        match: /^cat\b.*ntlm\.txt/,
      },
      {
        id: 'crack_ntlm',
        description: 'Crack NTLM bằng hashcat -m 1000',
        match: /^hashcat\b.*-m\s*1000\b/i,
        output: [
          'hashcat (v6.2.6) starting...',
          '',
          'Hashes: 3 digests; 3 unique digests, 1 unique salts',
          '',
          '31d6cfe0d16ae931b73c59d7e0c089c0:',
          '32ed87bdb5fdc5e9cba88547376818d4:abc123',
          '',
          'Session..........: hashcat',
          'Status...........: Exhausted',
          'Hash.Mode........: 1000 (NTLM)',
          'Hash.Target......: /home/hacker/ntlm.txt',
          'Time.Started.....: Mon Jun 29 11:00:00 2026 (0 secs)',
          'Kernel.Speed.....: 98.7 GH/s (0.32ms)',
          'Recovered........: 2/3 (66.67%) Digests',
          'Progress.........: 14344392/14344392 (100.00%)',
          '',
          '# 31d6cfe0... = NTLM hash của empty string (blank password!)',
        ].join('\n'),
      },
    ],
    hints: [
      'NTLM là MD4(UTF-16LE(password)) — không có salt, cực nhanh. RTX 3090 crack ~100 GH/s NTLM. Dump từ LSASS/SAM thì crack offline.',
      'Đọc hash: `cat /home/hacker/ntlm.txt`. Crack: `hashcat -m 1000 /home/hacker/ntlm.txt /usr/share/wordlists/rockyou.txt`.',
      'Hai trong ba hash crack được: empty string ("") và "abc123". Hash của Administrator chưa crack — mật khẩu phức tạp hơn rockyou.',
    ],
    terms: [
      { term: 'NTLM', def: 'NT LAN Manager — hash mật khẩu Windows; MD4(UTF-16LE(password)), không salt, dùng cho Pass-the-Hash và crack.' },
      { term: 'hashcat -m 1000', def: 'Mode NTLM (NT hash) trong hashcat; LM hash (-m 3000) còn yếu hơn.' },
      { term: 'Pass-the-Hash (PtH)', def: 'Dùng NTLM hash trực tiếp để authenticate không cần biết plaintext; crack chỉ cần để lấy plaintext cho pivot.' },
      { term: 'LM hash', def: 'Legacy LAN Manager hash (trước NTLM); cực yếu, chia thành 2 block 7 ký tự, crack trong giây; thường bị disable.' },
    ],
    debrief: [
      '31d6cfe0d16ae931b73c59d7e0c089c0 là NTLM của empty string — tài khoản không có password trong AD, là lỗ hổng trực tiếp.',
      'NTLM không có salt: cùng mật khẩu = cùng hash cho mọi user/domain. Rainbow table NTLM tồn tại online, lookup mà không cần GPU.',
      'DEFENDER: enforce password policy; tắt NTLM v1, giới hạn NTLMv2; dùng Kerberos thay NTLM; Protected Users group cho admin accounts.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/ntlm.txt': {
        type: 'file',
        content: [
          '# NTLM hash dump (secretsdump / mimikatz)',
          '31d6cfe0d16ae931b73c59d7e0c089c0',
          '32ed87bdb5fdc5e9cba88547376818d4',
          'aad3b435b51404eeaad3b435b51404ee',
          '',
          '# Accounts tương ứng:',
          '# Administrator: 31d6cfe0... (blank?)',
          '# backup_svc: 32ed87bdb... (service account)',
          '# guest: aad3b435... (LM placeholder)',
        ].join('\n'),
      },
    },
  },

  // ── 14 ───────────────────────────────────────────────────────────────────
  {
    id: 14,
    chapterId: 14,
    title: 'Salt & Rainbow Table — tại sao salt quan trọng',
    story:
      'Để hiểu sâu tại sao salt quan trọng, mày sẽ thực nghiệm: crack hash không salt bằng hashcat chỉ trong giây, rồi xem script minh hoạ tại sao hash có salt không crack được bằng rainbow table. Đây là lý do mọi password hash hiện đại đều có salt.',
    steps: [
      {
        id: 'cat_salt_demo',
        description: 'Đọc file demo so sánh hash có salt và không salt',
        match: /^cat\b.*salt_demo\.txt/,
      },
      {
        id: 'crack_unsalted',
        description: 'Crack MD5 unsalted bằng hashcat để thấy tốc độ',
        match: /^hashcat\b.*-m\s*0\b.*unsalted|^hashcat\b.*unsalted.*-m\s*0\b/i,
        output: [
          'hashcat (v6.2.6) starting...',
          '',
          '5f4dcc3b5aa765d61d8327deb882cf99:password',
          '',
          'Status...........: Cracked',
          'Hash.Mode........: 0 (MD5)',
          'Kernel.Speed.....: 51.2 GH/s',
          'Recovered........: 1/1 (100.00%) Digests',
          'Progress.........: 1/14344392 (0.00%)',
          '',
          '# Hash không salt: crack ngay vì "password" = 5f4dcc3b luôn luôn',
        ].join('\n'),
      },
      {
        id: 'show_salted',
        description: 'Xem script minh hoạ tại sao hash có salt chặn rainbow table',
        match: /^python3\b.*salt_demo/i,
        output: [
          'Demo: Salt chặn rainbow table thế nào',
          '======================================',
          '',
          '# Mật khẩu: "password" — giống nhau cho cả 3 user',
          'MD5("password")                     = 5f4dcc3b5aa765d61d8327deb882cf99  <- SAME!',
          '',
          'MD5("randomsalt1" + "password")     = a1b2c3d4e5f67890...  <- khác',
          'MD5("differentS2" + "password")     = 9f8e7d6c5b4a3201...  <- khác',
          'MD5("uniqueXXXX3" + "password")     = 0123456789abcdef...  <- khác',
          '',
          '=> Cùng mật khẩu + salt khác nhau = hash hoàn toàn khác nhau',
          '=> Rainbow table cho "password" = 5f4dcc3b... KHÔNG DÙNG ĐƯỢC nữa',
          '=> Attacker phải crack TỪNG hash riêng lẻ với đúng salt của nó',
        ].join('\n'),
      },
    ],
    hints: [
      'Salt là chuỗi ngẫu nhiên thêm vào trước khi hash; nó làm mỗi user có hash khác nhau dù cùng mật khẩu. Đọc trước: `cat /home/hacker/salt_demo.txt`.',
      'Crack hash không salt để thấy tốc độ: `hashcat -m 0 /home/hacker/unsalted.txt /usr/share/wordlists/rockyou.txt`. Xong chạy demo: `python3 /home/hacker/salt_demo.py`.',
      'Không salted = rainbow table lookup 0 giây. Có salt = phải crack từng hash riêng với đúng salt — nhân bội tài nguyên với số user.',
    ],
    terms: [
      { term: 'Salt', def: 'Chuỗi ngẫu nhiên độc nhất per-user thêm vào mật khẩu trước khi hash; ngăn rainbow table và tấn công song song.' },
      { term: 'Rainbow table', def: 'Bảng tra cứu precomputed hash→plaintext; lookup tức thì nhưng vô dụng khi có salt.' },
      { term: 'Pepper', def: 'Secret ngẫu nhiên thêm vào hash, khác salt ở chỗ không lưu cùng hash trong DB; lớp bảo vệ thêm nếu DB bị leak.' },
      { term: 'Time-memory trade-off', def: 'Rainbow table: dùng nhiều bộ nhớ để giảm thời gian crack; salt phá vỡ vì cần bảng riêng cho mỗi salt.' },
    ],
    debrief: [
      'Không salt: mọi user dùng "password" có hash giống nhau — crack 1 ra tất cả; rainbow table lookup tức thì.',
      'Có salt ngẫu nhiên: 100 user cùng mật khẩu có 100 hash khác nhau; attacker phải crack 100 lần riêng lẻ.',
      'DEFENDER: mọi thư viện mật khẩu hiện đại (bcrypt, Argon2, PBKDF2) tự động thêm salt ngẫu nhiên — chỉ cần gọi đúng hàm.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/salt_demo.txt': {
        type: 'file',
        content: [
          '# Demo: Tại sao salt quan trọng',
          '================================',
          '',
          '# Hash không salt (MD5):',
          '# user1: password = "password" -> 5f4dcc3b5aa765d61d8327deb882cf99',
          '# user2: password = "password" -> 5f4dcc3b5aa765d61d8327deb882cf99  <- SAME!',
          '# user3: password = "password" -> 5f4dcc3b5aa765d61d8327deb882cf99  <- SAME!',
          '',
          '# File crack: /home/hacker/unsalted.txt',
          '# Script demo: python3 /home/hacker/salt_demo.py',
        ].join('\n'),
      },
      '/home/hacker/unsalted.txt': {
        type: 'file',
        content: '5f4dcc3b5aa765d61d8327deb882cf99',
      },
      '/home/hacker/salt_demo.py': {
        type: 'file',
        content: [
          '#!/usr/bin/env python3',
          'import hashlib',
          'password = "password"',
          'print("Demo: Salt chặn rainbow table thế nào")',
          'print("======================================")',
          'print()',
          'print(f"# Mật khẩu: \\"{password}\\" — giống nhau cho cả 3 user")',
          'no_salt = hashlib.md5(password.encode()).hexdigest()',
          'print(f"MD5(\\"{password}\\")                     = {no_salt}  <- SAME!")',
          'print()',
          'for salt in ["randomsalt1", "differentS2", "uniqueXXXX3"]:',
          '    h = hashlib.md5((salt + password).encode()).hexdigest()',
          '    print(f"MD5(\\"{salt}\\" + \\"{password}\\")     = {h}  <- khác")',
          'print()',
          'print("=> Cùng mật khẩu + salt khác nhau = hash hoàn toàn khác nhau")',
          'print("=> Rainbow table cho \\"password\\" = 5f4dcc3b... KHÔNG DÙNG ĐƯỢC nữa")',
          'print("=> Attacker phải crack TỪNG hash riêng lẻ với đúng salt của nó")',
        ].join('\n'),
      },
    },
  },

  // ── 15 ───────────────────────────────────────────────────────────────────
  {
    id: 15,
    chapterId: 14,
    title: 'Capture the Flag — Giải chuỗi crypto cuối',
    story:
      'Chương cuối. Target để lại một chuỗi thử thách cuối: một hash bcrypt ẩn plaintext là mật khẩu để mở file, bên trong là flag. Kết hợp mọi thứ đã học: nhận diện → crack → đọc flag.',
    steps: [
      {
        id: 'cat_final',
        description: 'Đọc file challenge cuối để hiểu cấu trúc',
        match: /^cat\b.*final_challenge\.txt/,
      },
      {
        id: 'crack_final_hash',
        description: 'Crack hash bcrypt trong challenge bằng hashcat -m 3200',
        match: /^hashcat\b.*-m\s*3200\b.*final|^hashcat\b.*final.*-m\s*3200\b/i,
        output: [
          'hashcat (v6.2.6) starting...',
          '',
          '$2y$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234:letmein',
          '',
          'Status...........: Cracked',
          'Hash.Mode........: 3200 (bcrypt $2*$, Blowfish (Unix))',
          'Time.Started.....: Mon Jun 29 11:15:00 2026 (1 min, 22 secs)',
          'Kernel.Speed.....: 184 H/s',
          'Recovered........: 1/1 (100.00%) Digests',
        ].join('\n'),
      },
      {
        id: 'read_flag',
        description: 'Đọc flag trong /home/hacker/loot/flag.txt',
        match: /^cat\b.*loot\/flag\.txt/,
      },
    ],
    hints: [
      'Challenge cuối kết hợp: crack bcrypt để lấy mật khẩu, dùng mật khẩu đó mở file, rồi đọc flag. Đọc trước: `cat /home/hacker/final_challenge.txt`.',
      'Crack bcrypt: `hashcat -m 3200 /home/hacker/final_hash.txt /usr/share/wordlists/rockyou.txt`. Mật khẩu nằm trong rockyou.',
      'Mật khẩu bcrypt là "letmein". Flag nằm ở: `cat /home/hacker/loot/flag.txt`.',
    ],
    terms: [
      { term: 'Crypto challenge', def: 'Dạng bài CTF kết hợp nhiều kỹ thuật crypto: nhận diện → crack → decrypt → flag.' },
      { term: 'Defense in depth (crypto)', def: 'Kết hợp nhiều lớp bảo vệ: mật khẩu mạnh + hash tốt + mã hoá file; một lớp bị phá chưa mất tất cả.' },
      { term: 'letmein', def: 'Mật khẩu cực phổ biến (top 10 rockyou); dùng trong demo — không bao giờ dùng thực tế.' },
      { term: 'Flag', def: 'Chuỗi bí mật chứng minh đã giải được challenge; format thường FLAG{...} hoặc HTB{...}.' },
    ],
    debrief: [
      'Chuỗi attack crypto hoàn chỉnh: nhận diện hash → chọn đúng tool/mode → crack → dùng plaintext tiếp → capture flag.',
      'Mọi bước trong chương này phản ánh thực tế: MD5/SHA-256 thô bị crack trong giây, bcrypt chậm nhưng vẫn thua mật khẩu yếu, JWT secret yếu là lỗ hổng phổ biến, RSA nhỏ = factor được.',
      'DEFENDER: hash = bcrypt/Argon2 (mật khẩu) hoặc SHA-256 (data integrity); JWT = RS256 với key rotation; RSA = 2048+ bit. Không tự chế thuật toán.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/final_challenge.txt': {
        type: 'file',
        content: [
          '# FINAL CHALLENGE — Cryptography Chapter',
          '=========================================',
          '',
          'Tao ẩn flag sau một hash bcrypt cost=10.',
          'Crack hash này để lấy mật khẩu -> đọc flag.',
          '',
          'Bcrypt hash: $2y$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234',
          '',
          'Steps:',
          '1. Crack: hashcat -m 3200 /home/hacker/final_hash.txt /usr/share/wordlists/rockyou.txt',
          '2. Flag ở: /home/hacker/loot/flag.txt',
        ].join('\n'),
      },
      '/home/hacker/final_hash.txt': {
        type: 'file',
        content: '$2y$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234',
      },
      '/home/hacker/loot': { type: 'dir' },
      '/home/hacker/loot/flag.txt': {
        type: 'file',
        content: 'FLAG{crypto_master_md5_sha_bcrypt_jwt_rsa_all_cracked}',
      },
    },
  },
];
