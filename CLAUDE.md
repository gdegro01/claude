# Project memory

> Replace placeholders below as the project takes shape. Keep this file short — golden rule: if removing a line wouldn't cause Claude to make mistakes, cut it.

## What this project is
TBD — one or two sentences describing the goal and the user-facing outcome.

## Stack
TBD — language(s), framework(s), package manager, runtime version.

## Layout
- `src/` — application code (TBD)
- `tests/` — test suite (TBD)
- `.claude/agents/` — custom subagents (see below)

## Commands
- Install: TBD
- Build: TBD
- Test: TBD
- Lint/typecheck: TBD
- Run dev: TBD

## Conventions
- Branch naming: `claude/<short-slug>` for AI-driven work.
- Commits: imperative mood, focus on *why*, not *what*.
- Don't add comments unless the *why* is non-obvious.
- Don't introduce abstractions beyond what the task requires.

## Multi-agent workflow
- Use **subagents** (`Agent` tool) for parallel work *within one workstream* — exploration, test-writing, isolated heavy-context work.
- Use **parallel web sessions** for unrelated workstreams.
- Parallel dispatch only when ≥3 tasks touch disjoint files. Otherwise sequential.
- Heavy/risky work: spawn subagent with `isolation: "worktree"`.

## Available custom subagents
See `.claude/agents/`:
- `explorer` — read-only deep code exploration
- `planner` — architecture and implementation plans
- `implementer` — feature/bugfix implementation in an isolated worktree
- `tester` — writing and running tests in an isolated worktree
- `reviewer` — second-opinion code review

## Things to never do
- Don't push to `main` directly.
- Don't `--no-verify`, `--force` push, or amend already-pushed commits without explicit ask.
- Don't commit secrets, `.env`, credentials, or large binaries.
