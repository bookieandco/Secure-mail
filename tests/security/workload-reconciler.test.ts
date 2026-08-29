import { strict as assert } from 'node:assert';
import { buildWorkloadPlan } from '../../packages/mail-domain/workload-reconciler';

const workload = {
  id: 'site-1',
  state: 'ACTIVE' as const,
  networkZone: 'web' as const,
  image: 'site-image@sha256:example',
  listenPort: 3000,
  cpuLimitMillis: 500,
  memoryLimitMb: 256,
  storageLimitMb: 512,
};

const plan = buildWorkloadPlan('CREATE_WORKLOAD', {
  workload,
  hostname: 'example.com',
  healthPath: '/health',
});

assert.equal(plan.networkPolicy.allowInternetEgress, false);
assert.equal(plan.networkPolicy.allowedControlApi, true);
assert.equal(plan.networkPolicy.allowedMailZone, false);
assert.equal(plan.networkPolicy.allowedPrivateNetworks, false);
assert.equal(plan.edgeRoute?.route.workloadId, 'site-1');
assert.equal(plan.edgeRoute?.route.enabled, true);

assert.throws(() => buildWorkloadPlan('CREATE_WORKLOAD', {
  workload: { ...workload, networkZone: 'web' as const, listenPort: 0 },
  hostname: null,
  healthPath: null,
}), /invalid_listen_port/);

assert.throws(() => buildWorkloadPlan('CREATE_WORKLOAD', {
  workload: { ...workload, memoryLimitMb: 8 },
  hostname: null,
  healthPath: null,
}), /invalid_memory_limit/);

assert.throws(() => buildWorkloadPlan('CREATE_WORKLOAD', {
  workload,
  hostname: 'example.com',
  healthPath: null,
}), /health_path_required/);

console.log('workload reconciler security tests passed');
