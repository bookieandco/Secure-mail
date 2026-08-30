import { strict as assert } from 'node:assert';
import { assertNativeRequest, assertNativeResponse } from '../../packages/mail-infra/native-worker-protocol';

assertNativeRequest({ requestId: 'r1', moduleId: 'm1', operation: 'echo', input: { value: 1 } });
assertNativeResponse({ requestId: 'r1', ok: true, value: { value: 1 } }, 'r1');
assertNativeResponse({ requestId: 'r1', ok: false, errorCode: 'PROCESS_EXIT' }, 'r1');
assert.throws(() => assertNativeRequest({ requestId: '', moduleId: 'm1', operation: 'echo', input: {} }), /invalid_request_id/);
assert.throws(() => assertNativeRequest({ requestId: 'r1', moduleId: 'm1', operation: '', input: {} }), /invalid_operation/);
assert.throws(() => assertNativeResponse({ requestId: 'other', ok: true, value: {} }, 'r1'), /unexpected_request_id/);
assert.throws(() => assertNativeResponse({ requestId: 'r1', ok: true }, 'r1'), /missing_value/);
assert.throws(() => assertNativeRequest({ requestId: 'r1', moduleId: 'm1', operation: 'echo', input: 'x'.repeat(200) }, 32), /payload_too_large/);

console.log('native worker protocol tests passed');
