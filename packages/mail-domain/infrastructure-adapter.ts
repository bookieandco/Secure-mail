import type { EdgeRoutePlan } from '../mail-types/edge';
import type { WebWorkloadPlan } from './workload-reconciler';

export type InfrastructureOperation =
  | { readonly kind: 'CREATE_WEB_WORKLOAD'; readonly plan: WebWorkloadPlan }
  | { readonly kind: 'UPDATE_WEB_WORKLOAD'; readonly plan: WebWorkloadPlan }
  | { readonly kind: 'DELETE_WEB_WORKLOAD'; readonly workloadId: string }
  | { readonly kind: 'ATTACH_EDGE_ROUTE'; readonly route: EdgeRoutePlan }
  | { readonly kind: 'DETACH_EDGE_ROUTE'; readonly routeId: string };

export interface InfrastructureAdapter {
  apply(operation: InfrastructureOperation): Promise<void>;
}

export function validateInfrastructureOperation(operation: InfrastructureOperation): void {
  switch (operation.kind) {
    case 'CREATE_WEB_WORKLOAD':
    case 'UPDATE_WEB_WORKLOAD':
      if (!operation.plan.workload.id) throw new Error('workload_id_required');
      if (!operation.plan.workload.image) throw new Error('workload_image_required');
      if (operation.plan.workload.networkZone !== 'web') throw new Error('invalid_workload_zone');
      return;
    case 'DELETE_WEB_WORKLOAD':
      if (!operation.workloadId) throw new Error('workload_id_required');
      return;
    case 'ATTACH_EDGE_ROUTE':
      if (operation.route.route.targetKind !== 'web') throw new Error('invalid_edge_target');
      if (!operation.route.route.workloadId) throw new Error('route_workload_required');
      return;
    case 'DETACH_EDGE_ROUTE':
      if (!operation.routeId) throw new Error('route_id_required');
      return;
    default: {
      const exhaustive: never = operation;
      return exhaustive;
    }
  }
}
