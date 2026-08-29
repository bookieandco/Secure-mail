# Web Hosting Architecture

## Purpose

Secure Mail may host HTTP applications alongside the mail stack, but hosted applications are untrusted workloads and must not become a path into mail infrastructure.

## Boundary

```text
Internet
  |
  v
Edge Router
  |-- HTTP/HTTPS --> Web Workloads
  |
  |-- SMTP/SMTPS/Submission --> Mail Transport
  |
  `-- IMAPS --> Mail Access
```

The web layer and mail layer use separate trust zones.

## Required isolation

Hosted websites MUST NOT have direct access to:

- `/vmail` or mailbox storage
- Dovecot
- Postfix administration interfaces
- DKIM private keys
- TLS private keys used by mail services
- mail credentials
- PostgreSQL credentials
- Redis credentials
- the Docker socket

Web workloads receive only the network and filesystem resources required by the individual application.

## Edge routing

HTTP and HTTPS are terminated/routed independently from SMTP and IMAP. TCP mail protocols must not be proxied through an HTTP-only router.

Initial development binds services locally. Public exposure is a later deployment milestone after runtime security validation.

## Domain model

A future domain record may have independent bindings:

- `web`: zero or more HTTP applications
- `mail`: zero or more mailboxes/aliases
- `dns`: authoritative desired records
- `tls`: certificate state

A domain being valid for web hosting MUST NOT imply that it is authorized for mail sending.

## Deployment model

The first implementation supports isolated application containers. The control plane creates a typed deployment plan; it never accepts arbitrary Docker commands or arbitrary container arguments.

```text
Website request
    -> deployment policy
    -> typed deployment plan
    -> restricted executor
    -> isolated workload
```

The executor is not permitted to modify mail infrastructure configuration.

## Future capabilities

- static sites
- Next.js applications
- API workloads
- custom domains
- automatic TLS
- deployment health checks
- per-site resource limits
- per-site network policy
- deployment rollback

These are MAIL/WEB platform capabilities, not reasons to weaken the mail security boundary.
