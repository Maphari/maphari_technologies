#!/bin/bash
set -e

# Anchor to repo root regardless of where the script is invoked from
cd "$(dirname "$0")/.."

echo "Checking for static CSP reintroduction in next.config.ts..."

if grep -n "Content-Security-Policy" apps/web/next.config.ts >/dev/null 2>&1; then
  echo "FAIL: static Content-Security-Policy header found in apps/web/next.config.ts"
  echo "CSP is now managed by proxy.ts — do not re-add it to next.config.ts"
  exit 1
fi

echo "Static CSP check OK"

echo "Running deterministic CSP production test..."
pnpm --filter @maphari/web exec vitest run src/proxy.csp.test.ts
echo "CSP test OK"
