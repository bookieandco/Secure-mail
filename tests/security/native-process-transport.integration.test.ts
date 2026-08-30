import { strict as assert } from 'node:assert';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { NodeNativeProcessTransport } from '../../packages/mail-infra/node-native-process-transport';

const root = await mkdtemp(path.join(os.tmpdir(), 'secure-mail-native-worker-'));
const worker = path.join(root, 'worker.mjs');
try {
  await writeFile(worker, `import { parentPort } from 'node:worker_threads';\nparentPort.on('message', async (m) => {\n  if (m.operation === 'echo') parentPort.postMessage({ requestId: m.requestId, ok: true, value: m.input });\n  else if (m.operation === 'wrong-id') parentPort.postMessage({ requestId: 'unexpected', ok: true, value: m.input });\n  else if (m.operation === 'malformed') parentPort.postMessage({ requestId: m.requestId, ok: true });\n  else if (m.operation === 'hang') await new Promise(() => {});\n  else if (m.operation === 'crash') process.exit(1);\n});`);
  const transport = new NodeNativeProcessTransport({ workerFile: worker, maxPayloadBytes: 1024 });
  const ok = await transport.run({ moduleId: 'm1', operation: 'echo', input: { value: 42 }, timeoutMs: 500 });
  assert.deepEqual(ok, { ok: true, value: { value: 42 } });
  const wrongId = await transport.run({ moduleId: 'm1', operation: 'wrong-id', input: {}, timeoutMs: 500 });
  assert.deepEqual(wrongId, { ok: false, errorCode: 'PROTOCOL_ERROR' });
  const malformed = await transport.run({ moduleId: 'm1', operation: 'malformed', input: {}, timeoutMs: 500 });
  assert.deepEqual(malformed, { ok: false, errorCode: 'PROTOCOL_ERROR' });
  const timeout = await transport.run({ moduleId: 'm1', operation: 'hang', input: {}, timeoutMs: 30 });
  assert.deepEqual(timeout, { ok: false, errorCode: 'TIMEOUT' });
  const crash = await transport.run({ moduleId: 'm1', operation: 'crash', input: {}, timeoutMs: 500 });
  assert.deepEqual(crash, { ok: false, errorCode: 'PROCESS_EXIT' });
  const oversized = await transport.run({ moduleId: 'm1', operation: 'echo', input: 'x'.repeat(2000), timeoutMs: 500 });
  assert.deepEqual(oversized, { ok: false, errorCode: 'PROTOCOL_ERROR' });
} finally {
  await rm(root, { recursive: true, force: true });
}

console.log('native process transport integration tests passed');
