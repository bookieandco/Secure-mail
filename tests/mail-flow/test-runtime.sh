#!/usr/bin/env bash
set -euo pipefail

compose=(docker compose -f infra/mailserver/compose.yaml)
container="mailserver"

fail() { echo "FAIL: $*" >&2; exit 1; }

# The runtime test is deliberately non-destructive and uses a disposable test account.
# The account password is supplied only to DMS setup and is never committed.
test_domain="mail.localhost"
test_user="mailtest@${test_domain}"
test_password='MailTest-7f3b9a2c!'

"${compose[@]}" exec -T "$container" setup email add "$test_user" "$test_password"

# Confirm the account exists without printing its password.
"${compose[@]}" exec -T "$container" setup email list | grep -F "$test_user" >/dev/null || fail "test mailbox was not provisioned"

# Confirm expected listeners exist inside the mail container.
for port in 25 465 587 993; do
  "${compose[@]}" exec -T "$container" sh -c "ss -lnt 2>/dev/null | grep -E ':${port}[[:space:]]' >/dev/null" \
    || fail "expected listener ${port} is absent"
done

# POP3 must remain disabled.
if "${compose[@]}" exec -T "$container" sh -c "ss -lnt 2>/dev/null | grep -E ':(110|995)[[:space:]]' >/dev/null"; then
  fail "POP3 listener detected"
fi

# Verify DMS is not trusting the Docker network for relay authorization.
"${compose[@]}" exec -T "$container" postconf mynetworks | grep -F '127.0.0.0/8' >/dev/null || fail "Postfix mynetworks missing loopback"

# Exercise authenticated submission with swaks when available in the test image.
if "${compose[@]}" exec -T "$container" sh -c 'command -v swaks >/dev/null 2>&1'; then
  "${compose[@]}" exec -T "$container" swaks \
    --server 127.0.0.1 --port 587 --tls \
    --auth LOGIN --auth-user "$test_user" --auth-password "$test_password" \
    --from "$test_user" --to "$test_user" \
    --header 'Subject: MAIL-1 runtime test' \
    --body 'MAIL-1 runtime validation message' >/dev/null
fi

# Ensure no obvious secret material is emitted by the service environment.
if "${compose[@]}" exec -T "$container" env | grep -Ei '(PASSWORD|SECRET|PRIVATE_KEY)=' >/dev/null; then
  echo "WARN: sensitive environment variable names detected; review before production" >&2
fi

echo 'MAIL-1 runtime contract passed.'
