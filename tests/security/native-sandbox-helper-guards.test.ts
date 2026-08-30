import { strict as assert } from 'node:assert';
import { NativeSandboxRequestGuard } from '../../packages/mail-infra/native-sandbox-helper-guards';

const request = { version: 1 as const, requestId: 'req-1', operation: 'prepare' as const, executable: '/usr/local/bin/native-worker', args: ['--stdio'], cwd: '/var/empty', pid: 42, cpuMs: 1000, memoryBytes: 16 * 1024 * 1024, pids: 16, network: 'DENY' as const, filesystem: 'WORKDIR_ONLY' as const, seccomp: 'REQUIRED' as const, mac: 'a'.repeat(64) };
const guard = new NativeSandboxRequestGuard({ maxRequestBytes: 4096, maxArguments: 4, maxArgumentBytes: 128, maxEnvironmentEntries: 8 });
guard.validate(request);
assert.throws(() => guard.validate(request), /request_replay/);
assert.throws(() => new NativeSandboxRequestGuard({ maxRequestBytes: 16, maxArguments: 4, maxArgumentBytes: 128, maxEnvironmentEntries: 8 }).validate(request), /request_too_large/);
assert.throws(() => new NativeSandboxRequestGuard({ maxRequestBytes: 4096, maxArguments: 0, maxArgumentBytes: 128, maxEnvironmentEntries: 8 }).validate({ ...request, requestId: 'req-2' }), /argument_count_exceeded/);
assert.throws(() => new NativeSandboxRequestGuard({ maxRequestBytes: 4096, maxArguments: 4, maxArgumentBytes: 2, maxEnvironmentEntries: 8 }).validate({ ...request, requestId: 'req-3' }), /argument_too_large/);
console.log('native sandbox helper guard tests passed');
