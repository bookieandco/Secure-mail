#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../../infra/mailserver"

command -v docker >/dev/null || { echo "docker is required" >&2; exit 2; }

docker compose config >/tmp/secure-mail-compose.yml

grep -q '127.0.0.1:2525:25' /tmp/secure-mail-compose.yml
grep -q '127.0.0.1:2465:465' /tmp/secure-mail-compose.yml
grep -q '127.0.0.1:2587:587' /tmp/secure-mail-compose.yml
grep -q '127.0.0.1:2993:993' /tmp/secure-mail-compose.yml

if grep -q '/var/run/docker.sock' /tmp/secure-mail-compose.yml; then
  echo 'FAIL: Docker socket mounted' >&2
  exit 1
fi

if grep -qE '^[[:space:]]*privileged:[[:space:]]*true' /tmp/secure-mail-compose.yml; then
  echo 'FAIL: privileged container configured' >&2
  exit 1
fi

echo 'MAIL-1.3 static security checks passed'
