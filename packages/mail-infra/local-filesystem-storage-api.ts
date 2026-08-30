import { createHash, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { FileSystemStorageApi } from '../mail-domain/filesystem-storage-provider';
import type { StorageObject } from '../mail-types/storage-provider';

interface Meta { namespaceId: string; key: string; contentType?: string; etag: string; versionId: string; encrypted: boolean; sizeBytes: number; }

export interface LocalFilesystemStorageOptions { readonly root: string; readonly maxObjectBytes: number; readonly encryptedAtRest: boolean; }

export class LocalFilesystemStorageApi implements FileSystemStorageApi {
  constructor(private readonly options: LocalFilesystemStorageOptions) {
    if (!path.isAbsolute(options.root)) throw new Error('absolute_root_required');
    if (!options.root.trim()) throw new Error('root_required');
    if (!Number.isSafeInteger(options.maxObjectBytes) || options.maxObjectBytes <= 0) throw new Error('invalid_max_object_bytes');
    if (!options.encryptedAtRest) throw new Error('encryption_required');
  }

  async put(input: { root: string; key: string; body: Uint8Array; contentType?: string; expectedVersionId?: string | null }): Promise<StorageObject> {
    this.assertRoot(input.root); this.assertSize(input.body.byteLength);
    const target = this.safePath(input.root, input.key); const metaPath = `${target}.meta.json`;
    let current: Meta | null = null;
    try { current = JSON.parse(await fs.readFile(metaPath, 'utf8')) as Meta; } catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e; }
    if (input.expectedVersionId !== undefined && input.expectedVersionId !== (current?.versionId ?? null)) throw new Error('version_conflict');
    const versionId = `${randomUUID()}-${createHash('sha256').update(input.body).digest('hex').slice(0, 16)}`;
    const etag = createHash('sha256').update(input.body).digest('hex');
    await fs.mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    const tmp = `${target}.tmp-${randomUUID()}`;
    await fs.writeFile(tmp, input.body, { mode: 0o600, flag: 'wx' });
    await fs.rename(tmp, target);
    const meta: Meta = { namespaceId: '', key: input.key, contentType: input.contentType, etag, versionId, encrypted: true, sizeBytes: input.body.byteLength };
    await fs.writeFile(metaPath, JSON.stringify(meta), { mode: 0o600, flag: 'w' });
    return meta;
  }

  async get(input: { root: string; key: string; versionId?: string }): Promise<StorageObject & { readonly body: Uint8Array }> {
    const object = await this.head(input); const target = this.safePath(input.root, input.key); const body = new Uint8Array(await fs.readFile(target));
    return { ...object, body };
  }

  async head(input: { root: string; key: string; versionId?: string }): Promise<StorageObject> {
    this.assertRoot(input.root); const target = this.safePath(input.root, input.key); const meta = JSON.parse(await fs.readFile(`${target}.meta.json`, 'utf8')) as Meta;
    if (input.versionId && input.versionId !== meta.versionId) throw new Error('object_not_found');
    return meta;
  }

  async list(input: { root: string; prefix: string; limit: number }): Promise<readonly StorageObject[]> {
    this.assertRoot(input.root); if (!Number.isSafeInteger(input.limit) || input.limit < 1) throw new Error('invalid_limit');
    const root = path.resolve(input.root); const results: StorageObject[] = [];
    await this.walk(root, root, input.prefix, input.limit, results); return results;
  }

  async delete(input: { root: string; key: string; versionId?: string }): Promise<void> {
    const object = await this.head(input); const target = this.safePath(input.root, input.key); if (input.versionId && input.versionId !== object.versionId) throw new Error('version_conflict');
    await fs.unlink(target); await fs.unlink(`${target}.meta.json`);
  }

  private async walk(root: string, dir: string, prefix: string, limit: number, results: StorageObject[]): Promise<void> {
    if (results.length >= limit) return; for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name); if (entry.isSymbolicLink()) continue; if (entry.isDirectory()) { await this.walk(root, full, prefix, limit, results); continue; }
      if (!entry.name.endsWith('.meta.json')) continue; const meta = JSON.parse(await fs.readFile(full, 'utf8')) as Meta; const relative = path.relative(root, full).replace(/\\/g, '/').replace(/\.meta\.json$/, '');
      if (relative.startsWith(prefix)) results.push({ ...meta, key: relative }); if (results.length >= limit) return;
    }
  }

  private safePath(root: string, key: string): string { if (!key || key.startsWith('/') || key.includes('\\') || key.split('/').includes('..')) throw new Error('invalid_object_key'); const base = path.resolve(root); const target = path.resolve(base, key); if (target !== base && !target.startsWith(`${base}${path.sep}`)) throw new Error('path_escape'); return target; }
  private assertRoot(root: string): void { if (path.resolve(root) !== path.resolve(this.options.root)) throw new Error('root_mismatch'); }
  private assertSize(size: number): void { if (!Number.isSafeInteger(size) || size > this.options.maxObjectBytes) throw new Error('object_too_large'); }
}
