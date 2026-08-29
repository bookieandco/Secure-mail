import { strict as assert } from 'node:assert';
import { resolveWorkloadPolicy } from '../../packages/mail-domain/workload-policy';

const policy = {
  workloadId: 'site-1',
  allowInternetEgress: true,
  allowedControlApi: true,
  allowedMailZone: false,
  allowedPrivateNetworks: false,
} as const;

assert.equal(resolveWorkloadPolicy(policy, {
  workloadId: 'site-1', destinationZone: 'internet', port: 443,
}), 'ALLOW');

assert.equal(resolveWorkloadPolicy(policy, {
  workloadId: 'site-1', destinationZone: 'control', port: 443,
}), 'ALLOW');

assert.equal(resolveWorkloadPolicy(policy, {
  workloadId: 'site-1', destinationZone: 'mail', port: 993,
}), 'DENY');

assert.equal(resolveWorkloadPolicy(policy, {
  workloadId: 'site-1', destinationZone: 'private', port: 5432,
}), 'DENY');

assert.equal(resolveWorkloadPolicy(policy, {
  workloadId: 'other-site', destinationZone: 'internet', port: 443,
}), 'DENY');

assert.equal(resolveWorkloadPolicy(policy, {
  workloadId: 'site-1', destinationZone: 'internet', port: 0,
}), 'DENY');

console.log('workload policy security tests passed');
