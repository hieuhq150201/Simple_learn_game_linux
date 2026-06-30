// Data 8 chương — Phase 1 chỉ chương 1 có mission chơi được, còn lại để hiện trên ChapterMap (locked)
export const chapters = [
  {
    id: 1,
    title: 'Terminal Sinh Tồn',
    badge: '🔰',
    story:
      'Mày vừa được tuyển vào một startup bảo mật. Ngày đầu tiên, sếp quăng cho mày một cái SSH session vào server production đang có vấn đề. Không có GUI. Chỉ có terminal.',
    skills: [
      'pwd, ls, ls -la, cd, cd .., cd ~',
      'cat, less, more, head, tail, tail -f',
      'grep, grep -r, find, locate',
      'cp, mv, rm, mkdir, touch, chmod',
      '|, >, >>, <, 2>&1',
      '*, ?, [abc]',
    ],
    missionCount: 16,
  },
  {
    id: 2,
    title: 'Process & System Control',
    badge: '🐧',
    story:
      'Server bỗng nhiên chậm như rùa. CPU 100%. Mày phải điều tra xem thứ gì đang ăn tài nguyên — và kill nó trước khi sếp phát hiện.',
    skills: ['top, htop, ps aux', 'kill, killall, pkill', 'systemctl', 'df -h, du -sh, free -h', 'cron'],
    missionCount: 16,
  },
  {
    id: 3,
    title: 'Networking Từ Gốc',
    badge: '🌐',
    story: 'Deploy xong app nhưng không ai vào được. Mày phải debug network từng bước một để tìm ra điểm nghẽn.',
    skills: ['ping, traceroute', 'dig, nslookup', 'curl, wget', 'netstat, ss', 'iptables, ufw'],
    missionCount: 18,
  },
  {
    id: 4,
    title: 'SSH & Remote Access Thực Chiến',
    badge: '🔑',
    story: 'Công ty mở rộng, có 20 server mới. Mày phải setup SSH key-based auth cho tất cả, không được dùng password.',
    skills: ['ssh-keygen, ssh-copy-id', '~/.ssh/config', 'port forwarding', 'scp, rsync'],
    missionCount: 15,
  },
  {
    id: 5,
    title: 'Recon & Enumeration',
    badge: '🔍',
    story: 'Khách hàng thuê công ty mày pentest hệ thống của họ. Mày có địa chỉ IP và domain. Thu thập tối đa thông tin trước khi tấn công.',
    skills: ['whois, dig', 'nmap', 'gobuster, ffuf, nikto', 'subfinder, amass'],
    missionCount: 18,
  },
  {
    id: 6,
    title: 'Web Vulnerabilities Thực Tế',
    badge: '🕷️',
    story: 'Trong quá trình recon, mày phát hiện web app của target có dấu hiệu vulnerable. Giờ là lúc kiểm chứng.',
    skills: ['SQL Injection', 'XSS', 'IDOR', 'LFI/RFI', 'Burp Suite'],
    missionCount: 20,
  },
  {
    id: 7,
    title: 'Privilege Escalation',
    badge: '⚡',
    story: 'Mày đã vào được server với user thường. Nhưng file quan trọng nhất nằm trong /root. Mày phải leo lên root.',
    skills: ['SUID/SGID', 'sudo misconfiguration', 'cron exploit', 'GTFOBins'],
    missionCount: 18,
  },
  {
    id: 8,
    title: 'CTF Thực Chiến',
    badge: '💀',
    story: 'Mày đã học đủ. Giờ là bài test cuối. Một hệ thống giả lập hoàn chỉnh — mày phải hack từ đầu đến cuối.',
    skills: ['Recon → Foothold → Privesc → Capture the Flag'],
    missionCount: 12,
  },
  {
    id: 9,
    title: 'Lateral Movement & Active Directory',
    badge: '🏰',
    story:
      'Mày đã chiếm được một tài khoản domain quèn trong mạng doanh nghiệp. Nhưng phần thưởng thật là cả Active Directory. Học cách di chuyển ngang, đánh cắp danh tính, và leo lên Domain Admin.',
    skills: ['Kerberoasting', 'Pass-the-Hash', 'DCSync / Golden Ticket', 'BloodHound, impacket, mimikatz'],
    missionCount: 14,
  },
  {
    id: 10,
    title: 'Elite CTF Black-Box',
    badge: '☠️',
    story:
      'Không story, không hint, không nương tay. Ba hệ thống đỉnh cao — container escape, binary exploitation, và một cuộc red-team hoàn chỉnh từ OSINT tới Domain Admin. Tự lực hoàn toàn.',
    skills: ['Container escape', 'Binary exploitation (ret2win)', 'Full red-team chain', 'Không hint — elite only'],
    missionCount: 10,
  },
  {
    id: 11,
    title: 'Cloud Security — AWS & GCP',
    badge: '☁️',
    story:
      'Công ty target đã bê toàn bộ hạ tầng lên AWS và GCP. Không còn server vật lý để chọc — nhưng cloud có cả rừng cấu hình sai: bucket công khai, access key lộ trong code, metadata endpoint hớ hênh. Mày sẽ đi từ một cái tên miền tới quyền kiểm soát cả tài khoản đám mây.',
    skills: [
      'aws s3 — bucket công khai',
      'IAM enum & privilege escalation',
      'EC2 metadata SSRF (169.254.169.254)',
      'Secrets Manager / SSM Parameter Store',
      'gcloud / GCP service account',
    ],
    missionCount: 15,
  },
  {
    id: 12,
    title: 'Container & Kubernetes Security',
    badge: '🐳',
    story:
      'Mày vừa RCE được vào một web app — nhưng nhận ra mình đang kẹt trong một container. Tường ngăn mỏng manh: một cái docker socket hớ, một capability thừa, một token service account là đủ để thoát ra host và chiếm cả cluster Kubernetes.',
    skills: [
      'Phát hiện & breakout container',
      'Docker socket / privileged escape',
      'K8s service account token',
      'kubectl enum & secrets',
      'Pod privileged → node',
    ],
    missionCount: 15,
  },
  {
    id: 13,
    title: 'Digital Forensics & Blue Team',
    badge: '🔬',
    story:
      'Lần này mày đứng ở phía bên kia. SIEM vừa hú: một server production bị xâm nhập. Sếp cần biết kẻ tấn công vào bằng đường nào, làm gì, cắm persistence ở đâu, và lấy đi cái gì. Mày là người dựng lại toàn bộ hiện trường từ log, memory và pcap.',
    skills: [
      'Phân tích auth/web log',
      'bash_history & web shell',
      'Persistence (cron, authorized_keys)',
      'pcap & memory forensics (volatility)',
      'Dựng timeline + IOC',
    ],
    missionCount: 15,
  },
  {
    id: 14,
    title: 'Cryptography & Hash Cracking',
    badge: '🔐',
    story:
      'Mày vớ được một đống hash, file mã hoá, và token ký yếu trong các chiến dịch trước. Giờ là lúc bẻ chúng: từ MD5 ngây thơ tới bcrypt, từ JWT secret yếu tới RSA modulus nhỏ. Mật mã sai cách là cánh cửa, và mày có chìa.',
    skills: [
      'hashcat / john the ripper',
      'shadow / NTLM / bcrypt',
      'zip2john / ssh2john',
      'JWT secret cracking',
      'Encoding chains & RSA yếu',
    ],
    missionCount: 15,
  },
];

export const PLAYABLE_CHAPTER_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
