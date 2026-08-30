import type { NativeSandboxHelperRequest, NativeSandboxHelperResponse } from './native-sandbox-helper-protocol';

export const NATIVE_HELPER_MAX_FRAME_BYTES = 16 * 1024;

export function encodeHelperFrame(message: NativeSandboxHelperRequest | NativeSandboxHelperResponse): Buffer {
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  if (body.length > NATIVE_HELPER_MAX_FRAME_BYTES) throw new Error('native_sandbox_frame_too_large');
  const frame = Buffer.allocUnsafe(4 + body.length);
  frame.writeUInt32BE(body.length, 0);
  body.copy(frame, 4);
  return frame;
}

export interface HelperFrameDecoder {
  push(chunk: Buffer): Array<NativeSandboxHelperRequest | NativeSandboxHelperResponse>;
}

export class BoundedHelperFrameDecoder implements HelperFrameDecoder {
  private buffer = Buffer.alloc(0);

  push(chunk: Buffer): Array<NativeSandboxHelperRequest | NativeSandboxHelperResponse> {
    if (this.buffer.length + chunk.length > NATIVE_HELPER_MAX_FRAME_BYTES * 2) throw new Error('native_sandbox_input_buffer_exceeded');
    this.buffer = Buffer.concat([this.buffer, chunk]);
    const messages: Array<NativeSandboxHelperRequest | NativeSandboxHelperResponse> = [];
    while (this.buffer.length >= 4) {
      const length = this.buffer.readUInt32BE(0);
      if (length > NATIVE_HELPER_MAX_FRAME_BYTES) throw new Error('native_sandbox_frame_too_large');
      if (this.buffer.length < 4 + length) break;
      const body = this.buffer.subarray(4, 4 + length).toString('utf8');
      this.buffer = this.buffer.subarray(4 + length);
      try { messages.push(JSON.parse(body) as NativeSandboxHelperRequest | NativeSandboxHelperResponse); }
      catch { throw new Error('native_sandbox_frame_invalid_json'); }
    }
    return messages;
  }
}
