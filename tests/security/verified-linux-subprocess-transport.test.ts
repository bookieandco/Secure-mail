import { strict as assert } from 'node:assert';
import { GatedLinuxSubprocessTransport } from '../../packages/mail-infra/verified-linux-subprocess-transport';

const base = { executable: '/usr/local/bin/native-worker', args: [], cwd: '/var/empty', env: { PATH: '/usr/bin' }, timeoutMs: 1000, maxPayloadBytes: 1024, network: 'DENY' as const, filesystem: 'WORKDIR_ONLY' as const, isolation: { namespaces: ['mount', 'pid', 'network', 'ipc', 'uts', 'user'] as const, seccomp: 'REQUIRED' as const, resourceLimits: { cpuMs: 1000, memoryBytes: 16 * 1024 * 1024, pids: 16 }, filesystemRoot: 'WORKDIR_ONLY' as const, network: 'DENY' as const } };
const verified = { ...base, isolationVerified: true as const };
const transport = new GatedLinuxSubprocessTransport(verified);
assert.ok(transport);
assert.throws(() => new GatedLinuxSubprocessTransport(base), /isolation_required/);
console.log('verified Linux subprocess transport tests passed');
