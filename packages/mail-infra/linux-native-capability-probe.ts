import { access } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { LinuxIsolationProbe } from './linux-native-isolation-enforcer';

const execFileAsync = promisify(execFile);

export async function commandAvailable(command: string): Promise<boolean> {
  try { await execFileAsync('sh', ['-c', `command -v -- ${command}`], { timeout: 1000 }); return true; } catch { return false; }
}

export async function pathExists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

export async function readKernelFlag(name: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync('sh', ['-c', `grep -E '^${name}[[:space:]]+' /proc/self/status /proc/sys/kernel/${name} 2>/dev/null || true`], { timeout: 1000 });
    return stdout.trim().length > 0;
  } catch { return false; }
}

export const realLinuxIsolationProbe: LinuxIsolationProbe = { commandAvailable, pathExists };
