# Native sandbox helper

This directory is the OS-facing implementation boundary for NATIVE-0.7S.

## Contract

The helper must accept only the already-authenticated, bounded `prepare` protocol produced by `native-sandbox-helper-client.ts`.

Before admitting a target process it MUST establish, and independently verify:

1. cgroup v2 CPU, memory, and PID limits;
2. filesystem isolation;
3. network denial;
4. a mandatory seccomp filter;
5. process identity/ownership constraints appropriate to the deployment.

Failure of any control MUST terminate the request without admitting the target.

## Implementation rule

The helper must not provide a general command-execution API. It is a narrow sandbox setup primitive. The TypeScript dispatcher remains responsible for protocol authentication and policy authorization; the native helper is responsible for kernel-facing enforcement and verification.

A production implementation should be built and tested as a small native executable (Rust or C) and invoked only through the existing Unix-domain-socket protocol. Do not mark `enforcementVerified` based on binary presence alone.

## Current status

The repository currently contains the TypeScript contracts and fail-closed adapters. This directory intentionally does not claim that kernel enforcement is production-ready until a native implementation and Linux integration tests verify it on supported kernels.
