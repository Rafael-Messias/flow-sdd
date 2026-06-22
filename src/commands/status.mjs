import path from "node:path";

import { loadProjectConfig, normalizeProjectConfig } from "../lib/config.mjs";
import { collectWorkflowStatus } from "../lib/workflow-status.mjs";

export async function runStatus({ options, context }) {
  const projectRoot = path.resolve(context.cwd, options.project ?? ".");
  const loadedConfig = await loadProjectConfig(projectRoot);
  const config = normalizeProjectConfig(loadedConfig ?? {});
  const status = await collectWorkflowStatus({
    projectRoot,
    feature: options.feature,
    config
  });

  const payload = {
    projectRoot,
    config: {
      present: Boolean(loadedConfig),
      profile: config.profile,
      tools: config.tools
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
  stdout.write(`Tools: ${payload.config.tools.length ? payload.config.tools.join(", ") : "none selected"}\n`);
  stdout.write(`Workspace mode: ${payload.workspace.mode}\n`);

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
      if (feature.mode === "multi-project") {
        stdout.write(`  projects: ${feature.projects.items.map((project) => `${project.name} [done ${project.counts.completed}, pending ${project.counts.pending}, blocked ${project.counts.blocked}]`).join("; ")}\n`);
      }
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
  stdout.write(`- Impact map: ${formatPresence(feature.artifacts.impactMapPresent)}\n`);
  stdout.write(`- Contracts: ${formatPresence(feature.artifacts.contractsPresent)}\n`);
  stdout.write(`- Release plan: ${formatPresence(feature.artifacts.releasePlanPresent)}\n`);
  stdout.write(`- Rollback plan: ${formatPresence(feature.artifacts.rollbackPlanPresent)}\n`);
  stdout.write(`- Task files: ${feature.tasks.total} (pending ${feature.tasks.counts.pending}, in progress ${feature.tasks.counts.inProgress}, completed ${feature.tasks.counts.completed}, blocked ${feature.tasks.counts.blocked})\n`);
  stdout.write(`- Executable tasks: ${feature.tasks.execution.executableTasks.length}\n`);
  stdout.write(`- ADRs: ${feature.artifacts.adrCount}\n`);
  stdout.write(`- Reviews: ${feature.reviews.rounds} rounds, ${feature.reviews.openIssues} open issues\n`);
  stdout.write(`- Validation final: test plan ${formatPresence(feature.validation.testPlanPresent)}, scenarios ${feature.validation.scenarioCount}, evidence report ${formatPresence(feature.validation.evidenceReportPresent)}\n`);
  stdout.write(`- Validation draft: test plan ${formatPresence(feature.validation.preliminaryTestPlanPresent)}, scenarios ${feature.validation.preliminaryScenarioCount}, evidence report ${formatPresence(feature.validation.preliminaryEvidenceReportPresent)}\n`);
  stdout.write(`- Memory: ${feature.memory.fileCount} files\n`);

  if (feature.projects.items.length > 0) {
    stdout.write("\nProjects\n");
    for (const project of feature.projects.items) {
      stdout.write(`- ${project.name}: completed ${project.counts.completed}, pending ${project.counts.pending}, in progress ${project.counts.inProgress}, blocked ${project.counts.blocked}\n`);
    }
  }

  if (feature.tasks.execution.blockedTasks.length > 0) {
    stdout.write("\nDependency-blocked tasks\n");
    for (const task of feature.tasks.execution.blockedTasks) {
      stdout.write(`- ${task.id} (${task.project}): ${task.blockedReasons.join("; ")}\n`);
    }
  }

  stdout.write("\nBlockers\n");
  if (feature.blockers.length === 0) {
    stdout.write("- none\n");
  } else {
    for (const blocker of feature.blockers) {
      stdout.write(`- ${blocker}\n`);
    }
  }

  if (feature.warnings.length > 0) {
    stdout.write("\nWarnings\n");
    for (const warning of feature.warnings) {
      stdout.write(`- ${warning}\n`);
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
