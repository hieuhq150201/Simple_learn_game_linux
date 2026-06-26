// Chương 6 — Mission 5: SQLi mù (boolean/time-based) + sqlmap.
// curl/sqlmap là tool -> output canned. FS giữ source search.php (không echo dữ liệu -> blind).
export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/search.php': {
    type: 'file',
    content: [
      '<?php',
      '// VULN: blind SQLi — query chạy nhưng KHÔNG in dữ liệu ra, chỉ đổi trang theo true/false',
      '$id = $_GET["id"];',
      '$q  = "SELECT * FROM products WHERE id = $id";',
      '$r  = mysqli_query($conn, $q);',
      'if (mysqli_num_rows($r) > 0) { echo "Sản phẩm tồn tại"; } else { echo "Không tìm thấy"; }',
      '?>',
    ].join('\n'),
  },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': { type: 'file', content: 'http://target/search.php?id=1 — không in dữ liệu (blind). Dùng boolean/time-based rồi để sqlmap tự động.' },
};
