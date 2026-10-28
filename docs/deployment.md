# VPS deployment and recovery

These files prepare deployment; they do not install software or change a live VPS. Inspect the existing web server, domains, firewall, Docker bindings and PHP-FPM version before applying them. Nginx is the supplied target; another server must provide equivalent behavior.

## Prepare the host and application

Use a maintained Linux release with Nginx, PHP 8.3+ and matching PHP-FPM/extensions, Composer, MariaDB client tools, restic 0.19.1+ (with `--stdin-from-command`), Bash and systemd. Build frontend assets from the lockfile (`npm ci && npm run build`) on a trusted build machine; Node/Vite are not production web servers. On the VPS install locked PHP packages with `composer install --no-dev --prefer-dist --optimize-autoloader` and verify `composer check-platform-reqs --no-dev`.

Deploy under `/srv/jamurtani`. Code/public build files belong to a deployment user and are read-only to the PHP-FPM account (normally www-data). Only `storage/` and `bootstrap/cache/` are writable by the web account. Keep `.env` owned by the deployment user, group www-data, mode 0640, outside `public/`. Never use 0777. Set PHP-FPM `expose_php=Off`, `upload_max_filesize=2M`, and `post_max_size=3M`, and `zend.exception_ignore_args=On`. Set `request_terminate_timeout=60s` in the application PHP-FPM pool so the backup job can drain in-flight writers within a known bound. Keep all logs inaccessible from the web.

Use `deployment/production.env.example` as a template. Supply the real domain, a stable private APP_KEY, SMTP credentials/sender and a runtime-only database account. SMTP settings must match the provider (the example uses implicit TLS on 465). Verify the provider's sender/DNS requirements and send/receive real verification and reset messages before launch. Do not use the log mailer publicly or deploy `public/hot`.

Keep Docker MariaDB published only on `127.0.0.1:3307` and its dedicated network; never expose 3306/3307 publicly. Create runtime and backup database accounts with private interactive input and different passwords; apply `deployment/database/runtime-grants.sql` after adapting the source host if needed. Use a separate account for migrations. The web runtime gets SELECT/INSERT/UPDATE/DELETE on the application database, no schema/grant/global privileges or test-database access.

For migrations, make a temporary `.env.migration` readable only by the deployment user (0600), using the same production settings but separate deployment DB credentials. Keep the site unavailable during migration and run with a fresh config-cache path so cached runtime credentials cannot override the CLI-only configuration:

```sh
migration_cache_dir=$(mktemp -d)
APP_CONFIG_CACHE="$migration_cache_dir/config.php" php artisan migrate --env=migration --force
rmdir "$migration_cache_dir"
```

Remove the private temporary migration environment after use. Never run migrate:fresh/db:wipe against application data. The forward security migrations add nullable verification metadata, hashed reset tokens and cache/lock tables; existing buyers must verify before their next checkout. Back up existing data first. Create the public-storage symlink with `php artisan storage:link`, then cache runtime configuration/routes/views using the runtime `.env`.

Create the owner with `php artisan security:create-admin` in a private interactive terminal. It has no default password or password arguments. Production reference seeding is blocked. Deactivate or change every existing reference password before launch; the readiness check rejects active accounts using the known reference password. Run `sudo -u www-data php artisan security:check` from the project directory and resolve every failure.

Schedule `php artisan schedule:run` every minute as the PHP-FPM user from the project directory. It runs `security:prune` daily to remove expired database counters/locks, reset tokens and sessions; live state is preserved. Monitor scheduler failures as well as application errors.

## HTTPS and Nginx

Point the domain at the VPS and keep tested SSH access while setting firewall rules. Public application traffic needs only ports 80/443; the database, PHP-FPM and Vite must stay private. Inspect existing sites first to avoid conflicting listeners or disrupting other applications.

Replace every `__PLACEHOLDER__` in the supplied configurations with actual paths/domain/socket. First install only `deployment/nginx/bootstrap-http.conf` to serve ACME challenges from `/var/www/letsencrypt`; it serves no application. Obtain a certificate with the host's ACME client, then replace that bootstrap site with `deployment/nginx/jamurtani.conf`, included inside Nginx's http context. Do not enable the TLS configuration before its certificate/key exist. Validate with `nginx -t` before reloading and test unattended certificate renewal.

The final site serves only `public/`, restricts PHP to the front controller, rejects unexpected hosts, blocks executable/hidden uploads, limits request bodies, and uses protected access logs without query/reset-token disclosure. Root-owned Nginx startup errors remain in the system service log; the per-site request error log is suppressed to avoid raw sensitive URLs. Monitor Laravel/PHP errors, redacted access statuses and service health instead. Configure rotation/retention of Nginx/PHP/system logs to 30 days; restrict log access. Preserve the same redaction if adding a proxy/CDN or request tracing.

Direct Nginx → PHP-FPM requires no TRUSTED_PROXIES entry. When a real reverse proxy is added, explicitly list only its addresses/CIDRs and preserve the genuine Host header. Never set `*` or an all-address network. Test `/admin/login`, customer signup, mail delivery, checkout restrictions, role/ownership denials, private cache headers and file serving over HTTPS before opening public access.

## Encrypted offsite backups

Install restic and initialize a dedicated offsite repository (for example SFTP on a different host). Keep the repository password in a password manager/offsite location as well as a root-owned 0600 password file. Losing this password makes restoration impossible. Verify SSH host keys before unattended SFTP use; do not disable host-key checking. Keep APP_KEY and deployment secrets in separate private recovery storage, not in Git.

Install `deployment/backup/backup.sh` as `/usr/local/libexec/jamurtani-backup`, root-owned and non-writable by the web account. Copy the backup environment and MariaDB credential examples into `/etc/jamurtani/`, replace placeholders, and make them/root-owned password file 0600. They must be owned by the service user. The backup DB account is separate from the runtime account. The service runs as root because it needs private backup credentials and controlled maintenance access to deployment-owned code; web users must not be able to edit that code or the job configuration.

Run the job manually once and inspect the offsite repository before installing/enabling the supplied systemd service/timer. The timer runs around 02:00 in the VPS timezone. Expect at least about a minute of maintenance plus the dump/copy time; do not overlap it with deployments, manual imports or other business-data writers. Each job enters maintenance and waits 65 seconds (longer than the required 60-second PHP-FPM request limit) for in-flight writers to drain, then takes a consistent database dump and upload copy, brings the site back online, then encrypts/streams a stable archive to restic. Failure cleanup restores service and removes private plaintext staging. Existing maintenance is left untouched; jobs cannot overlap. Retention runs only after a successful backup, retaining seven daily and four weekly restore points, followed by repository checks. Monitor the timer/service and failed or missing backups; automatic retention alone does not prove recoverability.

## Restore drill (isolated; run monthly and before launch)

Never restore a drill over the live database or uploads. Prepare a private scratch machine/directory and a new empty `dlingo_jamur_restore_check` database. Use a restoration account with privileges only on that scratch database. Configure the repository/password through private files, then:

```sh
restic snapshots --tag jamurtani --host jamurtani-production
restic check --read-data
restore_work=$(mktemp -d)
chmod 700 "$restore_work"
restic restore --tag jamurtani --host jamurtani-production latest --target "$restore_work"
tar -tf "$restore_work/jamurtani.tar"
```

Confirm the archive contains only `database.sql` and the `uploads/` tree; reject absolute paths, parent traversal and link/device entries before extracting into that private scratch directory. Import `database.sql` using the scratch-only MariaDB account and an explicit `dlingo_jamur_restore_check` connection. Revoke restored sessions/remember tokens and clear password-reset tokens/cache/locks in that scratch database before bringing a restored instance online. Use restored uploads with a separate, non-public staging app, and send mail only to a test sink.

Check record counts, historical order totals/statuses, referenced product images, login/roles, checkout and cancellation on the restored instance. Record the snapshot ID, duration, result and missing files without logging personal records or credentials. Remove the private drill artifacts/database after review. A real disaster recovery uses the same verified procedure, validated secrets, an explicit maintenance window and owner approval before replacing live data.
