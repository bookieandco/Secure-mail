import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export interface DnsTxtChallenge {
  readonly domainId: string;
  readonly hostname: string;
  readonly recordName: string;
  readonly expectedValue: string;
  readonly expiresAt: string;
}

export interface DnsTxtObservation {
  readonly recordName: string;
  readonly values: readonly string[];
}

export interface DnsVerificationResult {
  readonly verified: boolean;
  readonly reason: 'verified' | 'expired' | 'record_name_mismatch' | 'value_mismatch';
}

export function createDnsTxtChallenge(
  domainId: string,
  hostname: string,
  now: Date = new Date(),
  ttlSeconds = 900,
): DnsTxtChallenge {
  if (!domainId) throw new Error('domain_id_required');
  if (!hostname) throw new Error('hostname_required');
  if (!Number.isInteger(ttlSeconds) || ttlSeconds < 60 || ttlSeconds > 86400) {
    throw new Error('invalid_challenge_ttl');
  }

  const nonce = randomBytes(24).toString('hex');
  const digest = createHash('sha256').update(`${domainId}:${hostname}:${nonce}`).digest('hex');
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();

  return {
    domainId,
    hostname: hostname.toLowerCase().replace(/\.$/, ''),
    recordName: `_securemail.${hostname.toLowerCase().replace(/\.$/, '')}`,
    expectedValue: `v=secure-mail-1; challenge=${digest}`,
    expiresAt,
  };
}

export function verifyDnsTxtChallenge(
  challenge: DnsTxtChallenge,
  observation: DnsTxtObservation,
  now: Date = new Date(),
): DnsVerificationResult {
  if (now.getTime() >= Date.parse(challenge.expiresAt)) {
    return { verified: false, reason: 'expired' };
  }

  if (observation.recordName.toLowerCase().replace(/\.$/, '') !== challenge.recordName) {
    return { verified: false, reason: 'record_name_mismatch' };
  }

  const expected = Buffer.from(challenge.expectedValue);
  const found = observation.values.some((value) => {
    const candidate = Buffer.from(value.trim());
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  });

  return found
    ? { verified: true, reason: 'verified' }
    : { verified: false, reason: 'value_mismatch' };
}
