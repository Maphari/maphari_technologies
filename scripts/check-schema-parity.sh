#!/bin/bash
# Checks field-level parity for PublicApiProject, PublicApiKey, PublicApiKeyStatus
# between services/core/prisma/schema.prisma and services/public-api/prisma/schema.prisma.
# Cross-schema FK relations (e.g. to Client model) are excluded from comparison.
set -e
cd "$(dirname "$0")/.."

CORE="services/core/prisma/schema.prisma"
PUBLIC_API="services/public-api/prisma/schema.prisma"

extract_block() {
  local file="$1"
  local block="$2"
  awk -v start="^(model|enum) ${block} " '
    $0 ~ start { in_block=1; depth=0 }
    in_block {
      # Skip pure relation-only lines (no fields: clause) AND
      # skip relation lines pointing to the Client model (cross-schema FK)
      if ($0 ~ /@relation/) {
        if ($0 !~ /fields:/ || $0 ~ / Client /) {
          depth += gsub(/\{/, "{")
          depth -= gsub(/\}/, "}")
          if (depth == 0 && /\}/) { in_block=0 }
          next
        }
      }
      # Skip bare "client  Client" field references (FK back-ref without @relation)
      if ($0 ~ /^[[:space:]]+[a-zA-Z]+ +Client[[:space:]]/) {
        depth += gsub(/\{/, "{")
        depth -= gsub(/\}/, "}")
        if (depth == 0 && /\}/) { in_block=0 }
        next
      }
      # Normalize whitespace
      line = $0
      gsub(/\t/, " ", line)
      gsub(/ +/, " ", line)
      sub(/^ /, "", line)
      sub(/ $/, "", line)
      if (line != "") print line
      depth += gsub(/\{/, "{")
      depth -= gsub(/\}/, "}")
      if (depth == 0 && /\}/) { in_block=0 }
    }
  ' "$file"
}

FAIL=0

for BLOCK in PublicApiProject PublicApiKey PublicApiKeyStatus; do
  core_block="$(extract_block "$CORE" "$BLOCK")"
  pub_block="$(extract_block "$PUBLIC_API" "$BLOCK")"

  if [ -z "$core_block" ]; then
    echo "Schema parity FAILED: missing block '$BLOCK' in $CORE"
    FAIL=1
    continue
  fi
  if [ -z "$pub_block" ]; then
    echo "Schema parity FAILED: missing block '$BLOCK' in $PUBLIC_API"
    FAIL=1
    continue
  fi
  if [ "$core_block" != "$pub_block" ]; then
    echo "Schema parity FAILED: block mismatch for $BLOCK"
    diff -u <(printf "%s\n" "$core_block") <(printf "%s\n" "$pub_block") || true
    FAIL=1
  else
    echo "  OK: $BLOCK"
  fi
done

if [ "$FAIL" -eq 1 ]; then
  echo "Schema parity check FAILED"
  exit 1
fi

echo "Schema parity check OK (field-level)"
