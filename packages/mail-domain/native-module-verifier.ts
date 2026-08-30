import { createVerify } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import type { NativeModuleDescriptor } from '../mail-types/native-provider';

export interface NativeSignatureVerifier {
  verify(payload: Uint8Array, signature: string, publicKey: string): boolean;
}

export interface NativeModuleVerificationOptions {
  readonly root: string;
  readonly publicKey?: string;
  readonly signatureVerifier?: NativeSignatureVerifier;
}

export async function verifyNativeModule(
  descriptor: NativeModuleDescriptor,
  options: NativeModuleVerificationOptions,
): Promise<string> {
  if (!/^[a-f0-9]{64}$/i.test(descriptor.sha256)) throw new Error('native_module_hash_invalid');
  if (!descriptor.fileName || descriptor.fileName.includes('/') || descriptor.fileName.includes('\\')) throw new Error('native_module_filename_invalid');
  const root = options.root.replace(/[\\/]+$/, '');
  const modulePath = `${root}/${descriptor.fileName}`;
  const bytes = await readFile(modulePath);
  const hash = (await import('node:crypto')).createHash('sha256').update(bytes).digest('hex');
  if (hash !== descriptor.sha256.toLowerCase()) throw new Error('native_module_verification_failed');
  if (descriptor.signature) {
    if (!options.publicKey) throw new Error('native_module_public_key_required');
    const verified = options.signatureVerifier
      ? options.signatureVerifier.verify(bytes, descriptor.signature, options.publicKey)
      : verifyEd25519(bytes, descriptor.signature, options.publicKey);
    if (!verified) throw new Error('native_module_signature_invalid');
  }
  return modulePath;
}

function verifyEd25519(payload: Uint8Array, signatureBase64: string, publicKey: string): boolean {
  const verifier = createVerify(null as never);
  verifier.update(payload);
  verifier.end();
  return verifier.verify({ key: publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(signatureBase64, 'base64'));
}
