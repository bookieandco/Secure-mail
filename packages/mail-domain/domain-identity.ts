import type { DomainIdentity } from '../mail-types/domain-identity';

const HOSTNAME = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export type DomainDecision =
  | { readonly kind: 'ACCEPT'; readonly identity: DomainIdentity }
  | { readonly kind: 'DENY'; readonly reason: string };

export function normalizeHostname(value: string): string | null {
  const hostname = value.trim().toLowerCase().replace(/\.$/, '');
  return HOSTNAME.test(hostname) ? hostname : null;
}

export function validateDomainIdentity(identity: DomainIdentity): DomainDecision {
  const hostname = normalizeHostname(identity.hostname);
  if (!hostname) return { kind: 'DENY', reason: 'invalid_hostname' };
  if (!identity.id) return { kind: 'DENY', reason: 'domain_id_required' };
  if (!identity.verificationToken) return { kind: 'DENY', reason: 'verification_token_required' };
  if (identity.verificationMethod !== 'DNS_TXT') return { kind: 'DENY', reason: 'unsupported_verification_method' };

  return {
    kind: 'ACCEPT',
    identity: { ...identity, hostname },
  };
}

export function canUseCapability(
  identity: DomainIdentity,
  capability: 'web' | 'mail',
): boolean {
  if (identity.verificationState !== 'VERIFIED') return false;
  return capability === 'web' ? identity.webEnabled : identity.mailEnabled;
}
