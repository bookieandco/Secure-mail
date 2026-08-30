export interface NativeWorkerRequest<T> { readonly requestId: string; readonly moduleId: string; readonly operation: string; readonly input: T; }
export interface NativeWorkerSuccess<R> { readonly requestId: string; readonly ok: true; readonly value: R; }
export interface NativeWorkerFailure { readonly requestId: string; readonly ok: false; readonly errorCode: 'TIMEOUT' | 'PROCESS_EXIT' | 'PROTOCOL_ERROR' | 'PAYLOAD_TOO_LARGE'; }
export type NativeWorkerResponse<R> = NativeWorkerSuccess<R> | NativeWorkerFailure;

export const DEFAULT_MAX_NATIVE_PAYLOAD_BYTES = 1024 * 1024;

export function assertNativeRequest(value: unknown, maxPayloadBytes = DEFAULT_MAX_NATIVE_PAYLOAD_BYTES): asserts value is NativeWorkerRequest<unknown> {
  assertPayload(value, maxPayloadBytes);
  const request = value as Record<string, unknown>;
  if (typeof request.requestId !== 'string' || !request.requestId.trim()) throw new Error('native_protocol_invalid_request_id');
  if (typeof request.moduleId !== 'string' || !request.moduleId.trim()) throw new Error('native_protocol_invalid_module_id');
  if (typeof request.operation !== 'string' || !request.operation.trim()) throw new Error('native_protocol_invalid_operation');
  if (!('input' in request)) throw new Error('native_protocol_input_required');
}

export function assertNativeResponse(value: unknown, expectedRequestId: string, maxPayloadBytes = DEFAULT_MAX_NATIVE_PAYLOAD_BYTES): asserts value is NativeWorkerResponse<unknown> {
  assertPayload(value, maxPayloadBytes);
  const response = value as Record<string, unknown>;
  if (response.requestId !== expectedRequestId) throw new Error('native_protocol_unexpected_request_id');
  if (typeof response.ok !== 'boolean') throw new Error('native_protocol_invalid_response');
  if (response.ok === false && !['TIMEOUT', 'PROCESS_EXIT', 'PROTOCOL_ERROR', 'PAYLOAD_TOO_LARGE'].includes(String(response.errorCode))) throw new Error('native_protocol_invalid_error_code');
  if (response.ok === true && !('value' in response)) throw new Error('native_protocol_missing_value');
}

function assertPayload(value: unknown, maxPayloadBytes: number): void {
  if (!Number.isSafeInteger(maxPayloadBytes) || maxPayloadBytes < 1) throw new Error('native_protocol_invalid_max_payload');
  let bytes: number;
  try { bytes = Buffer.byteLength(JSON.stringify(value)); } catch { throw new Error('native_protocol_unserializable'); }
  if (bytes > maxPayloadBytes) throw new Error('native_protocol_payload_too_large');
}
