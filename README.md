# flow-skills

Installable `flow-*` skills package for a governed Spec-Driven Development workflow.

Created and maintained by Rafael Messias.

## SDD Workflow

`flow-*` is not just a bag of prompts. It is a governed SDD process with an explicit artifact chain:

`Explore -> PRD -> TechSpec -> Tasks -> Execute -> Review -> Fix -> Validation`

There is one intentional optional bridge in that chain:

- after `flow-tasks`, `flow-plan` can offer a `preliminary` validation draft
- after execution and a clean review, `flow-run` can offer the final validation plan

That means the package is opinionated about:

- planning before implementation
- structured drafting for adjacent repo documents
- artifact-driven execution
- explicit review and remediation loops
- separate draft-vs-final validation planning
- verification before completion claims
- workflow introspection through `status`, `next`, and `verify`

## What it does

- keeps a canonical skill source tree under `skills-src/`
- installs managed skill directories into built-in targets such as `.agents/skills/` and `.claude/skills/`
- supports canonical names, UX aliases, and optional legacy `cmd-*` compatibility
- supports guided drafting for repository documents outside the core SDD artifact chain
- exposes lifecycle commands for install, update, doctoring, status, next-step resolution, and workflow verification
- injects project-local context and rules from `flow.config.yaml` into installed skills
- supports extra agent/LLM targets through configurable `toolTargets`

## Install

```bash
npm i -D @padroes-dev-ia/flow-skills
```

## CLI

```bash
npx flow-skills list --json
npx flow-skills init --project /path/to/project --tools codex,claude --profile strict
npx flow-skills update --project /path/to/project
npx flow-skills doctor --project /path/to/project --strict
npx flow-skills status --project /path/to/project --feature my-feature
npx flow-skills next --project /path/to/project --feature my-feature
npx flow-skills verify --project /path/to/project --feature my-feature
```

## Commands

`list`

- lists canonical skills, profiles, and tool targets
- supports `--json`

`init`

- creates `flow.config.yaml`
- installs managed skills for the selected tools
- creates the project root when it does not exist yet

`update`

- re-applies the current config
- removes managed skill directories that no longer belong to the active profile
- refreshes project overlay sections generated from config

`doctor`

- validates the managed install state for the active config
- reports missing or unexpected managed skill directories
- returns non-zero with `--strict`

`status`

- inspects `tasks/`
- detects current workflow phase, artifacts, blockers, and next step
- supports workspace view and feature view

`next`

- resolves the recommended next action from the current workflow state
- useful for automation and agent routing

`verify`

- audits workflow artifacts by `completeness`, `correctness`, and `coherence`
- complements `flow-review`; it does not replace review
- returns non-zero when verification fails

## Profiles

`strict`

- full governed workflow
- installs exploration, generic docs, planning, execution, review, verification, validation, and memory skills
- enables UX aliases and legacy `cmd-*` compatibility

`quick`

- lean workflow for faster adoption
- installs exploration, planning, execution, review, and verification skills
- enables UX aliases
- disables legacy `cmd-*` compatibility by default

`workspace`

- planning-centric workspace profile
- installs exploration, generic docs, planning, task design, verification, and memory skills
- useful when the repo is still in planning or coordination mode

## Installed names

Canonical skills include:

- `flow-explore`
- `flow-doc-workshop`
- `flow-plan`
- `flow-prd`
- `flow-techspec`
- `flow-tasks`
- `flow-validate-tasks`
- `flow-run-task`
- `flow-run`
- `flow-review`
- `flow-fix-review`
- `flow-verify`
- `flow-validation-plan`
- `flow-memory`

UX aliases include:

- `explore`
- `docs`
- `plan`
- `prd`
- `propose`
- `techspec`
- `design`
- `tasks`
- `breakdown`
- `run`
- `review`
- `fix-review`
- `verify`

Legacy aliases remain optional:

- `cmd-*` names are installed only when `compat.cmd_prefix` is enabled

## Config

`flow.config.yaml`

```yaml
profile: quick
tools:
  - codex
skills:
  - flow-explore
  - flow-plan
  - flow-prd
  - flow-techspec
  - flow-tasks
  - flow-validate-tasks
  - flow-run-task
  - flow-run
  - flow-review
  - flow-fix-review
  - flow-verify
delivery: skills
aliases: true
defaultLanguage: pt-BR
compat:
  cmd_prefix: false
context: |
  API monolith with strict change control and feature-level reviews.
rules:
  review:
    - Compare task files against _tasks.md before review.
    - Prefer flow-skills verify before flow-review.
  testing:
    - Run focused tests before broad suites.
```

Notes:

- `skills` is optional; when omitted, the active profile decides the set
- `defaultLanguage` defines the project-wide fallback language for generated artifacts; an explicit user request still wins
- `context` and `rules` are injected into installed `SKILL.md` files as a managed overlay section
- built-in `tools` are `codex` and `claude`
- extra agent/LLM targets can be added through `toolTargets`

## Multi-LLM / Agent Targets

Built-in targets:

- `codex` -> `.agents/skills/`
- `claude` -> `.claude/skills/`

Custom targets:

```yaml
tools:
  - codex
  - claude
  - gemini
  - cursor
toolTargets:
  gemini: .gemini/skills
  cursor: .cursor/skills
```

This is intentionally path-driven instead of convention-driven.

- if a tool has an official install location in your repo, point to it explicitly
- if a tool uses a different shape, adjust the path without changing the package code
- this keeps `flow-skills` extensible beyond Codex and Claude without hardcoding fragile assumptions

## Output targets

- `codex` -> `.agents/skills/`
- `claude` -> `.claude/skills/`
- custom targets -> configured via `toolTargets`

## Verification model

Use both layers:

- `flow-skills verify`: artifact and workflow alignment audit
- `flow-verify`: installed skill that enforces fresh execution evidence before completion claims

## Generic Documents

Use `flow-doc-workshop` when the repo needs a structured document outside the specialized SDD flow, for example:

- `README`
- `runbook`
- `migration guide`
- `onboarding doc`
- short `RFC`
- standalone `ADR`

Do not use it as a replacement for `flow-prd`, `flow-techspec`, `flow-tasks`, or `flow-validation-plan`.

## Migration

Canonical naming is `flow-*`.

- use `flow-*` in docs, examples, onboarding, and new automation
- enable `compat.cmd_prefix` only for consumers that still depend on `cmd-*`
- see [docs/flow-migration-guide.md](docs/flow-migration-guide.md) for the rename map and compatibility policy

## Guides

- [docs/ONBOARDING.md](docs/ONBOARDING.md)
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- [RELEASING.md](RELEASING.md)
