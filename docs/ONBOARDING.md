# Onboarding

## Goal

Get a repository to a usable `flow-*` workflow quickly, then move to the full governed mode when the team needs it.

## Quick path

Use this when the team wants the shortest path to exploration, planning, execution, and review.

```bash
npx flow-sdd init --project . --tools codex --profile quick
```

Recommended habit:

1. `explore` when the problem is still fuzzy.
2. `plan` when the feature needs the full planning chain.
3. `run` when the tasks already exist.
4. `verify` before review claims.
5. `review` after implementation stabilizes.

## Strict path

Use this when the repo needs the whole governed workflow, including validation planning and memory.

```bash
npx flow-sdd init --project . --tools codex,claude --profile strict
```

Recommended habit:

1. `flow-explore` when discovery is needed.
2. `flow-doc-workshop` for generic repository documents outside the SDD core.
3. `flow-plan` for PRD + TechSpec + task generation.
4. Optionally accept the `preliminary` validation draft that `flow-plan` can offer right after validated tasks.
5. `flow-run` or `flow-run-task` for implementation.
6. `flow-sdd verify` before `flow-review`.
7. `flow-fix-review` when review rounds create issues.
8. Accept the final `flow-validation-plan` when execution is done and review is clean.
9. `flow-verify` before any completion or merge claim.

## Codex example

Install for Codex only:

```bash
npx flow-sdd init --project . --tools codex --profile quick
```

Expected target:

- `.agents/skills/`

## Claude example

Install for Claude only:

```bash
npx flow-sdd init --project . --tools claude --profile strict
```

Expected target:

- `.claude/skills/`

## Which entry point to use

Use `flow-plan` when:

- the feature still needs structured planning artifacts
- the team wants the full PRD -> TechSpec -> tasks chain
- the team may benefit from an optional validation draft before implementation starts

Use `flow-doc-workshop` when:

- the repo needs a `README`, runbook, onboarding doc, migration guide, short `RFC`, or standalone `ADR`
- the document is important, but not part of the specialized PRD/TechSpec/validation flow

Use `flow-prd` directly when:

- business framing is still the main gap
- the technical shape would be premature

Use `flow-run` when:

- the task set already exists and should be executed end-to-end
- the team wants the workflow to offer final validation planning after a clean review

Use `flow-run-task` when:

- only one task should move forward
- you need tighter control over scope or sequencing

## Introspection commands

Use these to keep the workflow consultable:

- `flow-sdd status --feature <name>`
- `flow-sdd next --feature <name>`
- `flow-sdd verify --feature <name>`

## Multi-project onboarding

Use this when one feature spans more than one repository or service.

1. Configure `workspace.mode: multi-project` in `flow.config.yaml`.
2. Register each impacted project under `projects`.
3. Ask `flow-plan` or `flow-tasks` to include project ownership in task files.
4. Use `flow-sdd projects --feature <name>` to inspect grouped progress.
5. Use `flow-sdd impact --feature <name>` and `flow-sdd contracts --feature <name>` when the feature crosses service boundaries.
