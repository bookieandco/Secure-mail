import { strict as assert } from 'node:assert';
import { PortableNativeOsSandbox } from '../../packages/mail-infra/native-os-sandbox';

const sandbox = new PortableNativeOsSandbox();
const spec = await sandbox.prepare({
  executable: '/usr/local/bin/native-worker',
  allowedArguments: ['--stdio'],
  cwd: '/var/empty',
  env: { PATH: '/usr/bin' },
  timeoutMs: 1000,
  maxPayloadBytes: 1024,
  network: 'DENY',
  filesystem: 'WORKDIR_ONLY',
});
assert.deepEqual(spec, {
  executable: '/usr/local/bin/native-worker',
  args: ['--stdio'],
  cwd: '/var/empty',
  env: { PATH: '/usr/bin' },
  timeoutMs: 1000,
  maxPayloadBytes: 1024,
  network: 'DENY',
  filesystem: 'WORKDIR_ONLY',
});
console.log('native OS sandbox tests passed');
