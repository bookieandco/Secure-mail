import type { DnsObservationProvider, DnsTxtObservation } from '../mail-types/dns-observation';

export interface CloudflareDnsApi {
  listTxtRecords(input: { zoneId: string; name: string }): Promise<readonly { name: string; content: string }[]>;
}

export interface CloudflareDnsObservationOptions {
  readonly api: CloudflareDnsApi;
  readonly zoneId: string;
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, '');
}

export class CloudflareDnsObservationProvider implements DnsObservationProvider {
  readonly name = 'cloudflare';

  constructor(private readonly options: CloudflareDnsObservationOptions) {
    if (!options.zoneId) throw new Error('zone_id_required');
  }

  async observeTxt(recordName: string): Promise<DnsTxtObservation> {
    const normalized = normalize(recordName);
    if (!normalized) throw new Error('record_name_required');

    const records = await this.options.api.listTxtRecords({
      zoneId: this.options.zoneId,
      name: normalized,
    });

    return {
      recordName: normalized,
      values: records
        .filter((record) => normalize(record.name) === normalized)
        .map((record) => record.content.trim())
        .filter(Boolean),
    };
  }
}
