import { strict as assert } from 'node:assert';
import { PublicDnsObservationProvider } from '../../packages/mail-domain/public-dns-observation';

const provider = new PublicDnsObservationProvider({
  lookup: {
    async lookupTxt(recordName) {
      assert.equal(recordName, '_securemail.example.com');
      return [' value-one ', '', 'value-two'];
    },
  },
});

const observation = await provider.observeTxt('_securemail.example.com.');
assert.equal(observation.recordName, '_securemail.example.com');
assert.deepEqual(observation.values, ['value-one', 'value-two']);

const timeoutProvider = new PublicDnsObservationProvider({
  timeoutMs: 250,
  lookup: { lookupTxt: () => new Promise(() => {}) },
});
await assert.rejects(timeoutProvider.observeTxt('example.com'), /dns_lookup_timeout/);

assert.throws(() => new PublicDnsObservationProvider({ timeoutMs: 100, lookup: { lookupTxt: async () => [] } }), /invalid_dns_timeout/);
assert.throws(() => provider.observeTxt(''), /record_name_required/);

console.log('public DNS observation security tests passed');
