import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createVerifiedConariProvider } from '../../packages/mail-infra/conari-native-provider';

const root = await mkdtemp(path.join(os.tmpdir(), 'secure-mail-native-'));
try {
  const bytes = new TextEncoder().encode('approved-native-module');
  const filename = 'mail-native.bin';
  await writeFile(path.join(root, filename), bytes);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  let loaded = false;
  const loader = { load: async () => { loaded = true; return { invoke: async <T>(_operation: string, input: unknown) => input as T }; } };
  const provider = await createVerifiedConariProvider<{ value: number }>({ descriptor: { id: 'test-native', fileName: filename, sha256 }, root, loader });
  assert.equal(loaded, true);
  assert.deepEqual(await provider.invoke('echo', { value: 7 }), { value: 7 });
  await assert.rejects(provider.invoke('', { value: 1 }), /native_operation_required/);

  loaded = false;
  await writeFile(path.join(root, filename), new TextEncoder().encode('tampered'));
  await assert.rejects(createVerifiedConariProvider({ descriptor: { id: 'tampered', fileName: filename, sha256 }, root, loader }), /native_module_verification_failed/);
  assert.equal(loaded, false);
  await assert.rejects(createVerifiedConariProvider({ descriptor: { id: 'path', fileName: '../escape', sha256 }, root, loader }), /native_module_filename_invalid/);
} finally {
  await rm(root, { recursive: true, force: true });
}

console.log('Conari native provider verification tests passed');
