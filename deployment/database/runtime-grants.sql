-- Create accounts with private interactive input before running these grants.
-- Use separate strong passwords and never grant the web account schema/GRANT privileges.
-- '%' supports host-to-Docker connections; keep the port published on 127.0.0.1 only
-- and the database on a dedicated Docker network. Narrow the source host if available.
GRANT SELECT, INSERT, UPDATE, DELETE ON `dlingo\_jamur`.* TO 'jamurtani_runtime'@'%';
GRANT SELECT, SHOW VIEW, TRIGGER ON `dlingo\_jamur`.* TO 'jamurtani_backup'@'%';
-- The escaped underscore is literal; unescaped database grant names are wildcard patterns.
-- Run migrations with a separate deployment account. Do not save its password in
-- the web application's .env. The runtime account must not access dlingo_jamur_test.
