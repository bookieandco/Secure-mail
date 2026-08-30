import { strict as assert } from 'node:assert';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { verifyNativeModule } from '../../packages/mail-domain/native-module-verifier';

const root = await mkdtemp(path.join(os.tmpdir(), 'secure-mail-native-verify-'));
try {
  const bytes = new TextEncoder().encode('signed-native-module');
  const fileName = 'module.bin';
  await writeFile(path.join(root, fileName), bytes);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const signature = sign(null, bytes, privateKey).toString('base64');
  const pathResult = await verifyNativeModule({ id: 'signed', fileName, sha256, signature }, { root, publicKey: publicKey.export({ type: 'spki', format: 'pem' }).toString() });
  assert.equal(pathResult, path.join(root, fileName));
  await assert.rejects(verifyNativeModule({ id: 'bad', fileName, sha256, signature: Buffer.from('bad').toString('base64') }, { root, publicKey: publicKey.export({ type: 'spki', format: 'pem' }).toString() }), /native_module_signature_invalid/);
  await assert.rejects(verifyNativeModule({ id: 'needs-key', fileName, sha256, signature }, { root }), /native_module_public_key_required/);
  await assert.rejects(verifyNativeModule({ id: 'bad-hash', fileName, sha256: '0'.repeat(64), signature }, { root, publicKey: publicKey.export({ type: 'spki', format: 'pem' }).toString() }), /native_module_verification_failed/);
} finally {
  await rm(root, { recursive: true, force: true });
}

console.log('native module verification tests passed');
