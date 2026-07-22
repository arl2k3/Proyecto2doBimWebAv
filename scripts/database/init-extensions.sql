-- Shared PostgreSQL extensions for all BetZone service databases.
-- Each database container mounts this script on first initialization.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
