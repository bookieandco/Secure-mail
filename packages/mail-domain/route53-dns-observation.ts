import type { DnsObservationProvider, DnsTxtObservation } from '../mail-types/dns-observation';

export interface Route53DnsApi {
  listTxtRecords(input: { hostedZoneId: string; name: string }): Promise<readonly { name: string; values: readonly string[] }[]>;
}

export interface Route53DnsObservationOptions {
  readonly api: Route53DnsApi;
  readonly hostedZoneId: string;
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, '');
}

export class Route53DnsObservationProvider implements DnsObservationProvider {
  readonly name = 'route53';

  constructor(private readonly options: Route53DnsObservationOptions) {
    if (!options.hostedZoneId) throw new Error('hosted_zone_id_required');
  }

  async observeTxt(recordName: string): Promise<DnsTxtObservation> {
    const normalized = normalize(recordName);
    if (!normalized) throw new Error('record_name_required');

    const records = await this.options.api.listTxtRecords({
      hostedZoneId: this.options.hostedZoneId,
      name: normalized,
    });

    return {
      recordName: normalized,
      values: records
        .filter((record) => normalize(record.name) === normalized)
        .flatMap((record) => record.values.map((value) => value.trim()))
        .filter(Boolean),
    };
  }
}
