# MAIL-1.3 Runtime Validation

This suite is intentionally local-only. Do not expose SMTP/IMAPS ports publicly while these tests are being developed.

## Preconditions

- Docker Engine + Compose v2
- DMS image pinned to `ghcr.io/docker-mailserver/docker-mailserver:v15.1.0`
- `MAILSERVER_HOSTNAME` set to a local test FQDN
- No production domain, credentials, DKIM keys, or certificates

## Gate

- [ ] `docker compose config` succeeds
- [ ] container starts without privileged mode
- [ ] no Docker socket is mounted
- [ ] only loopback host ports are published
- [ ] SMTP listener is reachable on localhost test port
- [ ] IMAPS listener is reachable on localhost test port
- [ ] POP3 is not listening
- [ ] mailbox can be provisioned with DMS `setup`
- [ ] authenticated SMTP submission succeeds with a disposable account
- [ ] invalid SMTP credentials fail
- [ ] mailbox is retrievable over IMAPS
- [ ] unauthorized sender is rejected when spoof protection applies
- [ ] Rspamd is active
- [ ] ClamAV is active
- [ ] DKIM signing/verification path is present
- [ ] DMARC processing path is present
- [ ] no management/data service is publicly reachable
- [ ] restart preserves mailbox state
- [ ] logs contain no plaintext password or private key
- [ ] outbound emergency-stop contract is represented before public exposure

## Evidence policy

Every checked item must have command output or an automated test result attached to the CI run. A passing container healthcheck alone is not sufficient evidence of mail-flow correctness.

## Security stop conditions

Stop MAIL-1 immediately if any of the following is observed:

1. public network binding of a mail or management port;
2. Docker socket access;
3. privileged container execution;
4. plaintext credential/private-key logging;
5. unauthenticated outbound relay;
6. mailbox data accessible from the control-plane container.
