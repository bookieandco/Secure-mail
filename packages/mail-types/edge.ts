export type EdgeProtocol = 'https';

export type EdgeTargetKind = 'web' | 'control' | 'webmail';

export interface EdgeRoute {
  readonly id: string;
  readonly hostname: string;
  readonly protocol: EdgeProtocol;
  readonly targetKind: EdgeTargetKind;
  readonly workloadId: string;
  readonly targetPort: number;
  readonly tlsProfile: 'managed';
  readonly enabled: boolean;
}

export interface EdgeHealthPolicy {
  readonly routeId: string;
  readonly path: string;
  readonly intervalSeconds: number;
  readonly timeoutSeconds: number;
  readonly unhealthyThreshold: number;
}

export interface EdgeRoutePlan {
  readonly route: EdgeRoute;
  readonly health: EdgeHealthPolicy;
}

export type EdgePlanAction =
  | 'CREATE_ROUTE'
  | 'UPDATE_ROUTE'
  | 'DELETE_ROUTE'
  | 'ENABLE_ROUTE'
  | 'DISABLE_ROUTE';

export interface EdgeReconcileAction {
  readonly action: EdgePlanAction;
  readonly routeId: string;
  readonly plan?: EdgeRoutePlan;
}
