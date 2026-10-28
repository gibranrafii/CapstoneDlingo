#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
config_file="${JAMURTANI_BACKUP_CONFIG:-/etc/jamurtani/backup.env}"
private_file() {
    [[ -f "$1" && ! -L "$1" && "$(stat -c %a "$1")" == 600 && "$(stat -c %u "$1")" == "$(id -u)" ]] || {
        echo 'Backup configuration/credential files must be owned by the job user, regular files, mode 0600.' >&2; exit 1;
    }
}
private_file "$config_file"
# This is trusted, root-owned shell configuration; never source application input.
set -a
source "$config_file"
set +a
: "${APP_ROOT:?}" "${PHP_BIN:?}" "${DB_BACKUP_CNF:?}" "${DB_DATABASE:?}" "${RESTIC_REPOSITORY:?}" "${RESTIC_PASSWORD_FILE:?}" "${BACKUP_HOST:?}"
[[ "$APP_ROOT" == /* && -f "$APP_ROOT/artisan" && -d "$APP_ROOT/storage/app/public" && "$DB_DATABASE" =~ ^[a-zA-Z0-9_]+$ ]] || exit 1
[[ "$RESTIC_REPOSITORY" != *'__'* ]] || { echo 'Configure an initialized offsite repository first.' >&2; exit 1; }
private_file "$DB_BACKUP_CNF"
private_file "$RESTIC_PASSWORD_FILE"
command -v mariadb-dump >/dev/null
command -v restic >/dev/null
case "$(restic backup --help)" in
    *--stdin-from-command*) ;;
    *) echo 'Install restic 0.19.1+ with --stdin-from-command support.' >&2; exit 1;;
esac
command -v flock >/dev/null
# A stable lock prevents overlapping backup jobs on this machine.
exec 9>"$(dirname "$config_file")/backup.lock"
flock -n 9 || { echo 'Another backup is running.' >&2; exit 1; }
[[ ! -e "$APP_ROOT/storage/framework/down" ]] || { echo 'Application already in maintenance; leaving it unchanged.' >&2; exit 1; }
backup_work=$(mktemp -d)
entered_maintenance=false
cleanup() {
    local status=$?
    trap - EXIT
    if [[ "$entered_maintenance" == true ]]; then
        (cd "$APP_ROOT" && "$PHP_BIN" artisan up) || { echo 'CRITICAL: could not leave maintenance mode.' >&2; status=1; }
    fi
    rm -rf -- "$backup_work"
    exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
# Short maintenance window ensures the SQL snapshot and uploaded files agree.
entered_maintenance=true
(cd "$APP_ROOT" && "$PHP_BIN" artisan down --retry=60)
# Maintenance rejects new requests but does not stop existing writers. The VPS
# pool must enforce request_terminate_timeout=60s; wait beyond that bound.
drain_seconds="${BACKUP_DRAIN_SECONDS:-65}"
[[ "$drain_seconds" =~ ^[0-9]+$ ]] || { echo 'Invalid drain interval.' >&2; exit 1; }
sleep "$drain_seconds"
mariadb-dump --defaults-extra-file="$DB_BACKUP_CNF" --single-transaction --quick --skip-lock-tables --hex-blob "$DB_DATABASE" > "$backup_work/database.sql"
[[ -s "$backup_work/database.sql" ]] || { echo 'Database dump was empty.' >&2; exit 1; }
cp -a -- "$APP_ROOT/storage/app/public" "$backup_work/uploads"
(cd "$APP_ROOT" && "$PHP_BIN" artisan up)
entered_maintenance=false
# Stable stdin path and explicit grouping prevent temporary directory names from
# breaking retention. Restic must observe archive-command failure and never
# create a successful-looking snapshot from a failed producer.
restic backup --stdin-from-command --stdin-filename jamurtani.tar --tag jamurtani --host "$BACKUP_HOST" -- tar -C "$backup_work" -cf - database.sql uploads
restic forget --tag jamurtani --host "$BACKUP_HOST" --group-by host,tags --keep-daily 7 --keep-weekly 4 --prune
restic check
