import type { WorkloadNetworkPolicy, WorkloadPolicyDecision, WorkloadPolicyInput } from '../mail-types/workload';

export function resolveWorkloadPolicy(
  policy: WorkloadNetworkPolicy,
  input: WorkloadPolicyInput,
): WorkloadPolicyDecision {
  if (input.workloadId !== policy.workloadId) return 'DENY';
  if (input.port < 1 || input.port > 65535) return 'DENY';

  switch (input.destinationZone) {
    case 'internet':
      return policy.allowInternetEgress ? 'ALLOW' : 'DENY';
    case 'control':
      return policy.allowedControlApi ? 'ALLOW' : 'DENY';
    case 'mail':
      return 'DENY';
    case 'private':
      return 'DENY';
    default:
      return 'DENY';
  }
}
