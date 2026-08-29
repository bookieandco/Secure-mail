# Edge Gateway Contract

## Purpose

The web edge terminates HTTP(S) traffic and routes verified domains to isolated web workloads. It is not the SMTP/IMAP transport layer.

## Trust boundaries

- Web workloads MUST NOT access mailbox storage, DMS configuration, DKIM private keys, or mail credentials.
- The edge MUST NOT expose PostgreSQL, Redis, Rspamd administration, or internal mail ports.
- Mail protocols remain on dedicated TCP listeners and are not converted into HTTP routes.
- Domain ownership does not automatically authorize mail sending.

## Routing model

```text
Internet
  |
  v
Edge Gateway
  +--> HTTPS --> Web workload
  +--> HTTPS --> Control API
  +--> HTTPS --> Webmail

SMTP/IMAPS
  |
  v
Dedicated mail listeners --> Docker Mailserver
```

## Route requirements

Each route has:

- canonical hostname
- protocol
- target workload identifier
- target port
- TLS policy
- health-check policy
- request/rate policy
- enabled state

Routes are desired state. The control plane produces a validated route plan; an infrastructure adapter applies it.

## Security requirements

1. Default-deny routing.
2. No arbitrary upstream URLs supplied by untrusted callers.
3. Private/internal IP targets require explicit infrastructure authorization.
4. Hostname validation prevents ambiguous or wildcard abuse.
5. TLS certificates are never returned through the public control API.
6. Route changes are audited.
7. Unhealthy workloads are removed from active routing.
8. Web workloads cannot select mail-zone targets.

## Candidate implementation

Ferron is the primary candidate for the HTTP edge. `proxy.py`, Aleph, and Hummingbird remain evaluated components rather than mandatory runtime dependencies.

The implementation must preserve the contract even if the edge implementation changes.
