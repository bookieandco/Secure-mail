# Secure Mail

Secure, self-hosted mail platform with a least-privilege control plane around mature mail infrastructure.

## Status

MAIL-1 foundation. No production mail domain, credentials, or secrets are committed here.

## Architecture

- Docker Mailserver / Postfix / Dovecot for transport and mailbox protocols
- Rspamd for mail security and reputation signals
- ClamAV for malware scanning
- Dedicated control plane for domains, identities, policy, and reconciliation
- No Docker socket in the control plane
- No arbitrary shell execution
- Internal-only data services

## Security

See `SECURITY.md`. Production deployment is intentionally blocked until the MAIL-1 security gates pass.
