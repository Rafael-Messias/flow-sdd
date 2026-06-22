# flow-sdd

Installable `flow-*` skills package for a governed Spec-Driven Development workflow.

Created and maintained by Rafael Messias.

## SDD First

`flow-sdd` is an SDD workflow, not a loose prompt bundle.

Artifact chain:

`Explore -> PRD -> TechSpec -> Tasks -> Execute -> Review -> Fix -> Validation`

Operational loop:

- plan before implementation
- keep artifacts in sync with code
- review and remediate explicitly
- separate preliminary validation from final validation
- verify artifact coherence before claiming completion

## What It Adds

- installable `flow-*` skills package for Codex, Claude, and custom LLM/agent targets
- project-local sync driven by `flow.config.yaml`
- single-project and multi-project workspace support
- CLI introspection for `status`, `next`, `verify`, `impact`, `projects`, and `contracts`
- task-aware next-step resolution with dependency checks
- multi-project verification for project ownership, cross-project dependencies, and recommended release artifacts
- optional UX aliases such as `plan`, `review`, and `verify`

## Install

```bash
npm i -D flow-sdd
```

Initialize in a repository:

```bash
npx flow-sdd init --project . --tools codex,claude --profile strict
```

## CLI

```bash
npx flow-sdd list --json
npx flow-sdd init --project . --tools codex,claude --profile strict
npx flow-sdd update --project .
npx flow-sdd doctor --project . --strict
npx flow-sdd status --project . --feature shopping-cart
npx flow-sdd next --project . --feature shopping-cart
npx flow-sdd verify --project . --feature shopping-cart
npx flow-sdd impact --project . --feature shopping-cart
npx flow-sdd projects --project . --feature shopping-cart
npx flow-sdd contracts --project . --feature shopping-cart
```

## Workspace Modes

### Single project

Default mode. Existing repositories do not need extra metadata.

```yaml
profile: strict
defaultLanguage: en-US
workspace:
  mode: single
```

Typical structure:

```text
tasks/
  shopping-cart/
    _prd.md
    _techspec.md
    _tasks.md
    task_01.md
    task_02.md
```

### Multi-project

Use one workflow feature across multiple repositories or services.

```yaml
profile: strict
defaultLanguage: en-US

workspace:
  mode: multi-project

projects:
  storefront:
    path: ../storefront
    type: frontend
    stack: nextjs
  catalog-api:
    path: ../catalog-api
    type: api
    stack: node
  carts-api:
    path: ../carts-api
    type: api
    stack: node
  database:
    path: ../database
    type: database
    stack: postgres
```

Recommended feature structure:

```text
tasks/
  shopping-cart/
    _prd.md
    _techspec.md
    _tasks.md
    _impact-map.md
    _contracts.md
    _release-plan.md
    _rollback-plan.md
    task_001.md
    task_002.md
    task_003.md
```

Task files may include multi-project metadata:

```markdown
---
id: task_002
title: Implement cart API endpoint
status: pending
type: backend
complexity: medium
project: carts-api
repository: ../carts-api
area: backend
dependencies:
  - task_001
---
```

## Example: Shopping Cart Feature

### 1. Bootstrap the repo

```bash
npm i -D flow-sdd
npx flow-sdd init --project . --tools codex --profile strict
npx flow-sdd status --project .
```

### 2. Plan the feature in the LLM client

```text
Use `flow-plan` for a feature named `shopping-cart`.

Context:
- this is a product catalog website
- product listing and product detail pages already exist
- users can browse as guests
- the cart must support add item, remove item, change quantity, subtotal, and empty state
- checkout is out of scope for this feature

Generate the PRD, TechSpec, task breakdown, and a preliminary validation draft.
```

Expected artifacts:

- `tasks/shopping-cart/_prd.md`
- `tasks/shopping-cart/_techspec.md`
- `tasks/shopping-cart/_tasks.md`
- `tasks/shopping-cart/task_*.md`

### 3. Inspect the plan from the terminal

```bash
npx flow-sdd status --project . --feature shopping-cart
npx flow-sdd next --project . --feature shopping-cart
npx flow-sdd verify --project . --feature shopping-cart
```

### 4. Execute in the LLM client

```text
Use `flow-run` for feature `shopping-cart`.

Implement the planned tasks end to end, keep task tracking updated, and stop when the feature is ready for structured review.
```

When you want to execute a single next task explicitly:

```text
Use `flow-run-task` for feature `shopping-cart` and task `task_02`.

Implement only this task, update task tracking, and stop after verification.
```

### 5. Review and fix

```text
Use `flow-review` for feature `shopping-cart`.

Review the implementation against the PRD, TechSpec, task files, and current code. Create a review round with concrete issues if problems are found.
```

If issues exist:

```text
Use `flow-fix-review` for feature `shopping-cart`.

Resolve the latest review issues, update the review files, and verify the result before closure.
```

### 6. Final validation

```text
Use `flow-validation-plan` for feature `shopping-cart`.

Generate the final validation package with scenarios for:
- add to cart from listing page
- add to cart from product detail page
- remove item
- change item quantity
- subtotal update
- empty-cart state
- stock-limit rejection
```

### 7. Final audit

```bash
npx flow-sdd status --project . --feature shopping-cart
npx flow-sdd verify --project . --feature shopping-cart
```

## Command Behavior

`status`

- detects the current workflow phase
- shows artifacts, blockers, dependency-blocked tasks, and next step
- groups work by project in multi-project mode

`next`

- recommends the next executable task
- does not suggest dependency-blocked tasks
- includes project ownership in multi-project mode

`verify`

- audits workflow artifacts by `completeness`, `correctness`, and `coherence`
- validates multi-project task ownership and configured projects
- flags cross-project dependencies and recommended release artifacts

`impact`

- reads `_impact-map.md` when present
- falls back to derived impacted-project data from task metadata

`projects`

- groups workflow progress by project
- useful for orchestration-heavy features

`contracts`

- checks `_contracts.md` for service contract sections
- useful when APIs, workers, or services integrate across projects

## Profiles

`strict`

- full governed workflow
- installs exploration, generic docs, planning, execution, review, verification, validation, and memory skills

`quick`

- lean workflow for faster adoption
- installs exploration, planning, execution, review, and verification skills

`workspace`

- planning-centric profile
- installs exploration, generic docs, planning, task design, verification, and memory skills

## Targets

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

This lets the same package serve more than one LLM client without hardcoding provider-specific behavior into the repo.

## Config

`flow.config.yaml`

```yaml
profile: strict
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
defaultLanguage: en-US
workspace:
  mode: single
projects: {}
context: |
  Product catalog platform with strict feature-level reviews.
rules:
  review:
    - Compare task files against _tasks.md before review.
    - Prefer flow-sdd verify before flow-review.
  testing:
    - Run focused tests before broad suites.
```

Notes:

- `workspace.mode` defaults to `single`
- `defaultLanguage` defines the fallback language for generated artifacts
- explicit user language requests still win
- `context` and `rules` are injected into installed `SKILL.md` files as a managed overlay
- extra agent/LLM targets can be added through `toolTargets`

## Installed Names

Canonical skills:

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

Aliases:

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
- `verify`

## Verification Model

Use both layers:

- `flow-sdd verify`: workflow and artifact audit
- `flow-verify`: in-agent completion guard with fresh evidence expectations

## Generic Documents

Use `flow-doc-workshop` for repository documents outside the specialized SDD chain, such as:

- `README`
- `runbook`
- `migration guide`
- `onboarding doc`
- short `RFC`
- standalone `ADR`

## Guides

- [docs/ONBOARDING.md](docs/ONBOARDING.md)
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- [RELEASING.md](RELEASING.md)
