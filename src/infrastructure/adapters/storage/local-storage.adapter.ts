import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { StoragePort } from '../../../application/ports/storage.port';

export class LocalStorageAdapter implements StoragePort {
  constructor(private readonly baseDir: string) {}

  async saveBinary(pathKey: string, data: Buffer): Promise<string> {
    const fullPath = join(this.baseDir, pathKey);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, data);

    return fullPath;
  }
}
