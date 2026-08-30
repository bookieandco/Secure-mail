import type { DnsObservationProvider, DnsProviderKind, DnsTxtObservation } from '../mail-types/dns-observation';
import type { DnsTxtChallenge, DnsVerificationResult } from './dns-verification';
import { verifyDnsTxtChallenge } from './dns-verification';

export interface DnsProviderFactory {
  create(kind: DnsProviderKind): DnsObservationProvider;
}

export class StaticDnsObservationProvider implements DnsObservationProvider {
  readonly name = 'static-test';

  constructor(private readonly observations: ReadonlyMap<string, DnsTxtObservation>) {}

  async observeTxt(recordName: string): Promise<DnsTxtObservation> {
    return this.observations.get(recordName.toLowerCase().replace(/\.$/, '')) ?? {
      recordName: recordName.toLowerCase().replace(/\.$/, ''),
      values: [],
    };
  }
}

export async function verifyDomainWithProvider(
  provider: DnsObservationProvider,
  challenge: DnsTxtChallenge,
  now: Date = new Date(),
): Promise<DnsVerificationResult> {
  const observation = await provider.observeTxt(challenge.recordName);
  return verifyDnsTxtChallenge(challenge, observation, now);
}
