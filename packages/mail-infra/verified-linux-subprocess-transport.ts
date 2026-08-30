import { NativeSubprocessTransport } from './native-subprocess-transport';
import type { NativeProcessRequest, NativeProcessResult, NativeProcessTransport } from './native-process-runner';
import { assertIsolationVerified, type VerifiedLinuxLaunchPlan } from './linux-sandbox-enforcement';

export interface VerifiedLinuxSubprocessTransportFactory {
  create(plan: VerifiedLinuxLaunchPlan): NativeProcessTransport;
}

export class GatedLinuxSubprocessTransport implements NativeProcessTransport {
  private readonly delegate: NativeSubprocessTransport;

  constructor(plan: VerifiedLinuxLaunchPlan) {
    assertIsolationVerified(plan);
    this.delegate = new NativeSubprocessTransport({
      policy: {
        executable: plan.executable,
        allowedArguments: plan.args,
        cwd: plan.cwd,
        env: plan.env,
        timeoutMs: plan.timeoutMs,
        maxPayloadBytes: plan.maxPayloadBytes,
        network: plan.network,
        filesystem: plan.filesystem,
      },
    });
  }

  run<T, R>(request: NativeProcessRequest<T>): Promise<NativeProcessResult<R>> {
    return this.delegate.run(request);
  }
}
