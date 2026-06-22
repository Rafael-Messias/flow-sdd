import fs from "node:fs/promises";
import path from "node:path";

import { loadProjectConfig, normalizeProjectConfig } from "../lib/config.mjs";
import { collectWorkflowStatus } from "../lib/workflow-status.mjs";

export async function runContracts({ options, context }) {
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
    return payload.verdict === "PASS" ? 0 : 1;
  }

  renderHumanContracts(payload, context.io.stdout);
  return payload.verdict === "PASS" ? 0 : 1;
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
      verdict: "PASS",
      findings: [],
      sections: []
    };
  }

  if (status.mode === "workspace") {
    return {
      ...base,
      mode: "error",
      verdict: "FAIL",
      findings: ["Use --feature <name> when more than one feature exists."],
      sections: []
    };
  }

  const feature = status.feature;
  const findings = [];
  let sections = [];

  if (!feature.artifacts.contractsPresent) {
    if (feature.requirements.requiresContracts) {
      findings.push("Missing _contracts.md for a multi-project service integration.");
    }
  } else {
    sections = await readContracts(path.join(feature.directory, "_contracts.md"));
    if (sections.length === 0) {
      findings.push("_contracts.md exists but no contract sections were detected.");
    }
  }

  return {
    ...base,
    mode: "feature",
    verdict: findings.length === 0 ? "PASS" : "FAIL",
    feature: {
      name: feature.name,
      phase: feature.phase
    },
    findings,
    sections
  };
}

async function readContracts(filePath) {
  const contents = await fs.readFile(filePath, "utf8");
  const sections = [];
  const chunks = contents.split(/^##\s+/m).slice(1);

  for (const chunk of chunks) {
    const [rawName, ...bodyLines] = chunk.split(/\r?\n/);
    const name = rawName.trim();
    const body = bodyLines.join("\n");
    const endpointMatch = body.match(/^###\s+Endpoint\r?\n\r?\n(.+?)\r?\n/m);
    sections.push({
      name,
      endpoint: endpointMatch ? endpointMatch[1].trim() : null
    });
  }

  return sections;
}

function renderHumanContracts(payload, stdout) {
  stdout.write(`Project: ${payload.projectRoot}\n`);
  stdout.write(`Verdict: ${payload.verdict}\n`);

  if (payload.mode === "empty") {
    stdout.write("\nNo workflow features found.\n");
    return;
  }

  if (payload.mode === "error") {
    stdout.write(`\n- ${payload.findings[0]}\n`);
    return;
  }

  stdout.write(`\nFeature: ${payload.feature.name}\n`);
  stdout.write(`Phase: ${payload.feature.phase}\n`);

  stdout.write("\nFindings\n");
  if (payload.findings.length === 0) {
    stdout.write("- none\n");
  } else {
    for (const finding of payload.findings) {
      stdout.write(`- ${finding}\n`);
    }
  }

  stdout.write("\nContracts\n");
  if (payload.sections.length === 0) {
    stdout.write("- none detected\n");
    return;
  }

  for (const section of payload.sections) {
    stdout.write(`- ${section.name}${section.endpoint ? `: ${section.endpoint}` : ""}\n`);
  }
}
