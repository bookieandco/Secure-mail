import type { DnsObservationProvider, DnsTxtObservation } from '../mail-types/dns-observation';

export interface DnsTxtLookup {
  lookupTxt(recordName: string): Promise<readonly string[]>;
}

export interface PublicDnsObservationOptions {
  readonly lookup: DnsTxtLookup;
  readonly timeoutMs?: number;
}

function normalizeRecordName(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, '');
}

export class PublicDnsObservationProvider implements DnsObservationProvider {
  readonly name = 'public-dns';
  private readonly timeoutMs: number;

  constructor(private readonly options: PublicDnsObservationOptions) {
    this.timeoutMs = options.timeoutMs ?? 5000;
    if (!Number.isInteger(this.timeoutMs) || this.timeoutMs < 250 || this.timeoutMs > 30000) {
      throw new Error('invalid_dns_timeout');
    }
  }

  async observeTxt(recordName: string): Promise<DnsTxtObservation> {
    const normalized = normalizeRecordName(recordName);
    if (!normalized) throw new Error('record_name_required');

    const values = await Promise.race([
      this.options.lookup.lookupTxt(normalized),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('dns_lookup_timeout')), this.timeoutMs),
      ),
    ]);

    return {
      recordName: normalized,
      values: values.map((value) => value.trim()).filter(Boolean),
    };
  }
}
