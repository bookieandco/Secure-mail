export type DomainVerificationMethod = 'DNS_TXT';

export type DomainVerificationState =
  | 'PENDING'
  | 'VERIFIED'
  | 'REVOKED';

export interface DomainIdentity {
  readonly id: string;
  readonly hostname: string;
  readonly verificationMethod: DomainVerificationMethod;
  readonly verificationState: DomainVerificationState;
  readonly verificationToken: string;
  readonly webEnabled: boolean;
  readonly mailEnabled: boolean;
}

export interface DomainCapabilityAuthorization {
  readonly domainId: string;
  readonly web: boolean;
  readonly mail: boolean;
}
