"""Operational backup failure-path tests; no live database, service or repository."""
import io
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class BackupTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='jamurtani-backup-test-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.app = self.root / 'app'
        (self.app / 'storage/app/public/products').mkdir(parents=True)
        (self.app / 'storage/framework').mkdir()
        (self.app / 'artisan').touch()
        (self.app / 'storage/app/public/products/photo.jpg').write_bytes(b'fixture photo')
        self.bin = self.root / 'bin'
        self.bin.mkdir()
        self.work = self.root / 'work'
        self.work.mkdir()
        self.events = self.root / 'events'
        self.archive = self.root / 'archive.tar'
        self.command('php', '''case "$2" in
 down) touch storage/framework/down; echo down >> "$TEST_EVENTS";;
 up) rm -f storage/framework/down; echo up >> "$TEST_EVENTS";;
esac''')
        self.command('mariadb-dump', '''[[ "${TEST_DUMP_FAIL:-0}" != 1 ]] || exit 2
printf 'CREATE TABLE fixture(id INT);\nINSERT INTO fixture VALUES (1);\n' ''')
        self.command('restic', '''if [[ "${2:-}" == --help ]]; then echo --stdin-from-command; exit 0; fi
echo "$1" >> "$TEST_EVENTS"
if [[ "$1" == backup ]]; then while [[ "$1" != -- ]]; do shift; done; shift; "$@" > "$TEST_ARCHIVE"; [[ "${TEST_RESTIC_FAIL:-0}" != 1 ]] || exit 2; fi''')
        self.credentials = self.root / 'database.cnf'
        self.password = self.root / 'restic-password'
        for path in [self.credentials, self.password]:
            path.write_text('private-test-value\n')
            path.chmod(0o600)
        self.config = self.root / 'backup.env'
        self.config.write_text('\n'.join([
            f'APP_ROOT={self.app}', f'PHP_BIN={self.bin / "php"}',
            f'DB_BACKUP_CNF={self.credentials}', 'DB_DATABASE=dlingo_jamur_test',
            f'RESTIC_REPOSITORY={self.root / "repository"}',
            f'RESTIC_PASSWORD_FILE={self.password}', 'BACKUP_HOST=test', 'BACKUP_DRAIN_SECONDS=0',
        ]) + '\n')
        self.config.chmod(0o600)

    def command(self, name, body):
        path = self.bin / name
        path.write_text('#!/usr/bin/env bash\nset -e\n' + body + '\n')
        path.chmod(0o700)

    def run_job(self, **extra):
        env = dict(os.environ, PATH=str(self.bin) + os.pathsep + os.environ['PATH'],
                   JAMURTANI_BACKUP_CONFIG=str(self.config), TEST_EVENTS=str(self.events),
                   TEST_ARCHIVE=str(self.archive), TMPDIR=str(self.work), **extra)
        return subprocess.run(['bash', str(ROOT / 'deployment/backup/backup.sh')], env=env,
                              text=True, capture_output=True)

    def test_success_captures_database_and_uploads_and_applies_retention(self):
        result = self.run_job()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.events.read_text().splitlines(), ['down', 'up', 'backup', 'forget', 'check'])
        with tarfile.open(fileobj=io.BytesIO(self.archive.read_bytes())) as archive:
            self.assertIn('database.sql', archive.getnames())
            self.assertEqual(archive.extractfile('uploads/products/photo.jpg').read(), b'fixture photo')
        self.assertEqual(list(self.work.iterdir()), [])

    def test_dump_failure_restores_service_and_never_prunes_backups(self):
        result = self.run_job(TEST_DUMP_FAIL='1')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.events.read_text().splitlines(), ['down', 'up'])
        self.assertFalse((self.app / 'storage/framework/down').exists())
        self.assertEqual(list(self.work.iterdir()), [])

    def test_failed_backup_never_runs_retention(self):
        result = self.run_job(TEST_RESTIC_FAIL='1')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.events.read_text().splitlines(), ['down', 'up', 'backup'])
        self.assertEqual(list(self.work.iterdir()), [])

    def test_existing_maintenance_is_preserved(self):
        marker = self.app / 'storage/framework/down'
        marker.touch()
        self.assertNotEqual(self.run_job().returncode, 0)
        self.assertTrue(marker.exists())
        self.assertFalse(self.events.exists())

    def test_readable_credentials_are_rejected_before_any_action(self):
        self.credentials.chmod(0o644)
        self.assertNotEqual(self.run_job().returncode, 0)
        self.assertFalse(self.events.exists())


if __name__ == '__main__':
    unittest.main()
