import { strict as assert } from 'node:assert';
import { validateNativeSandboxPolicy } from '../../packages/mail-infra/native-sandbox-policy';

const base = { executable: '/usr/local/bin/native-worker', allowedArguments: [], cwd: '/var/empty', env: { PATH: '/usr/bin' }, timeoutMs: 1000, maxPayloadBytes: 1024, network: 'DENY' as const, filesystem: 'WORKDIR_ONLY' as const };
validateNativeSandboxPolicy(base);
assert.throws(() => validateNativeSandboxPolicy({ ...base, executable: '' }), /executable_required/);
assert.throws(() => validateNativeSandboxPolicy({ ...base, cwd: 'relative' }), /cwd_invalid/);
assert.throws(() => validateNativeSandboxPolicy({ ...base, timeoutMs: 0 }), /timeout_invalid/);
assert.throws(() => validateNativeSandboxPolicy({ ...base, maxPayloadBytes: 0 }), /payload_invalid/);
assert.throws(() => validateNativeSandboxPolicy({ ...base, filesystem: 'UNRESTRICTED' }), /too_permissive/);
console.log('native sandbox policy tests passed');
