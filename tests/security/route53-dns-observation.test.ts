import { strict as assert } from 'node:assert';
import { Route53DnsObservationProvider } from '../../packages/mail-domain/route53-dns-observation';

const calls: { hostedZoneId: string; name: string }[] = [];
const provider = new Route53DnsObservationProvider({
  hostedZoneId: 'Z123',
  api: {
    async listTxtRecords(input) {
      calls.push(input);
      return [
        { name: '_securemail.example.com.', values: [' value-one ', ''] },
        { name: '_other.example.com', values: ['wrong-record'] },
      ];
    },
  },
});

const observation = await provider.observeTxt('_securemail.example.com.');
assert.deepEqual(observation, {
  recordName: '_securemail.example.com',
  values: ['value-one'],
});
assert.deepEqual(calls, [{ hostedZoneId: 'Z123', name: '_securemail.example.com' }]);

assert.throws(
  () => new Route53DnsObservationProvider({ hostedZoneId: '', api: { listTxtRecords: async () => [] } }),
  /hosted_zone_id_required/,
);
assert.throws(() => provider.observeTxt(''), /record_name_required/);

console.log('Route53 DNS observation security tests passed');
