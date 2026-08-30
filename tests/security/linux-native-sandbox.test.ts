import { strict as assert } from 'node:assert';
import { LinuxNativeSandbox } from '../../packages/mail-infra/linux-native-sandbox';

const sandbox = new LinuxNativeSandbox();
const spec = await sandbox.prepare({ executable: '/usr/local/bin/native-worker', allowedArguments: ['--stdio'], cwd: '/var/empty', env: { PATH: '/usr/bin' }, timeoutMs: 1000, maxPayloadBytes: 1024, network: 'DENY', filesystem: 'WORKDIR_ONLY' });
assert.equal(spec.network, 'DENY');
assert.equal(spec.filesystem, 'WORKDIR_ONLY');
assert.deepEqual(spec.args, ['--stdio']);
await assert.rejects(sandbox.prepare({ executable: '/usr/local/bin/native-worker', allowedArguments: [], cwd: '/var/empty', env: {}, timeoutMs: 1000, maxPayloadBytes: 1024, network: 'ALLOW', filesystem: 'WORKDIR_ONLY' }), /network_must_be_denied/);
console.log('Linux native sandbox tests passed');
