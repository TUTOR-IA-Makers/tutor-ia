-- Teachers and their sessions (docs/adr/0019). Applied on every start, so every
-- statement is idempotent.

CREATE TABLE IF NOT EXISTS teachers (
    id text PRIMARY KEY,
    name text NOT NULL,
    -- Stored lower case by the API, so equality is enough to keep it unique.
    email text NOT NULL UNIQUE,
    department text NOT NULL DEFAULT '',
    -- scrypt$N$r$p$salt$key: the parameters travel with the hash.
    password_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
    -- SHA-256 of the cookie's token. The token itself is never stored.
    token_hash text PRIMARY KEY,
    teacher_id text NOT NULL REFERENCES teachers (id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_expires_at ON sessions (expires_at);
