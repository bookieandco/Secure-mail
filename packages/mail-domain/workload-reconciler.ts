import type { WebWorkload, WorkloadNetworkPolicy } from '../mail-types/workload';
import type { EdgeRoutePlan } from '../mail-types/edge';

export type WorkloadPlanAction = 'CREATE_WORKLOAD' | 'UPDATE_WORKLOAD' | 'DELETE_WORKLOAD';

export interface WebWorkloadPlan {
  readonly action: WorkloadPlanAction;
  readonly workload: WebWorkload;
  readonly networkPolicy: WorkloadNetworkPolicy;
  readonly edgeRoute: EdgeRoutePlan | null;
}

export interface WorkloadBinding {
  readonly workload: WebWorkload;
  readonly hostname: string | null;
  readonly healthPath: string | null;
}

export function buildWorkloadPlan(
  action: WorkloadPlanAction,
  binding: WorkloadBinding,
): WebWorkloadPlan {
  const { workload, hostname, healthPath } = binding;

  if (workload.networkZone !== 'web') throw new Error('workload_must_be_web_zone');
  if (workload.listenPort < 1 || workload.listenPort > 65535) throw new Error('invalid_listen_port');
  if (workload.cpuLimitMillis < 1) throw new Error('invalid_cpu_limit');
  if (workload.memoryLimitMb < 16) throw new Error('invalid_memory_limit');
  if (workload.storageLimitMb < 1) throw new Error('invalid_storage_limit');

  const networkPolicy: WorkloadNetworkPolicy = {
    workloadId: workload.id,
    allowInternetEgress: false,
    allowedControlApi: true,
    allowedMailZone: false,
    allowedPrivateNetworks: false,
  };

  let edgeRoute: EdgeRoutePlan | null = null;
  if (hostname !== null) {
    if (!healthPath) throw new Error('health_path_required');
    edgeRoute = {
      route: {
        id: `web:${hostname.toLowerCase()}`,
        hostname: hostname.toLowerCase(),
        protocol: 'https',
        targetKind: 'web',
        workloadId: workload.id,
        targetPort: workload.listenPort,
        tlsProfile: 'managed',
        enabled: workload.state === 'ACTIVE',
      },
      health: {
        routeId: `web:${hostname.toLowerCase()}`,
        path: healthPath,
        intervalSeconds: 15,
        timeoutSeconds: 5,
        unhealthyThreshold: 3,
      },
    };
  }

  return { action, workload, networkPolicy, edgeRoute };
}
