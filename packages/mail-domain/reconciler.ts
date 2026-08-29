import type { DmsProjection } from "./resolver";

export type ReconcileAction =
  | { type: "CREATE_ACCOUNT"; address: string; passwordHash: string }
  | { type: "DELETE_ACCOUNT"; address: string };

export type ReconcilePlan = {
  actions: ReconcileAction[];
};

/**
 * Produces a plan only. Applying the plan is deliberately outside this package.
 * This keeps Docker/DMS execution behind a future privileged adapter.
 */
export function buildReconcilePlan(
  desired: DmsProjection,
  actual: DmsProjection,
): ReconcilePlan {
  const desiredByAddress = new Map(desired.accounts.map((a) => [a.address, a]));
  const actualByAddress = new Map(actual.accounts.map((a) => [a.address, a]));
  const actions: ReconcileAction[] = [];

  for (const [address, account] of desiredByAddress) {
    if (!actualByAddress.has(address)) {
      actions.push({ type: "CREATE_ACCOUNT", address, passwordHash: account.passwordHash });
    }
  }

  for (const address of actualByAddress.keys()) {
    if (!desiredByAddress.has(address)) {
      actions.push({ type: "DELETE_ACCOUNT", address });
    }
  }

  return { actions };
}
