import { strict as assert } from 'node:assert';
import { validateInfrastructureOperation } from '../../packages/mail-domain/infrastructure-adapter';

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

const plan = {
  action: 'CREATE_WORKLOAD' as const,
  workload,
  networkPolicy: {
    workloadId: 'site-1',
    allowInternetEgress: false,
    allowedControlApi: true,
    allowedMailZone: false as const,
    allowedPrivateNetworks: false as const,
  },
  edgeRoute: null,
};

assert.doesNotThrow(() => validateInfrastructureOperation({ kind: 'CREATE_WEB_WORKLOAD', plan }));
assert.doesNotThrow(() => validateInfrastructureOperation({ kind: 'DELETE_WEB_WORKLOAD', workloadId: 'site-1' }));
assert.throws(() => validateInfrastructureOperation({
  kind: 'ATTACH_EDGE_ROUTE',
  route: {
    route: {
      id: 'x', hostname: 'example.com', protocol: 'https', targetKind: 'control',
      workloadId: 'site-1', targetPort: 3000, tlsProfile: 'managed', enabled: true,
    },
    health: { routeId: 'x', path: '/health', intervalSeconds: 15, timeoutSeconds: 5, unhealthyThreshold: 3 },
  },
}), /invalid_edge_target/);

console.log('infrastructure adapter security tests passed');
