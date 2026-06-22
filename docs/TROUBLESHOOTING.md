# Troubleshooting

## `doctor` says a managed skill directory is missing

Run:

```bash
npx flow-sdd update --project .
```

If the directory is still missing:

- check whether the active profile actually installs that skill
- check whether the selected tool is enabled in `flow.config.yaml`

## `doctor` reports unexpected managed directories

That usually means the project changed profile, alias mode, or selected tool set.

Run:

```bash
npx flow-sdd update --project .
```

## The team wants shorter names

Enable aliases:

```yaml
aliases: true
```

Then use directories such as:

- `explore`
- `plan`
- `propose`
- `design`
- `breakdown`
- `run`
- `review`
- `verify`

## `verify` fails even though tests passed

`flow-sdd verify` is broader than a test pass.

It also checks:

- missing workflow artifacts
- mismatches between `_tasks.md` and `task_NN.md`
- unresolved review issues
- missing file references inside workflow artifacts
- invalid multi-project ownership or missing configured projects

## `next` does not suggest the task I expected

`flow-sdd next` only suggests executable tasks.

It will avoid:

- tasks blocked by unfinished dependencies
- tasks inside dependency cycles
- tasks without valid `project` metadata in multi-project mode

Use:

```bash
npx flow-sdd status --project . --feature <name>
npx flow-sdd projects --project . --feature <name>
```

to inspect the blocking reason.

## Multi-project artifacts are being reported as missing

For multi-project features, `verify` may expect or recommend:

- `_impact-map.md`
- `_contracts.md`
- `_release-plan.md`
- `_rollback-plan.md`

Generate or update those artifacts when the feature spans multiple services, coordinated release steps, database work, or critical integrations.

## The installed skill does not reflect project rules

Check `flow.config.yaml`:

- `context`
- `rules`

Then run:

```bash
npx flow-sdd update --project .
```

The installed `SKILL.md` files should contain a `Flow Package Overlay` section afterward.

## The skill wrote the document in the wrong language

Check `flow.config.yaml`:

- `defaultLanguage`

Then run:

```bash
npx flow-sdd update --project .
```

Language priority is:

- explicit user request in the skill invocation
- `defaultLanguage` from the project
- package fallback

## Which profile should the repo use

Use `quick` when:

- the team wants the shortest workable path

Use `strict` when:

- the repo needs validation planning and memory

Use `workspace` when:

- planning and coordination matter more than execution in the current phase
