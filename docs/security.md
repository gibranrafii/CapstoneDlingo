# Security model and verification

JamurTani is one server-rendered Laravel application with database sessions. It has no public token API and does not use JWT. MariaDB stores one shared farm: authorized petani/admin share farm data, while buyers can access only their own linked orders, cart and profile. Application authorization and database least privilege enforce this; there is no database-enforced per-buyer row policy.

## Portals and account lifecycle

Customers use `/login` and `/register`; staff use `/admin/login` and `/admin`. Staff CRUD, profile and order detail endpoints live under `/admin`. Only administrators manage accounts and shared bank settings, with their current password required on each mutation. Customer registration cannot choose a staff role. Old staff GET bookmarks redirect after authorization; old POST/PUT/DELETE URLs do not replay writes.

One browser session holds one account. Authentication regenerates session IDs, restricts intended destinations to the proper portal and configured origin, and uses Laravel's encrypted HttpOnly cookie. Production forces Secure, host-only, SameSite=Lax cookies and disables debug output. Staff remember-me is disabled and staff expire after 30 minutes without activity; buyer sessions default to 120 minutes. Password changes/reset, email changes, role changes and deactivation revoke other affected sessions/remember tokens. Passwords remain bcrypt; new passwords require 12 characters and at most 72 bytes, avoiding silent bcrypt truncation. Existing shorter passwords still authenticate so owners can change them.

New registrations receive signed, expiring verification links. Existing database accounts remain unverified after migration; they are not silently trusted. Buyers can browse and fill carts before verification, but must verify before checkout. Email changes require the account's password, clear verification and send a new link. Reset requests give the same response for unknown/inactive accounts. Reset tokens are hashed, expire after 60 minutes and are removed after use. Database locking makes consumption single-use even for simultaneous reset submissions. Mail delivery failures do not delete newly registered accounts; owners can resend later. SMTP must work before public launch. Two-factor authentication is deferred.

## Abuse, browser and data protections

`config/security.php` defines initial limits: login submissions 30/minute/IP across portals; failures 5/minute/normalized identity+IP; registration and recovery each 10/hour/IP; verification resend 3/minute and 10/hour/account; checkout 5/minute/buyer; cart changes 30/minute/buyer; other writes 60/minute/account; public catalog/detail 120/minute/IP; photo uploads 10/minute/staff. Throttled responses contain Retry-After. Counters are environment-scoped; production uses database cache tables (or a configured Redis store) rather than per-process memory or local-file counters. Nginx adds an application-request burst limit; these controls are not a network-level DDoS service.

Only explicitly configured proxy addresses affect client IP/scheme. The application accepts the configured hostname; local/test environments additionally accept loopback names. Production URL generation uses APP_URL. CSRF, server-side validation, escaped Blade output, per-order ownership checks and current server prices remain mandatory. Order transactions/row locks protect stock and cancellation. Uploaded photos must be JPEG/PNG/WebP, at most 2 MB and 4096×4096 pixels; uploads cannot execute in the supplied Nginx configuration.

Responses use CSP, frame restrictions, MIME-sniffing protection, referrer policy and disabled camera/microphone/geolocation permissions. Production CSP forbids inline scripts/styles. Development HMR allowances exist only with a local Vite marker outside production. Account pages and authenticated responses are not cached; recovery/verification pages send no referrer. HSTS is HTTPS/production-only without preload/subdomain assumptions.

Security events go to restricted daily `storage/logs/security-*.log` files, retained for 30 days. Events include authentication, denials, throttling, account changes, expiry, bank updates and mail failures. Metadata is allowlisted; passwords, tokens, cookies, full URLs, email addresses and request bodies are excluded. These logs are not shown in the application's activity dialog and are not claimed to be tamper-proof. Monitor failures to write this log through the protected PHP error log. Nginx access logging omits queries and redacts reset-link paths.

## Checks

Run test commands sequentially; they share `dlingo_jamur_test`:

```sh
php tests/prepare-database.php
php artisan test
php tests/concurrency.php
php tests/reset-concurrency.php
npm run build
npm run test:browser
python3 tests/deployment.py
# Optional Docker-only Nginx/Restic integration (downloads official test images):
./tests/deployment-container.sh
composer audit
npm audit
```

Feature tests cover portal/role/record access, safe redirects, session expiry/revocation, reauthentication, password byte limits, verification/reset tampering/expiry/reuse, SMTP failure, host/proxy forgery, rate limits, cookie/header settings and upload rejection. Browser checks exercise real HTTP/CSRF, CSP, mobile layouts, verification and recovery. Operational tests cover backup failure cleanup and retention guards with fixtures; they do not substitute for a real offsite restore.

Run `php artisan security:check` as the PHP-FPM user on the configured production host. It is read-only and deliberately fails on local/demo defaults. It checks effective settings, writable paths, runtime grants, schema support and active reference passwords without displaying secrets. Also verify real TLS renewal, SMTP delivery, offsite restoration and server permissions. No automated audit establishes that every vulnerability has been found.
