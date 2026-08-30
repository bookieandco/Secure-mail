import { strict as assert } from 'node:assert';
import { VerifiedLinuxSandboxExecutor } from '../../packages/mail-infra/linux-sandbox-launcher';

const unverified = { executable: '/bin/true', args: [], cwd: '/', env: {}, timeoutMs: 1000, maxPayloadBytes: 1024, network: 'DENY' as const, filesystem: 'WORKDIR_ONLY' as const, isolation: { namespaces: ['mount', 'pid', 'network', 'ipc', 'uts', 'user'] as const, seccomp: 'REQUIRED' as const, resourceLimits: { cpuMs: 1000, memoryBytes: 16 * 1024 * 1024, pids: 16 }, filesystemRoot: 'WORKDIR_ONLY' as const, network: 'DENY' as const }, isolationVerified: true as const };
assert.throws(() => new VerifiedLinuxSandboxExecutor().spawn(unverified as never), /enforcement_required/);
console.log('direct sandbox bypass test passed');
