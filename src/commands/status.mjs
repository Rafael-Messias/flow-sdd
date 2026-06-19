import path from "node:path";

import { loadProjectConfig, normalizeProjectConfig } from "../lib/config.mjs";
import { collectWorkflowStatus } from "../lib/workflow-status.mjs";

export async function runStatus({ options, context }) {
  const projectRoot = path.resolve(context.cwd, options.project ?? ".");
  const loadedConfig = await loadProjectConfig(projectRoot);
  const config = normalizeProjectConfig(loadedConfig ?? {});
  const status = await collectWorkflowStatus({
    projectRoot,
    feature: options.feature
  });

  const payload = {
    projectRoot,
    config: {
      present: Boolean(loadedConfig),
      profile: config.profile,
      tools: config.tools,
      compatCmdPrefix: config.compat.cmd_prefix
    },
    ...status
  };

  if (options.json) {
    context.io.stdout.write(JSON.stringify(payload, null, 2) + "\n");
    return 0;
  }

  renderHumanStatus(payload, context.io.stdout);
  return 0;
}

function renderHumanStatus(payload, stdout) {
  stdout.write(`Project: ${payload.projectRoot}\n`);
  stdout.write(`Config file: ${payload.config.present ? "present" : "missing (using defaults)"}\n`);
  stdout.write(`Profile: ${payload.config.profile}\n`);
  stdout.write(`Tools: ${payload.config.tools.join(", ")}\n`);

  if (payload.mode === "empty") {
    stdout.write(`\nWorkflow roots: ${formatWorkflowRoots(payload.workflowRoots)}\n`);
    stdout.write("No workflow features found.\n");
    stdout.write(`Next step: ${formatNextStep(payload.nextStep)}\n`);
    return;
  }

  if (payload.mode === "workspace") {
    stdout.write(`\nWorkflow roots: ${formatWorkflowRoots(payload.workflowRoots)}\n`);
    stdout.write("\nFeatures\n");
    for (const feature of payload.features) {
      stdout.write(`- ${feature.name}: ${feature.phase} -> ${formatNextStep(feature.nextStep)}\n`);
    }
    stdout.write(`\nRecommendation: ${formatNextStep(payload.nextStep)}\n`);
    stdout.write("Use --feature <name> for a detailed inspection.\n");
    return;
  }

  const feature = payload.feature;
  stdout.write(`\nFeature: ${feature.name}\n`);
  stdout.write(`Directory: ${feature.directory}\n`);
  stdout.write(`Workflow root: ${feature.workflowRoot}\n`);
  stdout.write(`Phase: ${feature.phase}\n`);
  stdout.write(`Next step: ${formatNextStep(feature.nextStep)}\n`);

  stdout.write("\nArtifacts\n");
  stdout.write(`- PRD: ${formatPresence(feature.artifacts.prdPresent)}\n`);
  stdout.write(`- TechSpec: ${formatPresence(feature.artifacts.techspecPresent)}\n`);
  stdout.write(`- Task list: ${formatPresence(feature.artifacts.tasksMasterPresent)}\n`);
  stdout.write(`- Task files: ${feature.tasks.total} (pending ${feature.tasks.counts.pending}, in progress ${feature.tasks.counts.inProgress}, completed ${feature.tasks.counts.completed}, blocked ${feature.tasks.counts.blocked})\n`);
  stdout.write(`- ADRs: ${feature.artifacts.adrCount}\n`);
  stdout.write(`- Reviews: ${feature.reviews.rounds} rounds, ${feature.reviews.openIssues} open issues\n`);
  stdout.write(`- Validation final: test plan ${formatPresence(feature.validation.testPlanPresent)}, scenarios ${feature.validation.scenarioCount}, evidence report ${formatPresence(feature.validation.evidenceReportPresent)}\n`);
  stdout.write(`- Validation draft: test plan ${formatPresence(feature.validation.preliminaryTestPlanPresent)}, scenarios ${feature.validation.preliminaryScenarioCount}, evidence report ${formatPresence(feature.validation.preliminaryEvidenceReportPresent)}\n`);
  stdout.write(`- Memory: ${feature.memory.fileCount} files\n`);

  stdout.write("\nBlockers\n");
  if (feature.blockers.length === 0) {
    stdout.write("- none\n");
  } else {
    for (const blocker of feature.blockers) {
      stdout.write(`- ${blocker}\n`);
    }
  }
}

function formatPresence(value) {
  return value ? "present" : "missing";
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

function formatWorkflowRoots(workflowRoots) {
  if (workflowRoots.length === 0) {
    return "none";
  }
  return workflowRoots.map((root) => root.label).join(", ");
}
