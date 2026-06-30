// Chương 14 — Cryptography & Hash Cracking. 15 mission, FS inline, engine offline.
// Lệnh tool (hashcat/john/zip2john/ssh2john/hashid/openssl/python/base64) => có `output`
// đóng hộp tiếng Anh giống tool thật. Lệnh file-based (cat/grep) => KHÔNG đặt output;
// nội dung (hash, ciphertext, key) nằm trong initialFilesystem.
// Mạch: nhận diện hash -> crack MD5/SHA/shadow/bcrypt -> zip/ssh/wpa -> encoding/cipher
// -> RSA yếu -> JWT/NTLM -> salt&rainbow -> capture flag.

const ROOT_FS = {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
};

// Đầu phiên hashcat (rút gọn) — tái dùng cho nhiều output cho thực tế.
const HC_HEAD = 'hashcat (v6.2.6) starting';

export default [
  // ── 1 ──────────────────────────────────────────────────────────────────────
  {
    id: 1,
    chapterId: 14,
    title: 'Nhận diện loại hash',
    story:
      'Sau mấy chiến dịch trước, mày gom được một file đầy hash đủ thể loại. Sai lầm của lính mới là quăng đại vào hashcat với mode bừa. Trước khi crack, phải biết MỖI hash là loại gì — độ dài, prefix ($1$, $2y$, $6$) tố cáo thuật toán và mode tương ứng.',
    steps: [
      {
        id: 'read_hashes',
        description: 'Đọc file hash thu thập được',
        match: /^cat\b.*hashes\.txt/,
      },
      {
        id: 'identify',
        description: 'Dùng hashid để nhận diện thuật toán + gợi ý hashcat mode',
        match: /^hashid\b/i,
        output: [
          "Analyzing '5f4dcc3b5aa765d61d8327deb882cf99'",
          '[+] MD5 [Hashcat Mode: 0]',
          '[+] NTLM [Hashcat Mode: 1000]',
          "Analyzing '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'",
          '[+] bcrypt $2*$, Blowfish [Hashcat Mode: 3200]',
          "Analyzing '$6$rounds=5000$abc$...'",
          '[+] sha512crypt $6$, SHA512 (Unix) [Hashcat Mode: 1800]',
        ].join('\n'),
      },
    ],
    hints: [
      'Đừng crack mù. Mỗi thuật toán có "chữ ký" riêng: MD5 dài 32 hex, $1$=md5crypt, $2y$=bcrypt, $6$=sha512crypt, NTLM 32 hex (giống MD5 nhưng dùng cho Windows).',
      'Đọc file trước để xem có gì: `cat /home/hacker/hashes.txt`.',
      'Tự động nhận diện: `hashid /home/hacker/hashes.txt` — nó in ra thuật toán kèm Hashcat Mode để mày chọn -m đúng.',
    ],
    debrief: [
      'Chọn đúng hash-mode là 90% công việc crack: sai mode thì hashcat băm kiểu khác và không bao giờ ra.',
      'Prefix là manh mối vàng: $1$/$2$/$5$/$6$ là họ crypt(3) trên Linux; hash 32 hex trần có thể là MD5 hoặc NTLM tùy ngữ cảnh (file shadow vs SAM/NTDS).',
      'hashid/hash-identifier chỉ ĐOÁN theo hình dạng — vẫn cần ngữ cảnh (lấy từ đâu) để chốt.',
      'DEFENDER: dùng thuật toán chậm có salt (bcrypt, argon2, scrypt) thay cho MD5/SHA trần; chính hình dạng hash bị lộ đã nói cho attacker biết phải tấn công bằng mode nào.',
    ],
    terms: [
      { term: 'hash', def: 'Hàm một chiều biến dữ liệu thành chuỗi cố định; không giải ngược được, chỉ đoán-rồi-băm-so-sánh.' },
      { term: 'hash mode (-m)', def: 'Mã số hashcat cho từng thuật toán: 0=MD5, 100=SHA1, 1400=SHA256, 1800=sha512crypt, 3200=bcrypt, 1000=NTLM...' },
      { term: 'crypt(3) prefix', def: 'Tiền tố $id$ trong /etc/shadow xác định thuật toán: $1$=MD5, $5$=SHA256, $6$=SHA512, $2y$=bcrypt.' },
      { term: 'hashid', def: 'Công cụ nhận diện loại hash dựa trên độ dài và định dạng, gợi ý hashcat mode tương ứng.' },
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/hashes.txt': {
        type: 'file',
        content: [
          '5f4dcc3b5aa765d61d8327deb882cf99',
          '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
          '$6$rounds=5000$abcSALT$3xampleHashValueTruncated...',
          '8846f7eaee8fb117ad06bdd830b7586c',
        ].join('\n'),
      },
    },
  },

  // ── 2 ──────────────────────────────────────────────────────────────────────
  {
    id: 2,
    chapterId: 14,
    title: 'Bẻ MD5 bằng wordlist',
    story:
      'Hash đầu tiên là MD5 trần — không salt, nhanh kinh khủng. Đây là tấn công từ điển: thử lần lượt từng từ trong rockyou.txt, băm MD5, so với hash. Mật khẩu phổ biến thì rơi trong tích tắc.',
    steps: [
      {
        id: 'cat_md5',
        description: 'Xem hash MD5 cần bẻ',
        match: /^cat\b.*md5\.txt/,
      },
      {
        id: 'crack_md5',
        description: 'Bẻ MD5 (mode 0) bằng wordlist rockyou',
        match: /^hashcat\s+-m\s*0\b/i,
        output: [
          HC_HEAD,
          '',
          'Dictionary cache hit:',
          '* Filename..: rockyou.txt',
          '* Passwords.: 14344385',
          '',
          '5f4dcc3b5aa765d61d8327deb882cf99:password',
          '',
          'Session..........: hashcat',
          'Status...........: Cracked',
          'Hash.Mode........: 0 (MD5)',
          'Recovered........: 1/1 (100.00%) Digests',
        ].join('\n'),
      },
    ],
    hints: [
      'MD5 không salt = mỗi mật khẩu luôn ra cùng một hash, nên từ điển dựng sẵn bẻ rất nhanh.',
      'Xem hash: `cat /home/hacker/md5.txt`.',
      'Bẻ bằng wordlist: `hashcat -m 0 /home/hacker/md5.txt rockyou.txt`. Mode 0 = MD5. Xong xem lại bằng `hashcat -m 0 /home/hacker/md5.txt --show`.',
    ],
    debrief: [
      'Tấn công từ điển hiệu quả vì người dùng chọn mật khẩu trong một không gian nhỏ, dễ đoán (rockyou.txt là 14 triệu mật khẩu rò rỉ thật).',
      'MD5 nhanh là điểm yếu chí mạng cho mục đích lưu mật khẩu: GPU băm hàng tỉ MD5/giây, brute-force cả không gian ngắn trong vài phút.',
      'Không salt nghĩa là hai người cùng mật khẩu có cùng hash → lộ trùng lặp và mở đường cho rainbow table.',
      'DEFENDER: không bao giờ dùng MD5/SHA trần cho mật khẩu; dùng bcrypt/argon2 có salt + cost cao để mỗi lần thử tốn thời gian.',
    ],
    terms: [
      { term: 'tấn công từ điển', def: 'Thử lần lượt các mật khẩu trong danh sách (wordlist), băm rồi so với hash mục tiêu.' },
      { term: 'rockyou.txt', def: 'Wordlist kinh điển gồm ~14 triệu mật khẩu rò rỉ từ vụ RockYou 2009; chuẩn de-facto để crack.' },
      { term: 'MD5', def: 'Hàm băm 128-bit, nhanh và đã vỡ về mặt mật mã; tuyệt đối không dùng để lưu mật khẩu.' },
      { term: '--show', def: 'Cờ hashcat in lại các cặp hash:plaintext đã crack (lưu trong potfile) mà không chạy lại.' },
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/md5.txt': { type: 'file', content: '5f4dcc3b5aa765d61d8327deb882cf99' },
    },
  },

  // ── 3 ──────────────────────────────────────────────────────────────────────
  {
    id: 3,
    chapterId: 14,
    title: 'SHA-256 cũng không cứu nổi',
    story:
      'Lập trình viên nghĩ đổi MD5 sang SHA-256 là "bảo mật hơn". Nhầm to: SHA-256 vẫn là hàm nhanh, không salt. Cùng một wordlist, chỉ đổi mode sang 1400 là bẻ y như cũ.',
    steps: [
      {
        id: 'cat_sha',
        description: 'Xem hash SHA-256',
        match: /^cat\b.*sha256\.txt/,
      },
      {
        id: 'crack_sha',
        description: 'Bẻ SHA-256 (mode 1400) bằng rockyou',
        match: /^hashcat\s+-m\s*1400\b/i,
        output: [
          HC_HEAD,
          '',
          '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08:test',
          '',
          'Session..........: hashcat',
          'Status...........: Cracked',
          'Hash.Mode........: 1400 (SHA2-256)',
          'Recovered........: 1/1 (100.00%) Digests',
        ].join('\n'),
      },
    ],
    hints: [
      'Đổi thuật toán mà vẫn nhanh + không salt thì chẳng giải quyết gì — tốc độ mới là kẻ thù của mật khẩu băm.',
      'Xem hash: `cat /home/hacker/sha256.txt`.',
      'Mode SHA-256 là 1400: `hashcat -m 1400 /home/hacker/sha256.txt rockyou.txt`.',
    ],
    debrief: [
      '"SHA-256 mạnh hơn MD5" đúng về kháng va chạm, nhưng SAI cho việc lưu mật khẩu: cả hai đều quá nhanh, đều brute-force được.',
      'Điểm mấu chốt của lưu mật khẩu là phải CHẬM và có SALT, không phải "thuật toán nghe oai".',
      'Cùng một wordlist tái dùng cho mọi hàm nhanh — attacker chỉ đổi mode.',
      'DEFENDER: dùng KDF chuyên dụng (bcrypt/scrypt/argon2) có tham số cost; chúng cố ý chậm để mỗi lần đoán tốn tài nguyên.',
    ],
    terms: [
      { term: 'SHA-256', def: 'Hàm băm 256-bit họ SHA-2; an toàn cho chữ ký/checksum nhưng quá nhanh để lưu mật khẩu.' },
      { term: 'KDF', def: 'Key Derivation Function — hàm dẫn xuất khoá cố ý chậm (bcrypt, argon2) dùng để lưu mật khẩu an toàn.' },
      { term: 'salt', def: 'Chuỗi ngẫu nhiên thêm vào mỗi mật khẩu trước khi băm; chặn rainbow table và làm lộ trùng lặp biến mất.' },
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/sha256.txt': {
        type: 'file',
        content: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      },
    },
  },

  // ── 4 ──────────────────────────────────────────────────────────────────────
  {
    id: 4,
    chapterId: 14,
    title: 'Đập /etc/shadow',
    story:
      'Từ một vụ privesc trước, mày bê được /etc/shadow. Trong đó là hash $6$ — sha512crypt, có salt và rounds. Chậm hơn MD5 nhiều, nhưng nếu admin đặt mật khẩu yếu thì john vẫn moi ra.',
    steps: [
      {
        id: 'cat_shadow',
        description: 'Đọc file shadow lấy được',
        match: /^cat\b.*shadow/,
      },
      {
        id: 'john_shadow',
        description: 'Bẻ sha512crypt bằng john + wordlist',
        match: /^john\b.*(sha512crypt|shadow)/i,
        output: [
          'Using default input encoding: UTF-8',
          'Loaded 1 password hash (sha512crypt, crypt(3) $6$ [SHA512 256/256 AVX2])',
          "Proceeding with wordlist:/usr/share/wordlists/rockyou.txt",
          'Summer2024       (admin)',
          '1g 0:00:00:09 DONE (2026-06-30) 0.1041g/s ...',
          'Use the "--show" option to display all of the cracked passwords',
        ].join('\n'),
      },
    ],
    hints: [
      '$6$ là sha512crypt — có salt nên rainbow table vô dụng, phải brute-force/wordlist từng dòng.',
      'Đọc hash: `cat /home/hacker/shadow`.',
      'Để john tự nhận format và chạy: `john --format=sha512crypt --wordlist=rockyou.txt /home/hacker/shadow`. Xong xem `john --show /home/hacker/shadow`.',
    ],
    debrief: [
      'sha512crypt ($6$) tốt hơn MD5 nhiều nhờ salt + rounds, nhưng mật khẩu yếu (Summer2024) vẫn rơi trước wordlist.',
      'Mật khẩu mạnh quan trọng ngang thuật toán: KDF chậm chỉ mua thời gian, không cứu được "Password123".',
      'unshadow ghép /etc/passwd với /etc/shadow để john biết user nào ứng hash nào — ở đây ta đã có sẵn dòng hash.',
      'DEFENDER: ép chính sách mật khẩu mạnh + chặn mật khẩu trong danh sách rò rỉ; tăng rounds; bảo vệ /etc/shadow như tài sản tối mật.',
    ],
    terms: [
      { term: 'sha512crypt ($6$)', def: 'Thuật toán băm mật khẩu mặc định của Linux hiện đại: SHA-512 lặp nhiều rounds, có salt.' },
      { term: 'john the ripper', def: 'Công cụ crack mật khẩu cổ điển, tự nhận diện nhiều format và hỗ trợ wordlist/rule/brute-force.' },
      { term: 'unshadow', def: 'Tiện ích của john ghép /etc/passwd + /etc/shadow thành định dạng john đọc được.' },
      { term: '/etc/shadow', def: 'File chứa hash mật khẩu người dùng Linux; chỉ root đọc được — mục tiêu hàng đầu sau khi privesc.' },
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/shadow': {
        type: 'file',
        content: 'admin:$6$rounds=5000$abcSALT$3xampleHashValueTruncatedForBrevity0123456789:19700:0:99999:7:::',
      },
    },
  },

  // ── 5 ──────────────────────────────────────────────────────────────────────
  {
    id: 5,
    chapterId: 14,
    title: 'bcrypt — chậm nhưng không bất khả',
    story:
      'Database web app dùng bcrypt ($2y$) — đúng chuẩn lưu mật khẩu. Mỗi lần thử tốn vài mili-giây thay vì nano-giây, nên không thể brute-force cả không gian. Nhưng wordlist nhắm mật khẩu yếu vẫn ăn, chỉ chậm hơn.',
    steps: [
      {
        id: 'cat_bcrypt',
        description: 'Xem hash bcrypt từ DB dump',
        match: /^cat\b.*bcrypt\.txt/,
      },
      {
        id: 'crack_bcrypt',
        description: 'Bẻ bcrypt (mode 3200) bằng rockyou',
        match: /^hashcat\s+-m\s*3200\b/i,
        output: [
          HC_HEAD,
          '',
          '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy:hunter2',
          '',
          'Session..........: hashcat',
          'Status...........: Cracked',
          'Hash.Mode........: 3200 (bcrypt $2*$, Blowfish)',
          'Speed.#1.........:     3214 H/s   <- chậm hơn MD5 ~triệu lần (cố ý)',
          'Recovered........: 1/1 (100.00%) Digests',
        ].join('\n'),
      },
    ],
    hints: [
      'bcrypt cố ý CHẬM (cost factor) — tốc độ tụt từ tỉ H/s xuống vài nghìn H/s, nên chỉ wordlist mật khẩu yếu mới khả thi.',
      'Xem hash: `cat /home/hacker/bcrypt.txt`.',
      'Mode bcrypt là 3200: `hashcat -m 3200 /home/hacker/bcrypt.txt rockyou.txt`. Để ý Speed thấp hẳn so với MD5.',
    ],
    debrief: [
      'bcrypt là lựa chọn đúng: cost factor (số "$10$") làm mỗi lần băm tốn ~hằng số thời gian, vô hiệu hoá lợi thế GPU.',
      'Nhưng "chậm" không phải "bất khả": mật khẩu yếu (hunter2) vẫn nằm trong wordlist nên vẫn rơi.',
      'Tăng cost factor mỗi vài năm để theo kịp phần cứng — đó là thiết kế có chủ đích của bcrypt.',
      'DEFENDER: dùng bcrypt cost>=12 hoặc argon2id; cộng thêm chính sách mật khẩu mạnh + MFA để ngay cả khi hash lộ cũng khó dùng.',
    ],
    terms: [
      { term: 'bcrypt', def: 'Hàm băm mật khẩu dựa trên Blowfish, có salt và cost factor điều chỉnh được; chuẩn lưu mật khẩu phổ biến.' },
      { term: 'cost factor', def: 'Số mũ (work factor) trong bcrypt: tăng 1 đơn vị làm thời gian băm tăng gấp đôi, chống brute-force.' },
      { term: 'H/s', def: 'Hashes per second — tốc độ thử; bcrypt cố ý kéo tụt con số này để mỗi lần đoán đắt đỏ.' },
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/bcrypt.txt': {
        type: 'file',
        content: '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
      },
    },
  },

  // ── 6 ──────────────────────────────────────────────────────────────────────
  {
    id: 6,
    chapterId: 14,
    title: 'File ZIP có mật khẩu',
    story:
      'Trong đống dữ liệu exfil có một file backup.zip đặt mật khẩu. Không cần biết mật khẩu trước: zip2john trích "hash" của ZIP ra, rồi john bẻ như mọi hash khác.',
    steps: [
      {
        id: 'zip2john',
        description: 'Trích hash từ file ZIP để john bẻ được',
        match: /^zip2john\b/i,
        output: 'backup.zip:$pkzip2$1*2*...*$/pkzip2$:backup.zip::backup.zip',
      },
      {
        id: 'john_zip',
        description: 'Bẻ mật khẩu ZIP bằng john + wordlist',
        match: /^john\b.*(\.hash|zip)/i,
        output: [
          'Using default input encoding: UTF-8',
          'Loaded 1 password hash (PKZIP [32/64])',
          'letmein123       (backup.zip)',
          '1g 0:00:00:00 DONE (2026-06-30) ...',
        ].join('\n'),
      },
    ],
    hints: [
      'Không phá trực tiếp được file nén — trích "hash" của nó ra rồi crack hash đó.',
      'Trích hash: `zip2john /home/hacker/backup.zip > zip.hash`.',
      'Rồi bẻ: `john --wordlist=rockyou.txt zip.hash`. Mật khẩu hiện trong ngoặc ở dòng kết quả.',
    ],
    debrief: [
      'Mẫu "2john": ZIP/RAR/PDF/Office/SSH key đều có script *2john trích phần kiểm tra mật khẩu thành hash để john/hashcat bẻ.',
      'ZIP cũ (PKZIP/ZipCrypto) yếu; ngay cả AES-ZIP cũng crack được nếu mật khẩu yếu.',
      'Đây là lý do "đặt pass cho file zip" KHÔNG phải mã hoá nghiêm túc cho dữ liệu nhạy cảm.',
      'DEFENDER: mã hoá dữ liệu nhạy cảm bằng công cụ mạnh (age, gpg, 7z-AES) với passphrase dài, ngẫu nhiên; đừng dựa vào pass ZIP.',
    ],
    terms: [
      { term: 'zip2john', def: 'Tiện ích trích thông tin kiểm tra mật khẩu của file ZIP thành định dạng hash cho john/hashcat.' },
      { term: 'họ *2john', def: 'Bộ script (ssh2john, zip2john, office2john, rar2john...) chuyển định dạng có mật khẩu thành hash crack được.' },
      { term: 'PKZIP', def: 'Sơ đồ mã hoá ZIP cổ điển (ZipCrypto), yếu và crack nhanh với known-plaintext hoặc wordlist.' },
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/backup.zip': { type: 'file', content: '[binary ZIP archive — password protected]' },
    },
  },

  // ── 7 ──────────────────────────────────────────────────────────────────────
  {
    id: 7,
    chapterId: 14,
    title: 'Passphrase của SSH key',
    story:
      'Mày trộm được một id_rsa private key, nhưng nó được bảo vệ bằng passphrase ("ENCRYPTED" trong header). Vẫn áp dụng mẫu 2john: ssh2john trích hash, rồi bẻ.',
    steps: [
      {
        id: 'cat_key',
        description: 'Xem header private key để xác nhận có passphrase',
        match: /^cat\b.*id_rsa/,
      },
      {
        id: 'ssh2john',
        description: 'Trích hash passphrase từ private key',
        match: /^ssh2john\b/i,
        output: 'id_rsa:$sshng$6$16$a1b2c3...$1230$encrypted_blob_truncated...',
      },
      {
        id: 'john_ssh',
        description: 'Bẻ passphrase bằng john + wordlist',
        match: /^john\b.*(\.hash|ssh)/i,
        output: [
          'Loaded 1 password hash (SSH, SSH private key [RSA/DSA/EC/OPENSSH 32/64])',
          'iloveyou         (id_rsa)',
          '1g 0:00:00:02 DONE (2026-06-30) ...',
        ].join('\n'),
      },
    ],
    hints: [
      'Private key mã hoá vẫn dùng được nếu mày đoán ra passphrase — và passphrase cũng chỉ là mật khẩu.',
      'Xác nhận key có pass: `cat /home/hacker/id_rsa` (thấy "ENCRYPTED"). Trích hash: `ssh2john /home/hacker/id_rsa > ssh.hash`.',
      'Bẻ: `john --wordlist=rockyou.txt ssh.hash`. Có passphrase rồi là `ssh -i id_rsa` đăng nhập được.',
    ],
    debrief: [
      'Một private key bị lộ + passphrase yếu = toàn quyền truy cập SSH như chính nạn nhân.',
      'ssh2john hiểu cả định dạng cũ (PEM) lẫn OpenSSH mới; passphrase yếu phá tan lớp bảo vệ cuối cùng của key.',
      'Đây là lý do private key phải được bảo vệ như mật khẩu — và lý tưởng là dùng passphrase mạnh + ssh-agent.',
      'DEFENDER: passphrase dài ngẫu nhiên cho mọi private key; ưu tiên hardware key (FIDO2/PIV); luân chuyển + thu hồi key khi nghi lộ.',
    ],
    terms: [
      { term: 'ssh2john', def: 'Trích hash của passphrase bảo vệ một SSH private key để john/hashcat bẻ.' },
      { term: 'passphrase', def: 'Mật khẩu mã hoá private key trên đĩa; thiếu nó, key bị trộm vẫn vô dụng — nếu đủ mạnh.' },
      { term: 'private key', def: 'Nửa bí mật của cặp khoá; ai có nó (và passphrase) thì đăng nhập được mọi nơi tin tưởng khoá công khai tương ứng.' },
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/id_rsa': {
        type: 'file',
        content: [
          '-----BEGIN OPENSSH PRIVATE KEY-----',
          'Proc-Type: 4,ENCRYPTED',
          'b3BlbnNzaC1rZXktdjEAAAAACmFlczI1Ni1jdHIAAAAGYmNyeXB0AAAA...truncated...',
          '-----END OPENSSH PRIVATE KEY-----',
        ].join('\n'),
      },
    },
  },

  // ── 8 ──────────────────────────────────────────────────────────────────────
  {
    id: 8,
    chapterId: 14,
    title: 'Bắt sóng: bẻ WPA2 handshake',
    story:
      'Trong đợt đánh giá vật lý, mày capture được một WPA2 4-way handshake (.hc22000). Nếu mật khẩu Wi-Fi nằm trong wordlist, hashcat mode 22000 sẽ moi ra mà không cần ở gần AP nữa.',
    steps: [
      {
        id: 'cat_note',
        description: 'Đọc ghi chú về file handshake đã bắt',
        match: /^cat\b.*handshake/i,
      },
      {
        id: 'crack_wpa',
        description: 'Bẻ WPA2 (mode 22000) bằng wordlist',
        match: /^hashcat\s+-m\s*22000\b/i,
        output: [
          HC_HEAD,
          '',
          'a1b2c3d4e5f6...:f0:9f:c2:11:22:33:CorpGuestWiFi:SunshineCafe2023',
          '',
          'Session..........: hashcat',
          'Status...........: Cracked',
          'Hash.Mode........: 22000 (WPA-PBKDF2-PMKID+EAPOL)',
          'ESSID............: CorpGuestWiFi',
          'Recovered........: 1/1 (100.00%)',
        ].join('\n'),
      },
    ],
    hints: [
      'WPA2-PSK băm mật khẩu qua PBKDF2 với SSID làm salt — capture handshake một lần là crack offline thoải mái.',
      'Xem file capture: `cat /home/hacker/handshake.txt`.',
      'Bẻ mode 22000: `hashcat -m 22000 /home/hacker/handshake.hc22000 rockyou.txt`. Mật khẩu Wi-Fi hiện sau ESSID.',
    ],
    debrief: [
      'Sau khi bắt được 4-way handshake (hoặc PMKID), tấn công hoàn toàn offline — không cần ở gần mạng nữa.',
      'SSID đóng vai salt nên rainbow table chung vô dụng, nhưng mật khẩu Wi-Fi yếu/đoán được vẫn rơi trước wordlist.',
      'Mode 22000 thống nhất cả PMKID lẫn EAPOL — chuẩn hiện nay thay cho 2500 cũ.',
      'DEFENDER: passphrase Wi-Fi dài ngẫu nhiên (>=15 ký tự); ưu tiên WPA3/SAE chống offline cracking; tách mạng khách khỏi nội bộ.',
    ],
    terms: [
      { term: 'WPA2 handshake', def: 'Trao đổi 4-way khi thiết bị nối Wi-Fi; chứa đủ dữ liệu để brute-force mật khẩu offline.' },
      { term: 'PBKDF2', def: 'KDF lặp nhiều vòng dùng trong WPA2; SSID làm salt, làm chậm việc đoán mật khẩu.' },
      { term: 'mode 22000', def: 'Hash-mode hashcat hợp nhất cho WPA (PMKID + EAPOL), thay cho 2500/16800 cũ.' },
      { term: 'WPA3 / SAE', def: 'Chuẩn mới dùng Dragonfly handshake, chống tấn công offline dictionary của WPA2.' },
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/handshake.txt': {
        type: 'file',
        content: 'Captured: CorpGuestWiFi 4-way handshake -> handshake.hc22000\nESSID: CorpGuestWiFi  | dùng hashcat -m 22000 với rockyou.txt',
      },
      '/home/hacker/handshake.hc22000': { type: 'file', content: 'WPA*02*a1b2c3...*f09fc2112233*...truncated...' },
    },
  },

  // ── 9 ──────────────────────────────────────────────────────────────────────
  {
    id: 9,
    chapterId: 14,
    title: 'Bóc chuỗi encoding lồng nhau',
    story:
      'Không phải thứ gì trông "mã hoá" cũng là mã hoá. File này là một chuỗi base64 — chỉ ENCODING, không phải mã hoá, không có khoá. Giải ngược trực tiếp là ra ngay.',
    steps: [
      {
        id: 'cat_encoded',
        description: 'Xem chuỗi đã được encode',
        match: /^cat\b.*encoded\.txt/,
      },
      {
        id: 'b64_decode',
        description: 'Giải base64 để lộ nội dung thật',
        match: /^base64\s+-d\b/i,
        output: 'config_password=Tr0ub4dor&3',
      },
    ],
    hints: [
      'Encoding (base64/hex/rot13) KHÁC mã hoã: nó có thể đảo ngược mà không cần khoá. Đừng nhầm "trông rối" với "an toàn".',
      'Xem chuỗi: `cat /home/hacker/encoded.txt`. Dấu hiệu base64: chữ-số-+/-=, độ dài bội số 4.',
      'Giải thẳng: `base64 -d /home/hacker/encoded.txt`. Ra plaintext luôn vì không có khoá nào cả.',
    ],
    debrief: [
      'Lỗi nhận thức phổ biến: lập trình viên base64 một secret rồi tưởng đã "giấu" nó — thực ra ai cũng decode được.',
      'Phân biệt rạch ròi: encoding = biểu diễn (đảo ngược tự do), mã hoá = cần khoá, hashing = một chiều.',
      'Trong CTF và pentest, luôn thử decode các lớp (base64 → hex → rot13...) trước khi nghĩ tới crypto thật.',
      'DEFENDER: không bao giờ coi base64/obfuscation là bảo mật; secret phải được mã hoá thật và quản lý qua vault.',
    ],
    terms: [
      { term: 'encoding', def: 'Biểu diễn dữ liệu ở dạng khác (base64, hex, URL-encode); đảo ngược được mà KHÔNG cần khoá.' },
      { term: 'base64', def: 'Mã hoá nhị phân sang 64 ký tự in được; nhận diện qua A–Za–z0–9+/ và đệm "=".' },
      { term: 'encoding ≠ encryption', def: 'Encoding không bảo mật gì; chỉ mã hoá (có khoá) mới giữ bí mật dữ liệu.' },
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/encoded.txt': { type: 'file', content: 'Y29uZmlnX3Bhc3N3b3JkPVRyMHViNGRvciYz' },
    },
  },

  // ── 10 ─────────────────────────────────────────────────────────────────────
  {
    id: 10,
    chapterId: 14,
    title: 'Mật mã cổ điển: Caesar & Vigenère',
    story:
      'Một ghi chú nội bộ bị "mã hoá" bằng dịch chữ cái — mật mã Caesar. Không khoá hiện đại, chỉ là phép dịch vòng. Brute-force cả 25 phép dịch trong nháy mắt là đọc được.',
    steps: [
      {
        id: 'cat_cipher',
        description: 'Xem bản mã (ciphertext)',
        match: /^cat\b.*cipher\.txt/,
      },
      {
        id: 'solve',
        description: 'Brute-force toàn bộ phép dịch Caesar để tìm bản rõ',
        match: /^python3?\b.*(caesar|rot|solve)/i,
        output: [
          'ROT-1 : sgd rdbqds hr...',
          'ROT-3 : the secret is...',
          '...',
          'ROT-13: gur frperg vf...',
          '[+] Best candidate (ROT-3): THE SECRET IS COGNAC1789',
        ].join('\n'),
      },
    ],
    hints: [
      'Caesar chỉ có 25 khoá khả dĩ — không gian khoá bé tí, brute-force toàn bộ rồi nhìn cái nào ra tiếng người.',
      'Xem bản mã: `cat /home/hacker/cipher.txt`.',
      'Chạy script thử mọi phép dịch: `python3 /home/hacker/caesar_solve.py`. Bản rõ là dòng đọc xuôi tiếng.',
    ],
    debrief: [
      'Mật mã cổ điển (Caesar/Vigenère/substitution) thua vì không gian khoá nhỏ hoặc lộ qua phân tích tần suất.',
      'Caesar = Vigenère với khoá 1 ký tự; Vigenère dài hơn nhưng vẫn vỡ qua phân tích chu kỳ khoá (Kasiski).',
      'Trong CTF, "chữ cái xáo trộn" thường là dấu hiệu của classical cipher — thử rot/quipqiup trước.',
      'DEFENDER: không bao giờ dùng cipher cổ điển cho dữ liệu thật; dùng AES-GCM/ChaCha20 với khoá quản lý đúng cách.',
    ],
    terms: [
      { term: 'Caesar cipher', def: 'Dịch mỗi chữ cái đi k vị trí trong bảng chữ; chỉ 25 khoá nên brute-force tức thì.' },
      { term: 'Vigenère', def: 'Caesar với khoá nhiều ký tự lặp lại; vỡ qua phân tích độ dài khoá + tần suất.' },
      { term: 'phân tích tần suất', def: 'Kỹ thuật bẻ mật mã thay thế bằng cách so tần suất ký tự bản mã với ngôn ngữ gốc.' },
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/cipher.txt': { type: 'file', content: 'WKH VHFUHW LV FRJQDF1789' },
      '/home/hacker/caesar_solve.py': { type: 'file', content: '# brute-force all 25 Caesar shifts and print readable candidate' },
    },
  },

  // ── 11 ─────────────────────────────────────────────────────────────────────
  {
    id: 11,
    chapterId: 14,
    title: 'RSA modulus bé — factor là vỡ',
    story:
      'Mày tóm được public key RSA của một dịch vụ tự chế. Sai lầm chí mạng: modulus n quá nhỏ. Bảo mật RSA dựa trên việc KHÔNG factor được n; n bé thì factordb hoặc công cụ tự factor ra p, q — và mày dựng lại private key.',
    steps: [
      {
        id: 'cat_pub',
        description: 'Đọc public key (n, e) cần tấn công',
        match: /^cat\b.*pubkey\.txt/,
      },
      {
        id: 'factor',
        description: 'Factor modulus n thành p, q rồi dựng private key giải mã',
        match: /^python3?\b.*(rsa|factor)/i,
        output: [
          '[*] n = 0xc8...  (256-bit — quá nhỏ!)',
          '[+] factordb hit: n = p * q',
          '    p = 178426363... ',
          '    q = 195771224...',
          '[+] phi = (p-1)(q-1); d = e^-1 mod phi',
          '[+] Decrypted: FLAG{sm4ll_rsa_m0dulus_factored}',
        ].join('\n'),
      },
    ],
    hints: [
      'An toàn RSA = không factor nổi n. Nếu n nhỏ (vài trăm bit) thì factor được, mà factor xong là có private key.',
      'Đọc tham số: `cat /home/hacker/pubkey.txt` (lấy n, e).',
      'Chạy tấn công: `python3 /home/hacker/rsa_attack.py` — nó factor n qua factordb, tính d, rồi giải mã.',
    ],
    debrief: [
      'RSA an toàn nhờ bài toán phân tích thừa số khó — nhưng chỉ khi n đủ lớn (>=2048-bit). n nhỏ làm sụp toàn bộ.',
      'Có p, q là tính được phi(n) rồi d = e⁻¹ mod phi — dựng lại private key hoàn chỉnh.',
      'Nhiều lỗ hổng RSA khác: e nhỏ (Håstad), khoá dùng chung modulus, Wiener (d nhỏ)... tự chế crypto là tự sát.',
      'DEFENDER: dùng thư viện chuẩn (>=2048-bit, padding OAEP); không bao giờ tự viết RSA; ưu tiên ECC/đường cong hiện đại.',
    ],
    terms: [
      { term: 'RSA modulus (n)', def: 'Tích n = p·q của hai số nguyên tố lớn; bảo mật RSA dựa vào việc không factor được n.' },
      { term: 'factoring', def: 'Phân tích n về p, q; làm được thì tính ra private key d và phá toàn bộ.' },
      { term: 'factordb', def: 'Cơ sở dữ liệu công khai các phân tích thừa số đã biết; tra nhanh n nhỏ/phổ biến.' },
      { term: 'private exponent (d)', def: 'Khoá riêng RSA: d = e⁻¹ mod phi(n); có p,q là tính được ngay.' },
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/pubkey.txt': {
        type: 'file',
        content: 'n = 0xc8a1...(256-bit)\ne = 65537\nciphertext = 0x4f2b...',
      },
      '/home/hacker/rsa_attack.py': { type: 'file', content: '# query factordb for n, compute d, decrypt ciphertext' },
    },
  },

  // ── 12 ─────────────────────────────────────────────────────────────────────
  {
    id: 12,
    chapterId: 14,
    title: 'JWT ký bằng secret yếu',
    story:
      'API dùng JWT ký HS256. Nếu secret ký là một chuỗi yếu, mày bẻ được nó offline — rồi tự ký token với role admin. Chữ ký mạnh thế nào cũng vô nghĩa nếu khoá đoán được.',
    steps: [
      {
        id: 'cat_jwt',
        description: 'Xem token JWT thu được',
        match: /^cat\b.*(\.jwt|token)/,
      },
      {
        id: 'crack_jwt',
        description: 'Bẻ secret ký HS256 (mode 16500) bằng wordlist',
        match: /^hashcat\s+-m\s*16500\b/i,
        output: [
          HC_HEAD,
          '',
          'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiYm9iIn0.abc123signature:s3cr3t',
          '',
          'Status...........: Cracked',
          'Hash.Mode........: 16500 (JWT, JSON Web Token)',
          'Recovered........: 1/1 (100.00%)  -> secret = "s3cr3t"',
        ].join('\n'),
      },
    ],
    hints: [
      'JWT HS256 ký bằng một secret đối xứng. Bẻ được secret = ký token tùy ý, kể cả role admin.',
      'Xem token: `cat /home/hacker/token.jwt`. Ba phần ngăn bởi dấu chấm: header.payload.signature.',
      'Bẻ secret: `hashcat -m 16500 /home/hacker/token.jwt rockyou.txt`. Có secret rồi thì tự forge token mới.',
    ],
    debrief: [
      'JWT chỉ an toàn khi secret ký mạnh và bí mật — secret yếu biến cả hệ xác thực thành trò đùa.',
      'Sau khi có secret, attacker đổi payload (vd "role":"admin") và ký lại — server tin vì chữ ký hợp lệ.',
      'Lỗ hổng JWT kinh điển khác: alg=none, nhầm HS256/RS256 (ký bằng public key), không kiểm exp.',
      'DEFENDER: secret >=256-bit ngẫu nhiên (hoặc RS256 với khoá bất đối xứng); ép kiểm alg; xoay vòng secret; đặt exp ngắn.',
    ],
    terms: [
      { term: 'JWT', def: 'JSON Web Token: header.payload.signature mã base64url, dùng cho xác thực không trạng thái.' },
      { term: 'HS256', def: 'Thuật toán ký JWT bằng HMAC-SHA256 với một secret đối xứng chia sẻ.' },
      { term: 'forge token', def: 'Sau khi có secret, tự tạo và ký JWT với payload tùy ý (vd nâng quyền admin).' },
      { term: 'alg=none', def: 'Lỗ hổng JWT khi server chấp nhận token không chữ ký nếu header khai alg "none".' },
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/token.jwt': {
        type: 'file',
        content: 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiYm9iIiwicm9sZSI6InVzZXIifQ.abc123signatureTruncated',
      },
    },
  },

  // ── 13 ─────────────────────────────────────────────────────────────────────
  {
    id: 13,
    chapterId: 14,
    title: 'NTLM từ NTDS.dit',
    story:
      'Từ chiến dịch Active Directory trước, mày dump được hash NTLM của user. NTLM không salt và nhanh như MD5 — wordlist hoặc rainbow table đều ăn. Crack ra cleartext để tái dùng (password spraying).',
    steps: [
      {
        id: 'cat_ntlm',
        description: 'Xem hash NTLM dump từ AD',
        match: /^cat\b.*ntlm\.txt/,
      },
      {
        id: 'crack_ntlm',
        description: 'Bẻ NTLM (mode 1000) bằng wordlist',
        match: /^hashcat\s+-m\s*1000\b/i,
        output: [
          HC_HEAD,
          '',
          '8846f7eaee8fb117ad06bdd830b7586c:password',
          '',
          'Status...........: Cracked',
          'Hash.Mode........: 1000 (NTLM)',
          'Recovered........: 1/1 (100.00%)',
        ].join('\n'),
      },
    ],
    hints: [
      'NTLM (hash Windows) không có salt và rất nhanh — y hệt điểm yếu của MD5.',
      'Xem hash: `cat /home/hacker/ntlm.txt` (định dạng user:rid:lm:nt:::).',
      'Bẻ mode 1000: `hashcat -m 1000 /home/hacker/ntlm.txt rockyou.txt`. Có cleartext thì khỏi cần Pass-the-Hash.',
    ],
    debrief: [
      'NTLM không salt nên hai user cùng mật khẩu có cùng hash — và rainbow table NTLM khổng lồ có sẵn.',
      'Crack ra cleartext mạnh hơn cả Pass-the-Hash: mật khẩu thật thường tái dùng ở nhiều hệ thống/khác domain.',
      'Đây là mắt xích nối Chương 9 (AD): dump NTDS.dit → crack NTLM → password spraying toàn miền.',
      'DEFENDER: ép mật khẩu dài/ngẫu nhiên, bật chính sách chống tái dùng; giám sát truy cập NTDS.dit; chuyển sang Kerberos/AES, vô hiệu NTLM nếu được.',
    ],
    terms: [
      { term: 'NTLM hash', def: 'Hash mật khẩu của Windows (MD4 của UTF-16 mật khẩu); không salt, nhanh, dễ crack.' },
      { term: 'NTDS.dit', def: 'Cơ sở dữ liệu Active Directory trên Domain Controller chứa toàn bộ hash NTLM của domain.' },
      { term: 'password spraying', def: 'Thử một mật khẩu (vừa crack) trên nhiều tài khoản để né khoá tài khoản.' },
      { term: 'Pass-the-Hash', def: 'Xác thực bằng chính hash NTLM mà không cần biết cleartext; nhưng crack ra cleartext còn lợi hơn.' },
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/ntlm.txt': {
        type: 'file',
        content: 'corp\\jdoe:1104:aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c:::',
      },
    },
  },

  // ── 14 ─────────────────────────────────────────────────────────────────────
  {
    id: 14,
    chapterId: 14,
    title: 'Vì sao phải có salt',
    story:
      'Một database lưu mật khẩu MD5 KHÔNG salt. Nhìn dump là thấy ngay tử huyệt: nhiều user có hash GIỐNG HỆT nhau — tức cùng mật khẩu. Crack một cái là lộ cả đám, và rainbow table tra tức thì.',
    steps: [
      {
        id: 'cat_dump',
        description: 'Xem dump hash, để ý các hash trùng nhau',
        match: /^cat\b.*unsalted\.txt/,
      },
      {
        id: 'crack_batch',
        description: 'Crack cả lô MD5 cùng lúc bằng wordlist',
        match: /^hashcat\s+-m\s*0\b/i,
        output: [
          HC_HEAD,
          '',
          '25f9e794323b453885f5181f1b624d0b:123456789',
          '5f4dcc3b5aa765d61d8327deb882cf99:password',
          '',
          'Status...........: Cracked',
          'Recovered........: 4/5 (80.00%) Digests  <- 3 user dùng chung "password"',
          'Note: hash trùng = mật khẩu trùng (vì KHÔNG salt)',
        ].join('\n'),
      },
    ],
    hints: [
      'Không salt = cùng mật khẩu cho ra cùng hash. Nhìn dump thấy hash lặp lại là biết user dùng chung mật khẩu.',
      'Xem dump: `cat /home/hacker/unsalted.txt` — đếm xem bao nhiêu dòng hash giống nhau.',
      'Crack cả lô một lần: `hashcat -m 0 /home/hacker/unsalted.txt rockyou.txt`. Một lần crack lộ mọi user trùng pass.',
    ],
    debrief: [
      'Salt giải đúng hai vấn đề: (1) hash trùng biến mất dù mật khẩu trùng, (2) rainbow table dựng sẵn trở nên vô dụng.',
      'Rainbow table là bảng tra hash→plaintext khổng lồ; chỉ ăn với hash KHÔNG salt. Thêm salt ngẫu nhiên mỗi user là vô hiệu hoá nó.',
      'Không salt còn rò rỉ thông tin: thấy hai hash bằng nhau là biết hai người cùng mật khẩu — leak quan hệ.',
      'DEFENDER: luôn salt ngẫu nhiên duy nhất mỗi mật khẩu (bcrypt/argon2 tự làm việc này); thêm pepper bí mật ở tầng ứng dụng nếu cần.',
    ],
    terms: [
      { term: 'salt', def: 'Chuỗi ngẫu nhiên duy nhất mỗi user, thêm trước khi băm; làm hash trùng biến mất và chặn rainbow table.' },
      { term: 'rainbow table', def: 'Bảng tra trước hash→plaintext cho hàm KHÔNG salt; tra cực nhanh nhưng vô dụng khi có salt.' },
      { term: 'pepper', def: 'Bí mật cố định ở tầng ứng dụng (không lưu cùng hash) cộng thêm vào mật khẩu, tăng phòng thủ.' },
      { term: 'hash trùng', def: 'Khi không salt, hai mật khẩu giống nhau cho hash giống nhau — lộ quan hệ và bị crack hàng loạt.' },
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/unsalted.txt': {
        type: 'file',
        content: [
          'alice:5f4dcc3b5aa765d61d8327deb882cf99',
          'bob:5f4dcc3b5aa765d61d8327deb882cf99',
          'carol:25f9e794323b453885f5181f1b624d0b',
          'dave:5f4dcc3b5aa765d61d8327deb882cf99',
          'erin:e10adc3949ba59abbe56e057f20f883e',
        ].join('\n'),
      },
    },
  },

  // ── 15 ─────────────────────────────────────────────────────────────────────
  {
    id: 15,
    chapterId: 14,
    title: 'Capture the Flag — chuỗi giải mã',
    story:
      'Bài tổng kết. Trong loot có một két: file ghi chú chỉ đường, một hash master khoá vault, và flag bị khoá. Ghép mọi kỹ năng: đọc manh mối → bẻ hash master → mở vault → đọc flag.',
    steps: [
      {
        id: 'read_vault',
        description: 'Đọc ghi chú vault để biết phải bẻ gì',
        match: /^cat\b.*vault.*\.txt/,
      },
      {
        id: 'crack_master',
        description: 'Bẻ hash master mở khoá vault',
        match: /^(hashcat|john)\b/i,
        output: [
          HC_HEAD,
          '',
          'd0763edaa9d9bd2a9516280e9044d885:MasterKey2024!',
          '',
          'Status...........: Cracked   -> master password = MasterKey2024!',
          '[*] vault unlocked -> /home/hacker/loot/flag.txt readable',
        ].join('\n'),
      },
      {
        id: 'read_flag',
        description: 'Đọc flag sau khi mở được vault',
        match: /^cat\b.*flag\.txt/,
      },
    ],
    hints: [
      'Bài chuỗi: đừng nhảy thẳng tới flag, đi theo manh mối trong ghi chú vault.',
      'Đọc đường đi: `cat /home/hacker/loot/vault_note.txt`. Nó chỉ hash master cần bẻ.',
      'Bẻ master rồi đọc cờ: `hashcat -m 0 /home/hacker/loot/master.hash rockyou.txt` rồi `cat /home/hacker/loot/flag.txt`.',
    ],
    debrief: [
      'Crack thực chiến là CHUỖI: nhận diện → chọn mode → bẻ → dùng kết quả mở lớp tiếp theo.',
      'Mỗi mắt xích yếu (hash nhanh, mật khẩu đoán được, secret tái dùng) là một bậc thang cho attacker.',
      'Phòng thủ cũng theo chuỗi: chặn được một bậc (KDF chậm, mật khẩu mạnh, salt, MFA) là gãy cả đường tấn công.',
      'DEFENDER: phòng thủ theo lớp — thuật toán đúng + mật khẩu mạnh + salt + MFA + giám sát; đừng để một điểm yếu kéo sập tất cả.',
    ],
    terms: [
      { term: 'capture the flag', def: 'Bài tập bảo mật yêu cầu ghép nhiều kỹ thuật để lấy được chuỗi bí mật (flag).' },
      { term: 'chuỗi tấn công', def: 'Nhiều bước nối tiếp; kết quả bước trước mở khoá bước sau.' },
      { term: 'phòng thủ theo lớp', def: 'Đặt nhiều rào chắn độc lập để một lớp thủng vẫn còn lớp khác chặn.' },
      { term: 'master key', def: 'Khoá/mật khẩu mở khoá nhiều bí mật khác; bẻ được nó là sụp cả két.' },
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/loot': { type: 'dir' },
      '/home/hacker/loot/vault_note.txt': {
        type: 'file',
        content: [
          'VAULT — đọc kỹ:',
          'Flag nằm ở loot/flag.txt nhưng vault đang khoá.',
          'Khoá vault = mật khẩu master, hash MD5 ở loot/master.hash.',
          'Bẻ nó (hashcat -m 0 với rockyou) rồi mở flag.',
        ].join('\n'),
      },
      '/home/hacker/loot/master.hash': { type: 'file', content: 'd0763edaa9d9bd2a9516280e9044d885' },
      '/home/hacker/loot/flag.txt': { type: 'file', content: 'FLAG{cr4ck_th3_ch41n_h45h_to_pl41nt3xt_pwn3d}' },
    },
  },
];
