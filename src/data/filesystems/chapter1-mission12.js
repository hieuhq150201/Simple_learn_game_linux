// Ch1 M12 — đổi tên & gom file hàng loạt (mv, cp -r, rm). Thư mục work lộn xộn cần dọn.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/work': { type: 'dir' },
  '/home/hacker/work/draft.txt': { type: 'file', content: 'báo cáo nháp' },
  '/home/hacker/work/access-2024.log': { type: 'file', content: 'log cũ 2024' },
  '/home/hacker/work/access-2025.log': { type: 'file', content: 'log cũ 2025' },
  '/home/hacker/work/error.log': { type: 'file', content: 'log lỗi' },
};
