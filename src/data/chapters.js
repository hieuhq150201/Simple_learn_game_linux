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
    missionCount: 3,
  },
  {
    id: 2,
    title: 'Process & System Control',
    badge: '🐧',
    story:
      'Server bỗng nhiên chậm như rùa. CPU 100%. Mày phải điều tra xem thứ gì đang ăn tài nguyên — và kill nó trước khi sếp phát hiện.',
    skills: ['top, htop, ps aux', 'kill, killall, pkill', 'systemctl', 'df -h, du -sh, free -h', 'cron'],
    missionCount: 3,
  },
  {
    id: 3,
    title: 'Networking Từ Gốc',
    badge: '🌐',
    story: 'Deploy xong app nhưng không ai vào được. Mày phải debug network từng bước một để tìm ra điểm nghẽn.',
    skills: ['ping, traceroute', 'dig, nslookup', 'curl, wget', 'netstat, ss', 'iptables, ufw'],
    missionCount: 3,
  },
  {
    id: 4,
    title: 'SSH & Remote Access Thực Chiến',
    badge: '🔑',
    story: 'Công ty mở rộng, có 20 server mới. Mày phải setup SSH key-based auth cho tất cả, không được dùng password.',
    skills: ['ssh-keygen, ssh-copy-id', '~/.ssh/config', 'port forwarding', 'scp, rsync'],
    missionCount: 3,
  },
  {
    id: 5,
    title: 'Recon & Enumeration',
    badge: '🔍',
    story: 'Khách hàng thuê công ty mày pentest hệ thống của họ. Mày có địa chỉ IP và domain. Thu thập tối đa thông tin trước khi tấn công.',
    skills: ['whois, dig', 'nmap', 'gobuster, ffuf, nikto', 'subfinder, amass'],
    missionCount: 3,
  },
  {
    id: 6,
    title: 'Web Vulnerabilities Thực Tế',
    badge: '🕷️',
    story: 'Trong quá trình recon, mày phát hiện web app của target có dấu hiệu vulnerable. Giờ là lúc kiểm chứng.',
    skills: ['SQL Injection', 'XSS', 'IDOR', 'LFI/RFI', 'Burp Suite'],
    missionCount: 3,
  },
  {
    id: 7,
    title: 'Privilege Escalation',
    badge: '⚡',
    story: 'Mày đã vào được server với user thường. Nhưng file quan trọng nhất nằm trong /root. Mày phải leo lên root.',
    skills: ['SUID/SGID', 'sudo misconfiguration', 'cron exploit', 'GTFOBins'],
    missionCount: 3,
  },
  {
    id: 8,
    title: 'CTF Thực Chiến',
    badge: '💀',
    story: 'Mày đã học đủ. Giờ là bài test cuối. Một hệ thống giả lập hoàn chỉnh — mày phải hack từ đầu đến cuối.',
    skills: ['Recon → Foothold → Privesc → Capture the Flag'],
    missionCount: 3,
  },
  {
    id: 9,
    title: 'Lateral Movement & Active Directory',
    badge: '🏰',
    story:
      'Mày đã chiếm được một tài khoản domain quèn trong mạng doanh nghiệp. Nhưng phần thưởng thật là cả Active Directory. Học cách di chuyển ngang, đánh cắp danh tính, và leo lên Domain Admin.',
    skills: ['Kerberoasting', 'Pass-the-Hash', 'DCSync / Golden Ticket', 'BloodHound, impacket, mimikatz'],
    missionCount: 3,
  },
  {
    id: 10,
    title: 'Elite CTF Black-Box',
    badge: '☠️',
    story:
      'Không story, không hint, không nương tay. Ba hệ thống đỉnh cao — container escape, binary exploitation, và một cuộc red-team hoàn chỉnh từ OSINT tới Domain Admin. Tự lực hoàn toàn.',
    skills: ['Container escape', 'Binary exploitation (ret2win)', 'Full red-team chain', 'Không hint — elite only'],
    missionCount: 3,
  },
];

export const PLAYABLE_CHAPTER_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
