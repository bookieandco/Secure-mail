import type { EdgeHealthPolicy, EdgeRoutePlan } from '../mail-types/edge';

export interface DomainBinding {
  readonly domain: string;
  readonly webEnabled: boolean;
  readonly ownershipVerified: boolean;
  readonly workloadId: string | null;
  readonly targetPort: number | null;
  readonly healthPath: string | null;
}

export type EdgeResolution =
  | { readonly kind: 'route'; readonly plan: EdgeRoutePlan }
  | { readonly kind: 'deny'; readonly reason: string };

const HOSTNAME = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export function resolveWebRoute(binding: DomainBinding): EdgeResolution {
  const domain = binding.domain.trim().toLowerCase();

  if (!HOSTNAME.test(domain)) return { kind: 'deny', reason: 'invalid_domain' };
  if (!binding.ownershipVerified) return { kind: 'deny', reason: 'ownership_not_verified' };
  if (!binding.webEnabled) return { kind: 'deny', reason: 'web_disabled' };
  if (!binding.workloadId) return { kind: 'deny', reason: 'workload_missing' };
  if (!binding.targetPort || binding.targetPort < 1 || binding.targetPort > 65535) {
    return { kind: 'deny', reason: 'invalid_target_port' };
  }
  if (!binding.healthPath || !binding.healthPath.startsWith('/') || binding.healthPath.includes('://')) {
    return { kind: 'deny', reason: 'invalid_health_path' };
  }

  const routeId = `web:${domain}`;
  const health: EdgeHealthPolicy = {
    routeId,
    path: binding.healthPath,
    intervalSeconds: 15,
    timeoutSeconds: 5,
    unhealthyThreshold: 3,
  };

  return {
    kind: 'route',
    plan: {
      route: {
        id: routeId,
        hostname: domain,
        protocol: 'https',
        targetKind: 'web',
        workloadId: binding.workloadId,
        targetPort: binding.targetPort,
        tlsProfile: 'managed',
        enabled: true,
      },
      health,
    },
  };
}
