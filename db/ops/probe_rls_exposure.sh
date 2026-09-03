#!/usr/bin/env bash
# ============================================================================
# LIVE RLS EXPOSURE PROBE  (READ-ONLY)
# ============================================================================
# Empirically tests what the PUBLIC anon key can read from your Supabase DB.
# Makes GET requests only — never writes. Run from any machine with internet
# (Git Bash on Windows works). It answers the one question the SQL audit can't
# prove from outside: "can an anonymous internet user actually read this table?"
#
# The Supabase anon key is public BY DESIGN (it ships in the frontend and is
# protected by RLS) — using it here is not a leak. This is NOT the Flutterwave
# key; that one still needs rotating.
#
# Usage:  bash scripts/probe_rls_exposure.sh
# ============================================================================
set -u

URL="https://hwwzbsppzwcyvambeade.supabase.co"
ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3d3pic3BwendjeXZhbWJlYWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NjgyOTYsImV4cCI6MjA4MjM0NDI5Nn0.Cwsvgq1qJ7fAfxT2opSfmnJkShy8F6lcRa4xXLdAbnc"

TABLES="users payments transactions wallets spray_money tickets bookings ticket_scans notifications interaction_logs memberships membership_payments secret_events otp_codes password_reset_tokens"

printf "%-24s | %-4s | %s\n" "TABLE" "HTTP" "ANON-VISIBLE ROWS / RESULT"
printf -- "-------------------------|------|--------------------------------------\n"
for t in $TABLES; do
  # -D - dumps response headers; Range 0-0 + count=exact yields Content-Range: 0-0/<total>
  hdrs=$(curl -s -m 15 -D - -o /dev/null \
    -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
    -H "Prefer: count=exact" -H "Range: 0-0" \
    "$URL/rest/v1/$t?select=id&limit=1")
  code=$(printf "%s" "$hdrs" | awk 'toupper($1) ~ /^HTTP/ {c=$2} END{print c}')
  total=$(printf "%s" "$hdrs" | awk 'tolower($1) ~ /^content-range:/ {split($2,a,"/"); t=a[2]} END{print t}')
  if [ "${code:-}" = "200" ]; then
    if [ -n "${total:-}" ] && [ "$total" != "*" ] && [ "$total" -gt 0 ] 2>/dev/null; then
      verdict="🔴 EXPOSED — $total rows readable by anonymous users"
    else
      verdict="🟢 protected or empty (0 rows visible to anon)"
    fi
  elif [ "${code:-}" = "404" ]; then
    verdict="— table not found / not API-exposed"
  else
    verdict="— HTTP ${code:-ERR} (see manually)"
  fi
  printf "%-24s | %-4s | %s\n" "$t" "${code:-ERR}" "$verdict"
done

echo ""
echo "Any 🔴 line = that table is readable by anyone on the internet with the"
echo "public anon key. Fix by enabling RLS + adding correct policies (or run"
echo "scripts/audit_rls_status.sql in the Supabase SQL Editor for the full map)."
