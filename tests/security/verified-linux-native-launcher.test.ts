import { strict as assert } from 'node:assert';
import { GatedLinuxNativeLauncher } from '../../packages/mail-infra/verified-linux-native-launcher';

const plan = { executable: '/usr/local/bin/native-worker', args: [], cwd: '/var/empty', env: { PATH: '/usr/bin' }, timeoutMs: 1000, maxPayloadBytes: 1024, network: 'DENY' as const, filesystem: 'WORKDIR_ONLY' as const, isolation: { namespaces: ['mount', 'pid', 'network', 'ipc', 'uts', 'user'] as const, seccomp: 'REQUIRED' as const, resourceLimits: { cpuMs: 1000, memoryBytes: 16 * 1024 * 1024, pids: 16 }, filesystemRoot: 'WORKDIR_ONLY' as const, network: 'DENY' as const } };
const launcher = new GatedLinuxNativeLauncher({ verify: async () => true });
const verified = await launcher.verifyAndPrepare(plan);
assert.equal(verified.isolationVerified, true);
const blocked = new GatedLinuxNativeLauncher({ verify: async () => false });
await assert.rejects(blocked.verifyAndPrepare(plan), /isolation_unverified/);
console.log('verified Linux native launcher tests passed');
