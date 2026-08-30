import { chmod, lstat } from 'node:fs/promises';
import { constants } from 'node:fs';
import type { Server } from 'node:net';

export interface NativeSandboxSocketSecurity {
  readonly socketPath: string;
  readonly mode: number;
}

export async function hardenNativeSandboxSocket(server: Server, security: NativeSandboxSocketSecurity): Promise<void> {
  if ((security.mode & 0o077) !== 0) throw new Error('native_sandbox_socket_mode_too_permissive');
  await chmod(security.socketPath, security.mode);
  const stat = await lstat(security.socketPath);
  if (!stat.isSocket()) throw new Error('native_sandbox_socket_type_invalid');
  if ((stat.mode & 0o777) !== security.mode) throw new Error('native_sandbox_socket_permissions_invalid');
  void server;
}

export function assertLocalSocketPath(socketPath: string): void {
  if (!socketPath.startsWith('/') || socketPath.includes('\0')) throw new Error('native_sandbox_socket_path_invalid');
}
