import { strict as assert } from 'node:assert';
import { CloudflareDnsObservationProvider } from '../../packages/mail-domain/cloudflare-dns-observation';

const calls: { zoneId: string; name: string }[] = [];
const provider = new CloudflareDnsObservationProvider({
  zoneId: 'zone-1',
  api: {
    async listTxtRecords(input) {
      calls.push(input);
      return [
        { name: '_securemail.example.com.', content: ' challenge-one ' },
        { name: '_other.example.com', content: 'should-not-be-included' },
      ];
    },
  },
});

const observation = await provider.observeTxt('_securemail.example.com.');
assert.deepEqual(observation, {
  recordName: '_securemail.example.com',
  values: ['challenge-one'],
});
assert.deepEqual(calls, [{ zoneId: 'zone-1', name: '_securemail.example.com' }]);

assert.throws(
  () => new CloudflareDnsObservationProvider({ zoneId: '', api: { listTxtRecords: async () => [] } }),
  /zone_id_required/,
);
assert.throws(() => provider.observeTxt(''), /record_name_required/);

console.log('Cloudflare DNS observation security tests passed');
