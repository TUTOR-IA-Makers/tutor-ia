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

-- Additive upgrade of the G0-4 schema; legacy artifacts remain readable.
ALTER TABLE runs ADD COLUMN IF NOT EXISTS constraints jsonb;
ALTER TABLE runs ADD COLUMN IF NOT EXISTS input_quantity integer;
ALTER TABLE runs ADD COLUMN IF NOT EXISTS reviewed boolean NOT NULL DEFAULT false;
ALTER TABLE runs ADD COLUMN IF NOT EXISTS steps jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE runs ADD COLUMN IF NOT EXISTS input_tokens bigint CHECK (input_tokens >= 0);
ALTER TABLE runs ADD COLUMN IF NOT EXISTS output_tokens bigint CHECK (output_tokens >= 0);
ALTER TABLE runs ADD COLUMN IF NOT EXISTS cost numeric(20, 10) CHECK (cost >= 0);

CREATE TABLE IF NOT EXISTS questions (
    run_id text PRIMARY KEY REFERENCES runs (run_id) ON DELETE CASCADE,
    name text NOT NULL,
    statement text NOT NULL,
    reference_solution text NOT NULL,
    constraints jsonb,
    difficulty text CHECK (difficulty IN ('muito facil', 'facil', 'medio', 'dificil', 'muito dificil')),
    axis text CHECK (axis IN ('fundamentos', 'controle de fluxo',
                             'estruturas de dados e ponteiros', 'modularizacao')),
    state text NOT NULL DEFAULT 'draft' CHECK (state IN ('draft'))
);

CREATE TABLE IF NOT EXISTS test_cases (
    run_id text NOT NULL REFERENCES questions (run_id) ON DELETE CASCADE,
    position integer NOT NULL CHECK (position >= 0),
    input text NOT NULL,
    output text NOT NULL,
    PRIMARY KEY (run_id, position)
);
