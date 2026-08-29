# Security Policy

## Scope

This repository contains infrastructure for a self-hosted mail platform. Security boundaries are part of the architecture, not optional deployment guidance.

## Non-negotiable rules

1. Never commit credentials, private keys, tokens, mailbox passwords, or production configuration secrets.
2. The control plane must never require `/var/run/docker.sock`.
3. The control plane must not execute arbitrary shell commands.
4. Database and Redis services remain private/internal.
5. Mailbox storage must not be mounted into public web/API or AI workers.
6. Production container images must be pinned to immutable digests.
7. Production releases require dependency scanning, secret scanning, vulnerability scanning, and an SBOM.
8. Mailbox passwords are stored only as password verifiers; plaintext passwords are never persisted.
9. DKIM and TLS private keys receive stricter access controls than ordinary configuration.
10. Outbound mail must support account, domain, and global emergency suspension without destroying inbound mail.
11. Administrative actions and security decisions are auditable without retaining message bodies unnecessarily.
12. AI/LLM components receive no direct filesystem, Docker, Postfix, Dovecot, or database authority.

## Deployment safety

The initial MAIL-1 environment is isolated and must not expose SMTP port 25 publicly until the mail-flow and security acceptance tests pass.

## Reporting

Do not disclose suspected vulnerabilities publicly before coordinated remediation. Open a private security report through the repository's GitHub security reporting mechanism when available.
