-- BetZone database initialization reference script.
-- Docker Compose uses one PostgreSQL container per service; each container
-- creates its database via POSTGRES_DB and runs init-extensions.sql on startup.
--
-- Service → database mapping:
--   auth-db      → auth_db
--   wallet-db    → wallet_db
--   betting-db   → betting_db
--   casino-db    → casino_db
--   chat-db      → chat_db
--
-- Application schemas are managed by Sequelize migrations in each service.

\echo 'BetZone init-databases.sql — use per-service POSTGRES_DB in docker-compose.'
