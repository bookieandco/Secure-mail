import { connect, createServer, type Server, type Socket } from 'node:net';
import { unlink } from 'node:fs/promises';
import type { NativeSandboxHelperDispatcher } from './native-sandbox-helper-dispatcher';
import type { NativeSandboxHelperRequest, NativeSandboxHelperResponse } from './native-sandbox-helper-protocol';
import { encodeFrame, FrameDecoder } from './native-sandbox-helper-framing';

const MAX_FRAME = 16 * 1024;

export class NativeSandboxUnixSocketServer {
  private server?: Server;
  constructor(private readonly socketPath: string, private readonly dispatcher: NativeSandboxHelperDispatcher) {}

  async listen(): Promise<void> {
    await unlink(this.socketPath).catch(() => undefined);
    this.server = createServer((socket) => this.handle(socket));
    await new Promise<void>((resolve, reject) => {
      this.server!.once('error', reject).listen(this.socketPath, () => resolve());
    });
  }

  async close(): Promise<void> {
    await new Promise<void>((resolve) => this.server?.close(() => resolve()) ?? resolve());
    await unlink(this.socketPath).catch(() => undefined);
  }

  private handle(socket: Socket): void {
    const decoder = new FrameDecoder(MAX_FRAME);
    let handled = false;
    socket.on('data', async (chunk) => {
      if (handled) { socket.destroy(); return; }
      try {
        const frames = decoder.push(chunk);
        if (frames.length !== 1) { if (frames.length > 1) socket.destroy(); return; }
        handled = true;
        const request = JSON.parse(frames[0].toString('utf8')) as NativeSandboxHelperRequest;
        const response: NativeSandboxHelperResponse = await this.dispatcher.dispatch(request);
        socket.end(encodeFrame(Buffer.from(JSON.stringify(response), 'utf8')));
      } catch {
        socket.destroy();
      }
    });
    socket.on('error', () => socket.destroy());
  }
}

export function requestViaNativeSandboxUnixSocket(socketPath: string, request: NativeSandboxHelperRequest): Promise<NativeSandboxHelperResponse> {
  return new Promise((resolve, reject) => {
    const socket = connect(socketPath);
    const decoder = new FrameDecoder(MAX_FRAME);
    let settled = false;
    const fail = (error: Error) => { if (!settled) { settled = true; socket.destroy(); reject(error); } };
    socket.once('error', fail);
    socket.on('data', (chunk) => {
      try {
        const frames = decoder.push(chunk);
        if (frames.length !== 1) return;
        if (settled) return;
        settled = true;
        resolve(JSON.parse(frames[0].toString('utf8')) as NativeSandboxHelperResponse);
        socket.end();
      } catch (error) { fail(error instanceof Error ? error : new Error('invalid_helper_response')); }
    });
  });
}
