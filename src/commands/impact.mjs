import fs from "node:fs/promises";
import path from "node:path";

import { loadProjectConfig, normalizeProjectConfig } from "../lib/config.mjs";
import { collectWorkflowStatus } from "../lib/workflow-status.mjs";

export async function runImpact({ options, context }) {
  const projectRoot = path.resolve(context.cwd, options.project ?? ".");
  const loadedConfig = await loadProjectConfig(projectRoot);
  const config = normalizeProjectConfig(loadedConfig ?? {});
  const status = await collectWorkflowStatus({
    projectRoot,
    feature: options.feature,
    config
  });

  const payload = await buildPayload(projectRoot, loadedConfig, config, status);

  if (options.json) {
    context.io.stdout.write(JSON.stringify(payload, null, 2) + "\n");
    return payload.mode === "error" ? 1 : 0;
  }

  renderHumanImpact(payload, context.io.stdout);
  return payload.mode === "error" ? 1 : 0;
}

async function buildPayload(projectRoot, loadedConfig, config, status) {
  const base = {
    projectRoot,
    workspace: status.workspace,
    config: {
      present: Boolean(loadedConfig),
      profile: config.profile,
      tools: config.tools
    }
  };

  if (status.mode === "empty") {
    return {
      ...base,
      mode: "empty",
      nextStep: status.nextStep
    };
  }

  if (status.mode === "workspace") {
    return {
      ...base,
      mode: "error",
      message: "Use --feature <name> when more than one feature exists."
    };
  }

  const impactMapPath = path.join(status.feature.directory, "_impact-map.md");
  const artifactEntries = status.feature.artifacts.impactMapPresent
    ? await readImpactMap(impactMapPath)
    : [];
  const derivedEntries = status.feature.projects.items.map((project) => ({
    project: project.name,
    type: project.type ?? "",
    repository: project.repository ?? "",
    responsibility: ""
  }));

  return {
    ...base,
    mode: "feature",
    feature: {
      name: status.feature.name,
      phase: status.feature.phase,
      source: artifactEntries.length > 0 ? "artifact" : "derived",
      entries: artifactEntries.length > 0 ? artifactEntries : derivedEntries
    }
  };
}

async function readImpactMap(filePath) {
  const contents = await fs.readFile(filePath, "utf8");
  const table = parseMarkdownTable(contents);
  if (!table) {
    return [];
  }

  return table.rows.map((cells) => ({
    project: cells[0] ?? "",
    type: cells[1] ?? "",
    repository: cells[2] ?? "",
    responsibility: cells[3] ?? ""
  }));
}

function parseMarkdownTable(contents) {
  const lines = contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));

  if (lines.length < 3) {
    return null;
  }

  const rows = lines.slice(2).map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()));
  return {
    rows: rows.filter((cells) => cells.some((cell) => cell.length > 0))
  };
}

function renderHumanImpact(payload, stdout) {
  stdout.write(`Project: ${payload.projectRoot}\n`);

  if (payload.mode === "empty") {
    stdout.write("\nNo workflow features found.\n");
    return;
  }

  if (payload.mode === "error") {
    stdout.write(`\n${payload.message}\n`);
    return;
  }

  stdout.write(`\nImpact Map: ${payload.feature.name}\n`);
  stdout.write(`Source: ${payload.feature.source}\n`);

  if (payload.feature.entries.length === 0) {
    stdout.write("- no impacted projects detected\n");
    return;
  }

  for (const entry of payload.feature.entries) {
    const details = [entry.type, entry.repository, entry.responsibility].filter(Boolean).join(" | ");
    stdout.write(`- ${entry.project}${details ? `: ${details}` : ""}\n`);
  }
}
