#!/usr/bin/env bash
# Optional real-tool integration: Docker only, no ports/VPS/database changes.
# Downloads small official Nginx/Restic test images if absent; fixtures are temporary.
set -Eeuo pipefail
umask 077
project_root=$(cd "$(dirname "$0")/.." && pwd)
fixture=$(mktemp -d)
trap 'rm -rf -- "$fixture"' EXIT
mkdir -p "$fixture/app/public/storage/products" "$fixture/cache" "$fixture/source/uploads/products"
printf 'CREATE TABLE fixture(id INT);\n' > "$fixture/source/database.sql"
printf 'restore fixture\n' > "$fixture/source/uploads/products/photo.jpg"
printf 'local-fixture-password-only\n' > "$fixture/password"
openssl req -x509 -newkey rsa:2048 -nodes -keyout "$fixture/key.pem" -out "$fixture/cert.pem" -days 1 -subj /CN=jamurtani.test >/dev/null 2>&1
python3 - "$project_root" "$fixture" <<'PY'
from pathlib import Path
import sys
root, fixture = map(Path,sys.argv[1:])
s=(root/'deployment/nginx/jamurtani.conf').read_text()
for a,b in {'__DOMAIN__':'jamurtani.test','__APP_ROOT__':'/fixture/app','__TLS_CERT__':'/fixture/cert.pem','__TLS_KEY__':'/fixture/key.pem','__PHP_FPM_SOCKET__':'/tmp/php-test.sock'}.items(): s=s.replace(a,b)
(fixture/'site.conf').write_text(s)
(fixture/'nginx.conf').write_text('events {}\nhttp { include /etc/nginx/mime.types; include /fixture/site.conf; }\n')
PY
docker run --rm --network none -v "$fixture:/fixture:ro" nginx:1.28-alpine nginx -t -c /fixture/nginx.conf
restic_fixture() {
    docker run --rm --network none --user "$(id -u):$(id -g)" -e RESTIC_REPOSITORY=/fixture/repository -e RESTIC_PASSWORD_FILE=/fixture/password -e RESTIC_CACHE_DIR=/fixture/cache -v "$fixture:/fixture" restic/restic:0.19.1 "$@"
}
restic_fixture init
restic_fixture backup --stdin-from-command --stdin-filename jamurtani.tar --tag jamurtani --host fixture -- tar -C /fixture/source -cf - database.sql uploads
restic_fixture check --read-data
restic_fixture restore latest --target /fixture/restored --tag jamurtani --host fixture
python3 - "$fixture" <<'PY'
import sys,tarfile
from pathlib import Path
r=Path(sys.argv[1])
with tarfile.open(r/'restored/jamurtani.tar') as t:
    assert t.extractfile('database.sql').read()==(r/'source/database.sql').read_bytes()
    assert t.extractfile('uploads/products/photo.jpg').read()==b'restore fixture\n'
PY
# A failed producer must create no new snapshot.
restic_fixture snapshots --json > "$fixture/before.json"
if restic_fixture backup --stdin-from-command --stdin-filename jamurtani.tar --tag jamurtani --host fixture -- sh -c 'echo partial; exit 2'; then
    echo 'Failed archive producer was accepted.' >&2; exit 1
fi
restic_fixture snapshots --json > "$fixture/after.json"
cmp "$fixture/before.json" "$fixture/after.json"
restic_fixture forget --tag jamurtani --host fixture --group-by host,tags --keep-daily 7 --keep-weekly 4 --prune
printf 'PASS Nginx syntax, encrypted backup, repository integrity, byte-exact restore and failed-producer rejection.\n'
