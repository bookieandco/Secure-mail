import { mkdir, chmod, lstat, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { constants } from 'node:fs';
import type { Server } from 'node:net';

export interface NativeSandboxSocketLifecycle {
  readonly socketPath: string;
  readonly directoryMode: number;
  readonly socketMode: number;
}

export async function prepareNativeSandboxSocket(lifecycle: NativeSandboxSocketLifecycle): Promise<void> {
  if (!lifecycle.socketPath.startsWith('/') || lifecycle.socketPath.includes('\0')) throw new Error('native_sandbox_socket_path_invalid');
  if ((lifecycle.directoryMode & 0o077) !== 0 || (lifecycle.socketMode & 0o077) !== 0) throw new Error('native_sandbox_socket_mode_too_permissive');
  await mkdir(dirname(lifecycle.socketPath), { recursive: true, mode: lifecycle.directoryMode });
  await chmod(dirname(lifecycle.socketPath), lifecycle.directoryMode);
  try {
    const existing = await lstat(lifecycle.socketPath);
    if (!existing.isSocket()) throw new Error('native_sandbox_stale_endpoint');
    await unlink(lifecycle.socketPath);
  } catch (error) {
    if (error instanceof Error && error.message === 'native_sandbox_stale_endpoint') throw error;
  }
}

export async function finalizeNativeSandboxSocket(server: Server, lifecycle: NativeSandboxSocketLifecycle): Promise<void> {
  await chmod(lifecycle.socketPath, lifecycle.socketMode);
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await unlink(lifecycle.socketPath).catch(() => undefined);
}
