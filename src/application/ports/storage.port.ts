export interface StoragePort {
  saveBinary(path: string, data: Buffer): Promise<string>;
}
