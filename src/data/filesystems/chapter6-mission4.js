// Chương 6 — Mission 4: SQLi rút dữ liệu bằng UNION.
// curl là tool -> output canned (column count error, dump). FS giữ source product.php để cat thấy lỗi.
export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/product.php': {
    type: 'file',
    content: [
      '<?php',
      '// VULN: id nối thẳng vào query, SELECT 4 cột -> UNION-based SQLi',
      '$id = $_GET["id"];',
      '$q  = "SELECT id, name, price, description FROM products WHERE id = $id";',
      '$r  = mysqli_query($conn, $q);',
      'while ($row = mysqli_fetch_assoc($r)) { echo $row["name"]." - ".$row["description"]; }',
      '?>',
    ].join('\n'),
  },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': { type: 'file', content: 'Endpoint: http://target/product.php?id=1 — nghi UNION SQLi. Đếm số cột rồi rút bảng users.' },
};
