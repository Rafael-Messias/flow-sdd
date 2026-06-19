import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import YAML from "yaml";

import { runCli } from "../src/cli.mjs";

const packageRoot = path.resolve(import.meta.dirname, "..");

await testListCommand();
await testStrictProfileLifecycle();
await testQuickProfileOverlay();
await testWorkspaceProfile();
await testCustomToolTargets();
await testWorkflowIntrospectionAndVerification();

console.log("smoke tests passed");

async function testListCommand() {
  const root = await makeTempProjectRoot();
  const { stdout } = createIo();

  const exitCode = await runCli(["list", "--json"], root, io(stdout));
  assert.equal(exitCode, 0);

  const payload = JSON.parse(stdout.value());
  assert.ok(payload.skills.some((skill) => skill.canonical === "flow-explore"));
  assert.ok(payload.skills.some((skill) => skill.canonical === "flow-doc-workshop"));
  assert.ok(payload.profiles.quick);
  assert.ok(payload.profiles.workspace);
}

async function testStrictProfileLifecycle() {
  const root = await makeTempProjectRoot();
  const { stdout, stderr } = createIo();

  let exitCode = await runCli(["init", "--project", root, "--tools", "codex,claude", "--profile", "strict"], root, io(stdout, stderr));
  assert.equal(exitCode, 0);

  const config = await readYaml(path.join(root, "flow.config.yaml"));
  assert.equal(config.profile, "strict");
  assert.ok(config.skills.includes("flow-explore"));
  assert.ok(config.skills.includes("flow-doc-workshop"));
  assert.equal(config.defaultLanguage, "pt-BR");
  assert.equal(config.compat.cmd_prefix, true);

  await fs.access(path.join(root, ".agents", "skills", "flow-doc-workshop"));
  await fs.access(path.join(root, ".agents", "skills", "docs"));
  await fs.access(path.join(root, ".agents", "skills", "flow-plan"));
  await fs.access(path.join(root, ".agents", "skills", "plan"));
  await fs.access(path.join(root, ".agents", "skills", "cmd-plan-feature"));
  await fs.access(path.join(root, ".claude", "skills", "flow-plan"));

  const skillBefore = await fs.readFile(path.join(root, ".agents", "skills", "flow-plan", "SKILL.md"), "utf8");

  stdout.reset();
  stderr.reset();

  exitCode = await runCli(["update", "--project", root, "--tools", "codex,claude", "--profile", "strict"], root, io(stdout, stderr));
  assert.equal(exitCode, 0);

  const skillAfter = await fs.readFile(path.join(root, ".agents", "skills", "flow-plan", "SKILL.md"), "utf8");
  assert.equal(skillAfter, skillBefore);

  stdout.reset();
  stderr.reset();

  exitCode = await runCli(["doctor", "--project", root, "--strict"], root, io(stdout, stderr));
  assert.equal(exitCode, 0);
  assert.match(stdout.value(), /Doctor found no managed-skill issues/);
}

async function testQuickProfileOverlay() {
  const root = await makeTempProjectRoot();
  const { stdout, stderr } = createIo();

  let exitCode = await runCli(["init", "--project", root, "--tools", "codex", "--profile", "quick"], root, io(stdout, stderr));
  assert.equal(exitCode, 0);

  let config = await readYaml(path.join(root, "flow.config.yaml"));
  config.context = "API monolith with strict change control.";
  config.defaultLanguage = "en-US";
  config.rules = {
    review: ["Always compare task files with _tasks.md.", "Prefer feature-level verification before review."],
    testing: ["Run focused tests before broad suite."]
  };
  await fs.writeFile(path.join(root, "flow.config.yaml"), YAML.stringify(config), "utf8");

  stdout.reset();
  stderr.reset();

  exitCode = await runCli(["update", "--project", root], root, io(stdout, stderr));
  assert.equal(exitCode, 0);

  config = await readYaml(path.join(root, "flow.config.yaml"));
  assert.equal(config.profile, "quick");
  assert.equal(config.compat.cmd_prefix, false);
  assert.equal(config.defaultLanguage, "en-US");
  assert.ok(config.skills.includes("flow-explore"));
  assert.ok(!config.skills.includes("flow-doc-workshop"));
  assert.ok(!config.skills.includes("flow-validation-plan"));

  await fs.access(path.join(root, ".agents", "skills", "flow-explore"));
  await fs.access(path.join(root, ".agents", "skills", "explore"));
  await fs.access(path.join(root, ".agents", "skills", "propose"));
  await fs.access(path.join(root, ".agents", "skills", "design"));
  await assert.rejects(fs.access(path.join(root, ".agents", "skills", "flow-doc-workshop")));
  await assert.rejects(fs.access(path.join(root, ".agents", "skills", "cmd-plan-feature")));
  await assert.rejects(fs.access(path.join(root, ".agents", "skills", "flow-validation-plan")));

  const installedSkill = await fs.readFile(path.join(root, ".agents", "skills", "flow-plan", "SKILL.md"), "utf8");
  assert.match(installedSkill, /Flow Package Overlay/);
  assert.match(installedSkill, /Idioma padrao do projeto: `en-US`/);
  assert.match(installedSkill, /Contexto do Projeto/);
  assert.match(installedSkill, /Regras do Projeto/);

  stdout.reset();
  stderr.reset();

  exitCode = await runCli(["doctor", "--project", root, "--strict"], root, io(stdout, stderr));
  assert.equal(exitCode, 0);
}

async function testWorkspaceProfile() {
  const root = await makeTempProjectRoot();
  const { stdout, stderr } = createIo();

  const exitCode = await runCli(["init", "--project", root, "--tools", "codex", "--profile", "workspace"], root, io(stdout, stderr));
  assert.equal(exitCode, 0);

  const config = await readYaml(path.join(root, "flow.config.yaml"));
  assert.equal(config.profile, "workspace");
  assert.equal(config.compat.cmd_prefix, false);
  assert.equal(config.defaultLanguage, "pt-BR");
  assert.ok(config.skills.includes("flow-doc-workshop"));
  assert.ok(config.skills.includes("flow-plan"));
  assert.ok(config.skills.includes("flow-verify"));
  assert.ok(!config.skills.includes("flow-run"));

  await fs.access(path.join(root, ".agents", "skills", "flow-doc-workshop"));
  await fs.access(path.join(root, ".agents", "skills", "docs"));
  await fs.access(path.join(root, ".agents", "skills", "flow-plan"));
  await fs.access(path.join(root, ".agents", "skills", "flow-verify"));
  await assert.rejects(fs.access(path.join(root, ".agents", "skills", "flow-run")));
}

async function testCustomToolTargets() {
  const root = await makeTempProjectRoot();
  const { stdout, stderr } = createIo();

  let exitCode = await runCli(["init", "--project", root, "--tools", "codex", "--profile", "quick"], root, io(stdout, stderr));
  assert.equal(exitCode, 0);

  const configPath = path.join(root, "flow.config.yaml");
  const config = await readYaml(configPath);
  config.tools = ["codex", "gemini"];
  config.toolTargets = {
    gemini: ".gemini/skills"
  };
  await fs.writeFile(configPath, YAML.stringify(config), "utf8");

  stdout.reset();
  stderr.reset();

  exitCode = await runCli(["update", "--project", root], root, io(stdout, stderr));
  assert.equal(exitCode, 0);

  await fs.access(path.join(root, ".gemini", "skills", "flow-plan"));
  await fs.access(path.join(root, ".gemini", "skills", "plan"));
  await fs.access(path.join(root, ".gemini", "skills", "flow-explore"));

  stdout.reset();
  stderr.reset();

  exitCode = await runCli(["doctor", "--project", root, "--strict"], root, io(stdout, stderr));
  assert.equal(exitCode, 0);
  assert.match(stdout.value(), /\[gemini\]/);
}

async function testWorkflowIntrospectionAndVerification() {
  const root = await makeTempProjectRoot();
  const { stdout, stderr } = createIo();

  let exitCode = await runCli(["init", "--project", root, "--tools", "codex", "--profile", "strict"], root, io(stdout, stderr));
  assert.equal(exitCode, 0);

  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.writeFile(path.join(root, "src", "example.ts"), "export const ok = true;\n", "utf8");

  await fs.mkdir(path.join(root, "tasks", "demo-review", "reviews-001"), { recursive: true });
  await fs.writeFile(path.join(root, "tasks", "demo-review", "_prd.md"), "# PRD\n", "utf8");
  await fs.writeFile(path.join(root, "tasks", "demo-review", "_techspec.md"), "# TechSpec\n", "utf8");
  await fs.writeFile(
    path.join(root, "tasks", "demo-review", "_tasks.md"),
    `# Demo Review - Lista de Tarefas

## Tarefas

| # | Título | Status | Complexidade | Dependências |
|---|--------|--------|---------------|--------------|
| 01 | Implement review-ready task | completed | medium | - |
`,
    "utf8"
  );
  await fs.writeFile(
    path.join(root, "tasks", "demo-review", "task_01.md"),
    `---
status: completed
title: Implement review-ready task
type: backend
complexity: medium
dependencies: []
---

# Task 01: Implement review-ready task

## Arquivos Relevantes
- \`src/example.ts\`: runtime file
`,
    "utf8"
  );
  await fs.writeFile(
    path.join(root, "tasks", "demo-review", "reviews-001", "issue_001.md"),
    `---
status: pending
file: src\\example.ts
line: 12
severity: high
author: claude-code
provider_ref:
---

# Issue 001: Example review finding
`,
    "utf8"
  );

  await fs.mkdir(path.join(root, "tasks", "demo-plan"), { recursive: true });
  await fs.writeFile(path.join(root, "tasks", "demo-plan", "_prd.md"), "# PRD\n", "utf8");

  await fs.mkdir(path.join(root, "tasks", "demo-draft"), { recursive: true });
  await fs.writeFile(path.join(root, "tasks", "demo-draft", "_prd.md"), "# PRD\n", "utf8");
  await fs.writeFile(path.join(root, "tasks", "demo-draft", "_techspec.md"), "# TechSpec\n", "utf8");
  await fs.writeFile(
    path.join(root, "tasks", "demo-draft", "_tasks.md"),
    `# Demo Draft - Lista de Tarefas

## Tarefas

| # | Título | Status | Complexidade | Dependências |
|---|--------|--------|---------------|--------------|
| 01 | Prepare implementation | pending | medium | - |
`,
    "utf8"
  );
  await fs.writeFile(
    path.join(root, "tasks", "demo-draft", "task_01.md"),
    `---
status: pending
title: Prepare implementation
type: backend
complexity: medium
dependencies: []
---

# Task 01: Prepare implementation
`,
    "utf8"
  );
  await fs.writeFile(
    path.join(root, "tasks", "demo-draft", "_test_plan.preliminary.md"),
    "# Draft test plan\n",
    "utf8"
  );
  await fs.writeFile(
    path.join(root, "tasks", "demo-draft", "_validation_scenarios_manual.preliminary.md"),
    "# Draft scenarios\n",
    "utf8"
  );

  await fs.mkdir(path.join(root, "tasks", "demo-validation-ready", "reviews-001"), { recursive: true });
  await fs.writeFile(path.join(root, "tasks", "demo-validation-ready", "_prd.md"), "# PRD\n", "utf8");
  await fs.writeFile(path.join(root, "tasks", "demo-validation-ready", "_techspec.md"), "# TechSpec\n", "utf8");
  await fs.writeFile(
    path.join(root, "tasks", "demo-validation-ready", "_tasks.md"),
    `# Demo Validation Ready - Lista de Tarefas

## Tarefas

| # | Título | Status | Complexidade | Dependências |
|---|--------|--------|---------------|--------------|
| 01 | Ship implementation | completed | medium | - |
`,
    "utf8"
  );
  await fs.writeFile(
    path.join(root, "tasks", "demo-validation-ready", "task_01.md"),
    `---
status: completed
title: Ship implementation
type: backend
complexity: medium
dependencies: []
---

# Task 01: Ship implementation

## Arquivos Relevantes
- \`src/example.ts\`: runtime file
`,
    "utf8"
  );
  await fs.writeFile(
    path.join(root, "tasks", "demo-validation-ready", "reviews-001", "issue_001.md"),
    `---
status: resolved
file: src\\example.ts
line: 12
severity: medium
author: claude-code
provider_ref:
---

# Issue 001: Resolved review finding
`,
    "utf8"
  );
  await fs.writeFile(
    path.join(root, "tasks", "demo-validation-ready", "_test_plan.preliminary.md"),
    "# Draft test plan\n",
    "utf8"
  );
  await fs.writeFile(
    path.join(root, "tasks", "demo-validation-ready", "_validation_scenarios_manual.preliminary.md"),
    "# Draft scenarios\n",
    "utf8"
  );

  stdout.reset();
  stderr.reset();

  exitCode = await runCli(["status", "--project", root, "--feature", "demo-review", "--json"], root, io(stdout, stderr));
  assert.equal(exitCode, 0);

  const statusPayload = JSON.parse(stdout.value());
  assert.equal(statusPayload.mode, "feature");
  assert.equal(statusPayload.feature.phase, "review-fixes");
  assert.equal(statusPayload.feature.reviews.openIssues, 1);
  assert.equal(statusPayload.feature.nextStep.command, "flow-fix-review demo-review");

  stdout.reset();
  stderr.reset();

  exitCode = await runCli(["status", "--project", root, "--feature", "demo-draft", "--json"], root, io(stdout, stderr));
  assert.equal(exitCode, 0);

  const draftStatusPayload = JSON.parse(stdout.value());
  assert.equal(draftStatusPayload.feature.phase, "ready-to-run");
  assert.equal(draftStatusPayload.feature.nextStep.command, "flow-run demo-draft");
  assert.equal(draftStatusPayload.feature.validation.testPlanPresent, false);
  assert.equal(draftStatusPayload.feature.validation.preliminaryTestPlanPresent, true);
  assert.equal(draftStatusPayload.feature.validation.preliminaryScenarioCount, 1);

  stdout.reset();
  stderr.reset();

  exitCode = await runCli(["status", "--project", root, "--feature", "demo-validation-ready", "--json"], root, io(stdout, stderr));
  assert.equal(exitCode, 0);

  const validationReadyPayload = JSON.parse(stdout.value());
  assert.equal(validationReadyPayload.feature.phase, "ready-for-validation");
  assert.equal(validationReadyPayload.feature.nextStep.command, "flow-validation-plan demo-validation-ready");
  assert.match(validationReadyPayload.feature.nextStep.reason, /preliminary validation draft/i);
  assert.equal(validationReadyPayload.feature.validation.testPlanPresent, false);
  assert.equal(validationReadyPayload.feature.validation.preliminaryTestPlanPresent, true);

  stdout.reset();
  stderr.reset();

  exitCode = await runCli(["next", "--project", root, "--json"], root, io(stdout, stderr));
  assert.equal(exitCode, 0);

  const nextPayload = JSON.parse(stdout.value());
  assert.equal(nextPayload.mode, "workspace");
  assert.equal(nextPayload.nextStep.command, "flow-fix-review demo-review");
  assert.equal(nextPayload.options.length, 4);

  stdout.reset();
  stderr.reset();

  exitCode = await runCli(["verify", "--project", root, "--feature", "demo-review", "--json"], root, io(stdout, stderr));
  assert.equal(exitCode, 1);

  const verifyPayload = JSON.parse(stdout.value());
  assert.equal(verifyPayload.mode, "feature");
  assert.equal(verifyPayload.verdict, "FAIL");
  assert.match(verifyPayload.feature.findings.coherence.join("\n"), /unresolved review issue/);
  assert.doesNotMatch(verifyPayload.feature.findings.correctness.join("\n"), /missing file/);

  stdout.reset();
  stderr.reset();

  exitCode = await runCli(["verify", "--project", root, "--feature", "demo-draft", "--json"], root, io(stdout, stderr));
  assert.equal(exitCode, 0);

  const draftVerifyPayload = JSON.parse(stdout.value());
  assert.equal(draftVerifyPayload.mode, "feature");
  assert.equal(draftVerifyPayload.verdict, "PASS");
  assert.doesNotMatch(draftVerifyPayload.feature.findings.coherence.join("\n"), /validation artifacts exist even though not all task files are completed/i);

  stdout.reset();
  stderr.reset();

  exitCode = await runCli(["verify", "--project", root, "--feature", "demo-validation-ready", "--json"], root, io(stdout, stderr));
  assert.equal(exitCode, 1);

  const validationReadyVerifyPayload = JSON.parse(stdout.value());
  assert.equal(validationReadyVerifyPayload.mode, "feature");
  assert.match(
    validationReadyVerifyPayload.feature.findings.completeness.join("\n"),
    /Only preliminary validation draft artifacts exist/i
  );
}

async function makeTempProjectRoot() {
  return fs.mkdtemp(path.join(os.tmpdir(), "flow-skills-"));
}

function createIo() {
  return {
    stdout: createBuffer(),
    stderr: createBuffer()
  };
}

function io(stdout, stderr = createBuffer()) {
  return {
    stdout,
    stderr,
    packageRoot
  };
}

function createBuffer() {
  let buffer = "";
  return {
    write(chunk) {
      buffer += chunk;
    },
    value() {
      return buffer;
    },
    reset() {
      buffer = "";
    }
  };
}

async function readYaml(filePath) {
  const contents = await fs.readFile(filePath, "utf8");
  return YAML.parse(contents);
}
