import { strict as assert } from 'node:assert';
import { assertIsolationVerified, verifyLinuxIsolation } from '../../packages/mail-infra/linux-sandbox-enforcement';

const plan = { executable: '/usr/local/bin/native-worker', args: [], cwd: '/var/empty', env: { PATH: '/usr/bin' }, timeoutMs: 1000, maxPayloadBytes: 1024, network: 'DENY' as const, filesystem: 'WORKDIR_ONLY' as const, isolation: { namespaces: ['mount', 'pid', 'network', 'ipc', 'uts', 'user'] as const, seccomp: 'REQUIRED' as const, resourceLimits: { cpuMs: 1000, memoryBytes: 16 * 1024 * 1024, pids: 16 }, filesystemRoot: 'WORKDIR_ONLY' as const, network: 'DENY' as const } };
const verified = await verifyLinuxIsolation({ verify: async () => true }, plan);
assertIsolationVerified(verified);
assert.equal(verified.isolationVerified, true);
await assert.rejects(verifyLinuxIsolation({ verify: async () => false }, plan), /isolation_unverified/);
assert.throws(() => assertIsolationVerified(plan), /isolation_required/);
console.log('Linux sandbox enforcement tests passed');
