import { strict as assert } from 'node:assert';
import { resolveWebRoute } from '../../packages/mail-domain/edge-resolver';

const valid = {
  domain: 'example.com',
  webEnabled: true,
  ownershipVerified: true,
  workloadId: 'site-1',
  targetPort: 3000,
  healthPath: '/health',
} as const;

assert.equal(resolveWebRoute(valid).kind, 'route');
assert.equal(resolveWebRoute({ ...valid, ownershipVerified: false }).kind, 'deny');
assert.equal(resolveWebRoute({ ...valid, webEnabled: false }).kind, 'deny');
assert.equal(resolveWebRoute({ ...valid, workloadId: null }).kind, 'deny');
assert.equal(resolveWebRoute({ ...valid, targetPort: 0 }).kind, 'deny');
assert.equal(resolveWebRoute({ ...valid, healthPath: 'https://evil.example' }).kind, 'deny');
assert.equal(resolveWebRoute({ ...valid, domain: 'not a hostname' }).kind, 'deny');

const route = resolveWebRoute(valid);
assert.equal(route.kind, 'route');
if (route.kind === 'route') {
  assert.equal(route.plan.route.hostname, 'example.com');
  assert.equal(route.plan.route.targetKind, 'web');
  assert.equal(route.plan.route.tlsProfile, 'managed');
  assert.equal(route.plan.health.path, '/health');
}

console.log('edge resolver security tests passed');
