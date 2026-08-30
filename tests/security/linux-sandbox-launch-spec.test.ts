import { strict as assert } from 'node:assert';
import { createLinuxSandboxLaunchPlan } from '../../packages/mail-infra/linux-sandbox-launch-spec';

const plan = createLinuxSandboxLaunchPlan({ executable: '/usr/local/bin/native-worker', args: ['--stdio'], cwd: '/var/empty', env: { PATH: '/usr/bin' }, timeoutMs: 1000, maxPayloadBytes: 1024, network: 'DENY', filesystem: 'WORKDIR_ONLY' }, { cpuMs: 1000, memoryBytes: 16 * 1024 * 1024, pids: 16 });
assert.equal(plan.isolation.seccomp, 'REQUIRED');
assert.deepEqual(plan.isolation.namespaces, ['mount', 'pid', 'network', 'ipc', 'uts', 'user']);
assert.equal(plan.isolation.network, 'DENY');
assert.equal(plan.isolation.resourceLimits.pids, 16);
assert.throws(() => createLinuxSandboxLaunchPlan({ executable: '/bin/x', args: [], cwd: '/', env: {}, timeoutMs: 1, maxPayloadBytes: 1, network: 'ALLOW', filesystem: 'READ_ONLY' }, { cpuMs: 1, memoryBytes: 4096, pids: 1 }), /network_required/);
assert.throws(() => createLinuxSandboxLaunchPlan({ executable: '/bin/x', args: [], cwd: '/', env: {}, timeoutMs: 1, maxPayloadBytes: 1, network: 'DENY', filesystem: 'READ_ONLY' }, { cpuMs: 0, memoryBytes: 4096, pids: 1 }), /cpu_limit_invalid/);
console.log('Linux sandbox launch spec tests passed');
