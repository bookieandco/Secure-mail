export interface DnsTxtObservation {
  readonly recordName: string;
  readonly values: readonly string[];
}

export interface DnsObservationProvider {
  readonly name: string;
  observeTxt(recordName: string): Promise<DnsTxtObservation>;
}

export type DnsProviderKind = 'PUBLIC_DNS' | 'CLOUDFLARE' | 'ROUTE53';
