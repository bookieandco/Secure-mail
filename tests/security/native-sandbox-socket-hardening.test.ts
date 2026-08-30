import { strict as assert } from 'node:assert';
import { assertLocalSocketPath } from '../../packages/mail-infra/native-sandbox-socket-hardening';

assert.doesNotThrow(() => assertLocalSocketPath('/run/secure-mail/helper.sock'));
assert.throws(() => assertLocalSocketPath('relative/helper.sock'), /socket_path_invalid/);
assert.throws(() => assertLocalSocketPath('/run/secure-mail/\0helper.sock'), /socket_path_invalid/);
console.log('native sandbox socket hardening tests passed');
