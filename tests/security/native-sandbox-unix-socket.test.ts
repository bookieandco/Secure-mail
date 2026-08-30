import { strict as assert } from 'node:assert';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NativeSandboxHelperDispatcher } from '../../packages/mail-infra/native-sandbox-helper-dispatcher';
import { signNativeSandboxHelperRequest } from '../../packages/mail-infra/native-sandbox-helper-protocol';
import { NativeSandboxUnixSocketServer, requestViaNativeSandboxUnixSocket } from '../../packages/mail-infra/native-sandbox-unix-socket';

const secret = Buffer.from('test-secret');
const base = { version: 1 as const, requestId: 'socket-1', operation: 'prepare' as const, executable: '/usr/local/bin/native-worker', args: ['--stdio'], cwd: '/var/empty', pid: 42, cpuMs: 1000, memoryBytes: 16 * 1024 * 1024, pids: 16, network: 'DENY' as const, filesystem: 'WORKDIR_ONLY' as const, seccomp: 'REQUIRED' as const };
const dispatcher = new NativeSandboxHelperDispatcher(secret, { allowedExecutables: [base.executable], allowedRoots: ['/var/empty'] }, { prepare: async () => {} });
const dir = await mkdtemp(join(tmpdir(), 'secure-mail-sandbox-'));
const server = new NativeSandboxUnixSocketServer(join(dir, 'helper.sock'), dispatcher);
await server.listen();
const response = await requestViaNativeSandboxUnixSocket(server['socketPath'], { ...base, mac: signNativeSandboxHelperRequest(base, secret) });
assert.equal(response.ok, true);
await server.close();
console.log('native sandbox Unix socket tests passed');
