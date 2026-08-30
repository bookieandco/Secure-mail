import { strict as assert } from 'node:assert';
import { NativeSandboxHelperDispatcher } from '../../packages/mail-infra/native-sandbox-helper-dispatcher';
import { signNativeSandboxHelperRequest } from '../../packages/mail-infra/native-sandbox-helper-protocol';

const secret = Buffer.from('test-secret');
const base = { version: 1 as const, requestId: 'adv-1', operation: 'prepare' as const, executable: '/usr/local/bin/native-worker', args: ['--stdio'], cwd: '/var/empty', pid: 42, cpuMs: 1000, memoryBytes: 16 * 1024 * 1024, pids: 16, network: 'DENY' as const, filesystem: 'WORKDIR_ONLY' as const, seccomp: 'REQUIRED' as const };
const dispatcher = new NativeSandboxHelperDispatcher(secret, { allowedExecutables: [base.executable], allowedRoots: ['/var/empty'] }, { prepare: async () => {} });

const signed = { ...base, mac: signNativeSandboxHelperRequest(base, secret) };
assert.equal((await dispatcher.dispatch(signed)).ok, true);
assert.equal((await dispatcher.dispatch(signed)).ok, false);
assert.equal((await dispatcher.dispatch({ ...signed, requestId: 'adv-2', mac: '0'.repeat(64) })).ok, false);
assert.equal((await dispatcher.dispatch({ ...signed, requestId: 'adv-3', executable: '/bin/sh', mac: signNativeSandboxHelperRequest({ ...base, requestId: 'adv-3', executable: '/bin/sh' }, secret) })).ok, false);
assert.equal((await dispatcher.dispatch({ ...signed, requestId: 'adv-4', cwd: '/tmp', mac: signNativeSandboxHelperRequest({ ...base, requestId: 'adv-4', cwd: '/tmp' }, secret) })).ok, false);
assert.equal((await dispatcher.dispatch({ ...signed, requestId: 'adv-5', network: 'DENY' as const, seccomp: 'REQUIRED' as const })).ok, false);
console.log('native sandbox helper adversarial tests passed');
