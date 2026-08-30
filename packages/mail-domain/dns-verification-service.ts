import type { DomainIdentity, DomainVerificationState } from '../mail-types/domain-identity';
import type { DnsObservationProvider } from '../mail-types/dns-observation';
import type { DnsTxtChallenge, DnsVerificationResult } from './dns-verification';
import { verifyDnsTxtChallenge } from './dns-verification';

export interface DomainVerificationAuditEvent {
  readonly type: 'DOMAIN_VERIFICATION_ATTEMPTED';
  readonly domainId: string;
  readonly provider: string;
  readonly result: DnsVerificationResult['reason'];
  readonly occurredAt: string;
}

export interface DomainVerificationOutcome {
  readonly identity: DomainIdentity;
  readonly result: DnsVerificationResult;
  readonly auditEvent: DomainVerificationAuditEvent;
}

export async function verifyDomain(
  identity: DomainIdentity,
  challenge: DnsTxtChallenge,
  provider: DnsObservationProvider,
  now: Date = new Date(),
): Promise<DomainVerificationOutcome> {
  if (challenge.domainId !== identity.id) {
    throw new Error('challenge_domain_mismatch');
  }

  const observation = await provider.observeTxt(challenge.recordName);
  const result = verifyDnsTxtChallenge(challenge, observation, now);
  const nextState: DomainVerificationState = result.verified ? 'VERIFIED' : identity.verificationState;

  return {
    identity: { ...identity, verificationState: nextState },
    result,
    auditEvent: {
      type: 'DOMAIN_VERIFICATION_ATTEMPTED',
      domainId: identity.id,
      provider: provider.name,
      result: result.reason,
      occurredAt: now.toISOString(),
    },
  };
}
