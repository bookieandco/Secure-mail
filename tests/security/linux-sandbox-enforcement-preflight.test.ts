import { strict as assert } from 'node:assert';
import { assertEnforcementVerified, verifyLinuxEnforcement } from '../../packages/mail-infra/linux-sandbox-enforcement-preflight';

const plan = { executable: '/bin/true', args: [], cwd: '/', env: {}, timeoutMs: 1000, maxPayloadBytes: 1024, network: 'DENY' as const, filesystem: 'WORKDIR_ONLY' as const, isolation: { namespaces: ['mount', 'pid', 'network', 'ipc', 'uts', 'user'] as const, seccomp: 'REQUIRED' as const, resourceLimits: { cpuMs: 1000, memoryBytes: 16 * 1024 * 1024, pids: 16 }, filesystemRoot: 'WORKDIR_ONLY' as const, network: 'DENY' as const }, isolationVerified: true as const };
const preflight = { verifyKernelIsolation: async () => true, verifyResourceController: async () => true, verifySeccomp: async () => true, verifyFilesystemIsolation: async () => true };
const verified = await verifyLinuxEnforcement(preflight, plan);
assertEnforcementVerified(verified);
assert.equal(verified.enforcementVerified, true);
await assert.rejects(verifyLinuxEnforcement({ ...preflight, verifyFilesystemIsolation: async () => false }, plan), /enforcement_unavailable/);
assert.throws(() => assertEnforcementVerified(plan), /enforcement_required/);
console.log('Linux sandbox enforcement preflight tests passed');
