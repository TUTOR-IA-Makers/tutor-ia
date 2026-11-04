-- Applied idempotently when a PostgresStore starts. See docs/adr/0012.

CREATE TABLE IF NOT EXISTS runs (
    run_id       text PRIMARY KEY,
    status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'complete')),
    created_at   timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS run_artifacts (
    run_id     text NOT NULL REFERENCES runs (run_id) ON DELETE CASCADE,
    name       text NOT NULL,
    content    text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (run_id, name)
);

-- The library lists finished questions, newest first.
CREATE INDEX IF NOT EXISTS runs_complete_idx ON runs (completed_at DESC) WHERE status = 'complete';
