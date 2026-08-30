#!/usr/bin/env bash
# Prunes /tmp/download_zips, the storage used by the storix-download-zip job
# (jobs/src/files/download_zip.rs). Zips are written into day/hour buckets
# (e.g. /tmp/download_zips/2026-08-30/14/<uuid>.zip); this script deletes any
# bucket whose hour has already passed, keeping only the current one intact
# in case a job is writing to it right now.
#
# Meant to run every 4 hours via cron, e.g.:
#   0 */4 * * * /Users/dx3/Developer/storix/jobs/scripts/cleanup_download_zips.sh >> /Users/dx3/Library/Logs/BrookJobs/cleanup_download_zips.log 2>&1

set -euo pipefail

ROOT="/tmp/download_zips"

[ -d "$ROOT" ] || exit 0

# UTC, zero-padded, to match the "%Y-%m-%d"/"%H" bucket names written by the Rust job
current_bucket="$(date -u +%Y-%m-%d/%H)"

for day_dir in "$ROOT"/*/; do
  [ -d "$day_dir" ] || continue
  day="$(basename "$day_dir")"

  for hour_dir in "$day_dir"*/; do
    [ -d "$hour_dir" ] || continue
    hour="$(basename "$hour_dir")"
    bucket="$day/$hour"

    if [[ "$bucket" < "$current_bucket" ]]; then
      echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) removing expired bucket $hour_dir"
      rm -rf "$hour_dir"
    fi
  done

  # drop the day folder too once every hour inside it is gone
  rmdir "$day_dir" 2>/dev/null || true
done
