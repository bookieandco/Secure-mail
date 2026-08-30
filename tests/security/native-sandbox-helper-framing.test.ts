import { strict as assert } from 'node:assert';
import { BoundedHelperFrameDecoder, encodeHelperFrame } from '../../packages/mail-infra/native-sandbox-helper-framing';

const message = { version: 1 as const, requestId: 'frame-1', operation: 'prepare' as const, executable: '/bin/true', args: [], cwd: '/var/empty', pid: 1, cpuMs: 1000, memoryBytes: 4096, pids: 1, network: 'DENY' as const, filesystem: 'WORKDIR_ONLY' as const, seccomp: 'REQUIRED' as const, mac: 'a'.repeat(64) };
const frame = encodeHelperFrame(message);
const decoder = new BoundedHelperFrameDecoder();
assert.equal(decoder.push(frame.subarray(0, 3)).length, 0);
assert.equal(decoder.push(frame.subarray(3)).length, 1);
assert.throws(() => encodeHelperFrame({ ...message, args: ['x'.repeat(20_000)] }), /frame_too_large/);
const oversized = Buffer.alloc(4); oversized.writeUInt32BE(16 * 1024 + 1, 0);
assert.throws(() => decoder.push(oversized), /frame_too_large/);
console.log('native sandbox helper framing tests passed');
