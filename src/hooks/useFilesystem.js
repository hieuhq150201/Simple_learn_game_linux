import { useCallback, useState } from 'react';

// Quản lý fake filesystem state cho 1 mission. localShell trả về fsUpdate khi lệnh
// thay đổi filesystem (touch/mkdir/rm/redirect): map path -> node object | null (null = xoá).
export function useFilesystem(initialFilesystem) {
  const [filesystem, setFilesystem] = useState(initialFilesystem);

  const applyUpdate = useCallback((filesystemUpdate) => {
    if (!filesystemUpdate || Object.keys(filesystemUpdate).length === 0) return;
    setFilesystem((prev) => {
      const next = { ...prev };
      for (const [path, node] of Object.entries(filesystemUpdate)) {
        if (node === null) delete next[path];
        else next[path] = node;
      }
      return next;
    });
  }, []);

  const resetFilesystem = useCallback(() => setFilesystem(initialFilesystem), [initialFilesystem]);

  return { filesystem, applyUpdate, resetFilesystem };
}
