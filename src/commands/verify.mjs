import path from "node:path";

import { loadProjectConfig, normalizeProjectConfig } from "../lib/config.mjs";
import { collectWorkflowVerification } from "../lib/workflow-verify.mjs";

export async function runVerify({ options, context }) {
  const projectRoot = path.resolve(context.cwd, options.project ?? ".");
  const loadedConfig = await loadProjectConfig(projectRoot);
  const config = normalizeProjectConfig(loadedConfig ?? {});
  const verification = await collectWorkflowVerification({
    projectRoot,
    feature: options.feature
  });

  const payload = {
    projectRoot,
    config: {
      present: Boolean(loadedConfig),
      profile: config.profile,
      tools: config.tools
    },
    ...verification
  };

  if (options.json) {
    context.io.stdout.write(JSON.stringify(payload, null, 2) + "\n");
  } else {
    renderHumanVerify(payload, context.io.stdout);
  }

  return payload.verdict === "PASS" ? 0 : 1;
}

function renderHumanVerify(payload, stdout) {
  stdout.write(`Project: ${payload.projectRoot}\n`);
  stdout.write(`Config file: ${payload.config.present ? "present" : "missing (using defaults)"}\n`);
  stdout.write(`Profile: ${payload.config.profile}\n`);
  stdout.write(`Tools: ${payload.config.tools.join(", ")}\n`);
  stdout.write(`Verdict: ${payload.verdict}\n`);

  if (payload.mode === "empty") {
    stdout.write("\nNo workflow features found. Nothing to verify.\n");
    stdout.write(`Next step: ${formatNextStep(payload.nextStep)}\n`);
    return;
  }

  if (payload.mode === "workspace") {
    stdout.write("\nFeatures\n");
    for (const feature of payload.features) {
      stdout.write(`- ${feature.name}: ${feature.verdict} (${feature.phase})\n`);
      stdout.write(`  next: ${formatNextStep(feature.nextStep)}\n`);
      stdout.write(`  findings: completeness ${feature.counts.completeness}, correctness ${feature.counts.correctness}, coherence ${feature.counts.coherence}\n`);
    }
    stdout.write(`\nRecommendation: ${formatNextStep(payload.nextStep)}\n`);
    return;
  }

  renderFeature(payload.feature, stdout);
}

function renderFeature(feature, stdout) {
  stdout.write(`\nFeature: ${feature.name}\n`);
  stdout.write(`Directory: ${feature.directory}\n`);
  stdout.write(`Phase: ${feature.phase}\n`);
  stdout.write(`Next step: ${formatNextStep(feature.nextStep)}\n`);
  stdout.write(`Verdict: ${feature.verdict}\n`);

  renderCategory("Completeness", feature.findings.completeness, stdout);
  renderCategory("Correctness", feature.findings.correctness, stdout);
  renderCategory("Coherence", feature.findings.coherence, stdout);
}

function renderCategory(label, entries, stdout) {
  stdout.write(`\n${label}\n`);
  if (entries.length === 0) {
    stdout.write("- none\n");
    return;
  }

  for (const entry of entries) {
    stdout.write(`- ${entry}\n`);
  }
}

function formatNextStep(nextStep) {
  if (!nextStep) {
    return "manual follow-up required";
  }
  if (nextStep.command) {
    return `${nextStep.command} (${nextStep.reason})`;
  }
  return nextStep.reason;
}
