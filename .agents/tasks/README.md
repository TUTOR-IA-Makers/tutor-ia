# Task files

One file per active branch, named `<issue>-<slug>.md` — the same name as the
branch. `make task` creates both.

**Why this exists.** An agent starts every session with no memory. The task file
is where the branch keeps its context: the goal, the constraints, what has been
tried, what was decided. Point your agent at `AGENTS.md` and this file, and it
starts where the last session stopped — whichever agent it is, and whoever is
driving it.

**Why one file per branch.** The previous single `progress.md` conflicted on
every merge because every branch wrote to it. These files never collide: branch
A only ever touches `.agents/tasks/42-....md`, branch B only touches its own.

**They are scaffolding, not history.** Delete the file in the PR that closes the
issue. Durable records go in three other places: the issue (what and why), the
ADRs (decisions), the commits (how).

Active task files on `main` therefore mean one of two things: work in flight, or
a branch someone abandoned. Both are worth noticing.
