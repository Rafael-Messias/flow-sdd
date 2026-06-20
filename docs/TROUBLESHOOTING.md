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

That usually means the project changed profile, alias mode, or legacy compatibility mode.

Run:

```bash
npx flow-sdd update --project .
```

## The repo still needs `cmd-*`

Enable compatibility:

```yaml
compat:
  cmd_prefix: true
```

Then run:

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

- the repo needs validation planning, memory, and legacy support

Use `workspace` when:

- planning and coordination matter more than execution in the current phase
