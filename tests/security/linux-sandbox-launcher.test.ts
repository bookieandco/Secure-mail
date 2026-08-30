import { strict as assert } from 'node:assert';
import { VerifiedLinuxSandboxExecutor } from '../../packages/mail-infra/linux-sandbox-launcher';

const base = { executable: '/bin/true', args: [], cwd: '/', env: { PATH: '/usr/bin' }, timeoutMs: 1000, maxPayloadBytes: 1024, network: 'DENY' as const, filesystem: 'WORKDIR_ONLY' as const, isolation: { namespaces: ['mount', 'pid', 'network', 'ipc', 'uts', 'user'] as const, seccomp: 'REQUIRED' as const, resourceLimits: { cpuMs: 1000, memoryBytes: 16 * 1024 * 1024, pids: 16 }, filesystemRoot: 'WORKDIR_ONLY' as const, network: 'DENY' as const } };
const executor = new VerifiedLinuxSandboxExecutor();
const child = executor.spawn({ ...base, isolationVerified: true });
await new Promise<void>((resolve) => child.once('exit', () => resolve()));
assert.throws(() => executor.spawn(base), /isolation_required/);
console.log('Linux sandbox launcher tests passed');
