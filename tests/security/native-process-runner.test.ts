import { strict as assert } from 'node:assert';
import { IsolatedNativeProcessRunner } from '../../packages/mail-infra/native-process-runner';

let received: unknown;
const runner = new IsolatedNativeProcessRunner({
  async run(request) { received = request; return { ok: true, value: { echoed: request.input } }; },
});

assert.deepEqual(await runner.invoke({ moduleId: 'native-1', operation: 'echo', input: { value: 7 }, timeoutMs: 1000 }), { echoed: { value: 7 } });
assert.equal((received as { moduleId: string }).moduleId, 'native-1');
await assert.rejects(runner.invoke({ moduleId: '', operation: 'echo', input: {}, timeoutMs: 1000 }), /native_module_id_required/);
await assert.rejects(runner.invoke({ moduleId: 'native-1', operation: '', input: {}, timeoutMs: 1000 }), /native_operation_required/);
await assert.rejects(runner.invoke({ moduleId: 'native-1', operation: 'echo', input: {}, timeoutMs: 0 }), /native_timeout_invalid/);
const failed = new IsolatedNativeProcessRunner({ async run() { return { ok: false, errorCode: 'PROCESS_EXIT' as const }; } });
await assert.rejects(failed.invoke({ moduleId: 'native-1', operation: 'echo', input: {}, timeoutMs: 1000 }), /native_process_process_exit/);
const malformed = new IsolatedNativeProcessRunner({ async run() { return { ok: true }; } });
await assert.rejects(malformed.invoke({ moduleId: 'native-1', operation: 'echo', input: {}, timeoutMs: 1000 }), /native_process_protocol_error/);

console.log('native process runner tests passed');
