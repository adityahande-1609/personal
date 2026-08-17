import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(process.env.LOCAL_STORAGE_DIR || './private-storage');

export async function savePrivateFile(input: { buffer: Buffer; extension: string; userId: string; agreementId: string }) {
  const extension = input.extension.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
  const key = `agreements/${input.agreementId}/${input.userId}/${crypto.randomUUID()}.${extension || 'bin'}`;
  const destination = path.join(root, key);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, input.buffer, { flag: 'wx' });
  return key;
}

export async function deletePrivateFile(key: string) {
  const normalized = path.normalize(key);
  if (normalized.startsWith('..') || path.isAbsolute(normalized)) throw new Error('Invalid storage key');
  await fs.rm(path.join(root, normalized), { force: true });
}

export function privateFilePath(key: string) {
  const normalized = path.normalize(key);
  if (normalized.startsWith('..') || path.isAbsolute(normalized)) throw new Error('Invalid storage key');
  return path.join(root, normalized);
}
