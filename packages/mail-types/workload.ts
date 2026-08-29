export type WorkloadState = 'PROVISIONING' | 'ACTIVE' | 'SUSPENDED' | 'DELETING' | 'DELETED';

export type WorkloadNetworkZone = 'web';

export interface WebWorkload {
  readonly id: string;
  readonly state: WorkloadState;
  readonly networkZone: WorkloadNetworkZone;
  readonly image: string;
  readonly listenPort: number;
  readonly cpuLimitMillis: number;
  readonly memoryLimitMb: number;
  readonly storageLimitMb: number;
}

export interface WorkloadNetworkPolicy {
  readonly workloadId: string;
  readonly allowInternetEgress: boolean;
  readonly allowedControlApi: boolean;
  readonly allowedMailZone: false;
  readonly allowedPrivateNetworks: false;
}

export type WorkloadPolicyDecision = 'ALLOW' | 'DENY';

export interface WorkloadPolicyInput {
  readonly workloadId: string;
  readonly destinationZone: 'internet' | 'control' | 'mail' | 'private';
  readonly port: number;
}
