#!/usr/bin/env bash
# Prunes /tmp/download_zips. Any producer writing here (e.g. the
# storix-download-zip job, jobs/src/files/download_zip.rs) must lay files out
# in day/hour buckets (e.g. /tmp/download_zips/2026-08-30/14/<uuid>.zip); this
# script deletes any bucket whose hour has already passed, keeping only the
# current one intact in case something is writing to it right now.
#
# Meant to run every 4 hours via cron, e.g.:
#   0 */4 * * * /Users/dx3/Developer/storix/jobs/scripts/cleanup_download_zips.sh >> /Users/dx3/Library/Logs/BrookJobs/cleanup_download_zips.log 2>&1

set -euo pipefail

ROOT="/tmp/download_zips"

[ -d "$ROOT" ] || exit 0

# UTC, zero-padded, to match the "%Y-%m-%d"/"%H" bucket names written by the Rust job
current_bucket="$(date -u +%Y-%m-%d/%H)"

# walk every hour-level directory under $ROOT directly, regardless of which
# day folder it lives in, and drop it if its day/hour has already passed
while IFS= read -r hour_dir; do
  day="$(basename "$(dirname "$hour_dir")")"
  hour="$(basename "$hour_dir")"
  bucket="$day/$hour"

  if [[ "$bucket" < "$current_bucket" ]]; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) removing expired bucket $hour_dir"
    rm -rf "$hour_dir"
  fi
done < <(find "$ROOT" -mindepth 2 -maxdepth 2 -type d)

# drop any day folder left empty after its hours were removed
find "$ROOT" -mindepth 1 -maxdepth 1 -type d -empty -delete
