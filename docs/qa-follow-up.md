# Local follow-up to the staging QA report

Source: **QA Report — Dlingo Staging**, 28 October 2026, audited commit `cfacd85`.
These fixes are prepared in the repository. They do not mark the live staging
issues resolved; deployment and staging verification are still required.

| Issue | Local change |
| --- | --- |
| QA-05 | Inactive users remain listed with a status badge. Only administrators can reactivate them, after confirming their current password. Reactivation rotates remember tokens and removes stale sessions. |
| QA-06 | Linked buyer names, emails and phone numbers are read-only in staff forms. Forged changes are rejected on the server. Addresses remain editable; ordinary contacts remain fully editable. |
| QA-07 | Product creation and updates require a price of at least Rp 1, including server validation and the form constraint. Existing staging products are not changed or deleted. |
| QA-13 | Production and staging share secure cookie, HTTPS URL, host validation, CSP and HSTS rules. Both forbid reference seeding and destructive database commands. |
| QA-14 | The reported PHP formatting failures are corrected. |
| QA-16 | Direct order links render a full page with navigation. AJAX dialog requests still receive a fragment, after the same ownership checks. |
| QA-17 | Failed logins are limited to 5 per account/IP and 20 per account across IPs over 15 minutes. Username and email aliases share counters. Successful login clears only its account/IP counter. |
| QA-18 | Activity timestamps respect the application locale; Carbon uses that locale by default. |
| QA-19 | The preview-only standalone Upload File shortcut and dialog are removed. Product-photo uploads and their previews remain supported. |
| QA-20 | The checkout verification banner appears only for unverified buyers, not staff. |
| QA-21 | Staff order and user tables become labeled cards below 640 px, retaining table semantics and showing every field without horizontal scrolling. Inline catalog/account links have larger touch targets. |
| QA-15 (optional) | The existing browser suite supports Chromium, Firefox and WebKit through `BROWSER_ENGINE`, without maintaining separate test copies. |
| QA-22 (optional) | New reference databases use the staff username `petani`. Existing local and staging accounts are not renamed; reference seeding still skips populated databases. |

## Interface and compatibility notes

- `POST /admin/users/{id}/reactivate` requires admin authorization, CSRF and
  `current_password`; it preserves roles, verification state and business records.
- Order detail URLs use `X-Requested-With: XMLHttpRequest` to request a dialog
  fragment. `X-Dlingo-Order: 1` is a **response** marker for those fragments;
  responses vary by `X-Requested-With`.
- No schema migration or staging data cleanup is needed for these code changes.
  Existing zero-priced products will require a positive price when edited.
- Default browser execution still uses `/usr/bin/chromium`; `CHROMIUM_PATH`
  remains compatible. Other engines require their matching Playwright browser
  installation. `BROWSER_EXECUTABLE_PATH` can select an explicit executable.

## Verification and remaining staging work

Local checks passed: **76 feature tests / 519 assertions**, all **12 browser
workflow groups** in Chromium, the Vite production build, and Pint.

Regression coverage includes reactivation authorization and session invalidation,
linked-buyer tampering, full-page and dialog order views, product price boundaries,
distributed login attempts and expiry, staging headers/cookies/hosts, localization,
staff banners, mobile card layouts, and the existing end-to-end buying/admin flows.
The browser suite is verified locally with Chromium; alternate engines require a
separate run on a machine with the matching browser installed.

QA-01, QA-02, QA-03, QA-04, QA-08, QA-09, QA-10, QA-11 and QA-12 remain staging
operations/configuration tasks: account password rotation, database grants,
working SMTP, atomic shared cache, scheduler, tested offsite backups, Apache upload
execution restrictions, banner suppression and log level. The original report
and live server were not modified.
