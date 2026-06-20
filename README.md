# flow-sdd

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
- supports canonical names and UX aliases
- supports guided drafting for repository documents outside the core SDD artifact chain
- exposes lifecycle commands for install, update, doctoring, status, next-step resolution, and workflow verification
- injects project-local context and rules from `flow.config.yaml` into installed skills
- supports extra agent/LLM targets through configurable `toolTargets`

## Install

```bash
npm i -D flow-sdd
```

## CLI

```bash
npx flow-sdd list --json
npx flow-sdd init --project /path/to/project --tools codex,claude --profile strict
npx flow-sdd update --project /path/to/project
npx flow-sdd doctor --project /path/to/project --strict
npx flow-sdd status --project /path/to/project --feature my-feature
npx flow-sdd next --project /path/to/project --feature my-feature
npx flow-sdd verify --project /path/to/project --feature my-feature
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

## Example: Shopping Cart Feature

### Quickstart

Bootstrap the package in your repository:

```bash
npm i -D flow-sdd
npx flow-sdd init --project . --tools codex,claude --profile strict
npx flow-sdd status --project .
npx flow-sdd next --project .
```

Then, in your LLM client, start planning a shopping cart feature for a product catalog site:

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

Expected planning artifacts:

- `tasks/shopping-cart/_prd.md`
- `tasks/shopping-cart/_techspec.md`
- `tasks/shopping-cart/_tasks.md`
- `tasks/shopping-cart/task_*.md`

### End-to-end walkthrough

1. Initialize the workflow in the repository.

```bash
npx flow-sdd init --project . --tools codex,claude --profile strict
```

2. Plan the feature in the LLM client.

```text
Use `flow-plan` for a feature named `shopping-cart`.

Business goal:
- let a user build a cart while browsing a product catalog

Scope:
- add to cart from product list and product detail pages
- remove item from cart
- change item quantity
- show subtotal and total item count
- show empty-cart state
- block quantities above available stock

Out of scope:
- checkout
- payment
- coupon system
- account-specific saved carts

Produce the planning artifacts end to end.
```

Optional checkpoint after planning:

```bash
npx flow-sdd status --project . --feature shopping-cart
npx flow-sdd verify --project . --feature shopping-cart
```

3. Execute the planned work in the LLM client.

```text
Use `flow-run` for feature `shopping-cart`.

Implement the planned tasks end to end, keep task tracking updated, and stop when the feature is ready for structured review.
```

If you want to inspect progress from the terminal while work is running:

```bash
npx flow-sdd status --project . --feature shopping-cart
npx flow-sdd next --project . --feature shopping-cart
```

4. Review the implementation in the LLM client.

```text
Use `flow-review` for feature `shopping-cart`.

Review the implementation against the PRD, TechSpec, task files, and current code. Create a review round with concrete issues if problems are found.
```

If the review opens issues:

```text
Use `flow-fix-review` for feature `shopping-cart`.

Resolve the latest review issues, update the review files, and verify the result before closure.
```

5. Generate the final validation package in the LLM client.

```text
Use `flow-validation-plan` for feature `shopping-cart`.

Generate the final validation package with scenarios for:
- add to cart from listing page
- add to cart from product detail page
- remove item
- change quantity
- subtotal update
- empty-cart state
- stock-limit rejection
```

6. Run a final audit from the terminal.

```bash
npx flow-sdd status --project . --feature shopping-cart
npx flow-sdd verify --project . --feature shopping-cart
```

Typical end state for this example:

- planning artifacts exist under `tasks/shopping-cart/`
- implementation tasks are completed
- at least one review round exists
- review issues are resolved or explicitly tracked
- final validation artifacts are ready for manual or hybrid QA

## Profiles

`strict`

- full governed workflow
- installs exploration, generic docs, planning, execution, review, verification, validation, and memory skills
- enables UX aliases

`quick`

- lean workflow for faster adoption
- installs exploration, planning, execution, review, and verification skills
- enables UX aliases

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
context: |
  API monolith with strict change control and feature-level reviews.
rules:
  review:
    - Compare task files against _tasks.md before review.
    - Prefer flow-sdd verify before flow-review.
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
- this keeps `flow-sdd` extensible beyond Codex and Claude without hardcoding fragile assumptions

## Output targets

- `codex` -> `.agents/skills/`
- `claude` -> `.claude/skills/`
- custom targets -> configured via `toolTargets`

## Verification model

Use both layers:

- `flow-sdd verify`: artifact and workflow alignment audit
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

## Guides

- [docs/ONBOARDING.md](docs/ONBOARDING.md)
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- [RELEASING.md](RELEASING.md)
