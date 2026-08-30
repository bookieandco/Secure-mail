import { strict as assert } from 'node:assert';
import { prepareNativeSandboxSocket } from '../../packages/mail-infra/native-sandbox-socket-lifecycle';

await assert.rejects(prepareNativeSandboxSocket({ socketPath: 'relative/helper.sock', directoryMode: 0o700, socketMode: 0o600 }), /socket_path_invalid/);
await assert.rejects(prepareNativeSandboxSocket({ socketPath: '/run/secure-mail/helper.sock', directoryMode: 0o755, socketMode: 0o600 }), /mode_too_permissive/);
await assert.doesNotReject(prepareNativeSandboxSocket({ socketPath: '/tmp/secure-mail-test/helper.sock', directoryMode: 0o700, socketMode: 0o600 }));
console.log('native sandbox socket lifecycle tests passed');
