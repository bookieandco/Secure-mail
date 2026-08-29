# Trust Zones

## Zones

1. `edge` — public protocol entry points.
2. `web` — untrusted hosted applications.
3. `mail` — Postfix/Dovecot transport and mailbox access.
4. `security` — Rspamd/ClamAV and mail inspection.
5. `control` — typed management API and reconciliation logic.
6. `data` — persistent application data and secrets.

## Non-negotiable flows

```text
Internet -> edge -> web
Internet -> edge -> mail
control -> typed mail reconciler -> mail
mail -> security
control -> data
```

## Forbidden flows

```text
web -> mail storage
web -> Docker socket
web -> DKIM private keys
web -> mail credentials
AI -> Docker socket
AI -> mail storage
Internet -> database
Internet -> Redis
Internet -> Rspamd administration
```

A website deployment is never granted access to a mail credential merely because both services belong to the same domain.

## Principle

Shared physical infrastructure does not imply shared trust. Compromise of a hosted website must not provide a path to mailbox data or mail administration.
