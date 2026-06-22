import path from "node:path";

import { loadProjectConfig, normalizeProjectConfig } from "../lib/config.mjs";
import { collectWorkflowStatus } from "../lib/workflow-status.mjs";

export async function runNext({ options, context }) {
  const projectRoot = path.resolve(context.cwd, options.project ?? ".");
  const loadedConfig = await loadProjectConfig(projectRoot);
  const config = normalizeProjectConfig(loadedConfig ?? {});
  const status = await collectWorkflowStatus({
    projectRoot,
    feature: options.feature,
    config
  });

  const payload = buildPayload(projectRoot, loadedConfig, config, status);

  if (options.json) {
    context.io.stdout.write(JSON.stringify(payload, null, 2) + "\n");
    return 0;
  }

  renderHumanNext(payload, context.io.stdout);
  return 0;
}

function buildPayload(projectRoot, loadedConfig, config, status) {
  const base = {
    projectRoot,
    workspace: status.workspace,
    config: {
      present: Boolean(loadedConfig),
      profile: config.profile,
      tools: config.tools
    }
  };

  if (status.mode === "feature") {
    return {
      ...base,
      mode: "feature",
      feature: {
        name: status.feature.name,
        directory: status.feature.directory,
        phase: status.feature.phase
      },
      nextStep: status.feature.nextStep,
      blockers: status.feature.blockers,
      warnings: status.feature.warnings,
      blockedTasks: status.feature.tasks.execution.blockedTasks
    };
  }

  if (status.mode === "workspace") {
    return {
      ...base,
      mode: "workspace",
      nextStep: status.nextStep,
      options: status.features.map((feature) => ({
        name: feature.name,
        mode: feature.mode,
        phase: feature.phase,
        nextStep: feature.nextStep,
        projects: feature.projects.items
      }))
    };
  }

  return {
    ...base,
    mode: "empty",
    nextStep: status.nextStep,
    options: []
  };
}

function renderHumanNext(payload, stdout) {
  stdout.write(`Project: ${payload.projectRoot}\n`);
  stdout.write(`Config file: ${payload.config.present ? "present" : "missing (using defaults)"}\n`);
  stdout.write(`Profile: ${payload.config.profile}\n`);
  stdout.write(`Tools: ${payload.config.tools.join(", ")}\n`);
  stdout.write(`Workspace mode: ${payload.workspace.mode}\n`);

  if (payload.mode === "feature") {
    stdout.write(`\nFeature: ${payload.feature.name}\n`);
    stdout.write(`Directory: ${payload.feature.directory}\n`);
    stdout.write(`Phase: ${payload.feature.phase}\n`);
    stdout.write(`Next step: ${formatNextStep(payload.nextStep)}\n`);

    if (payload.blockers.length > 0) {
      stdout.write("\nOpen blockers\n");
      for (const blocker of payload.blockers) {
        stdout.write(`- ${blocker}\n`);
      }
    }

    if (payload.blockedTasks.length > 0) {
      stdout.write("\nBlocked by dependencies\n");
      for (const task of payload.blockedTasks) {
        stdout.write(`- ${task.id} (${task.project}): ${task.blockedReasons.join("; ")}\n`);
      }
    }

    if (payload.warnings.length > 0) {
      stdout.write("\nWarnings\n");
      for (const warning of payload.warnings) {
        stdout.write(`- ${warning}\n`);
      }
    }

    return;
  }

  if (payload.mode === "workspace") {
    stdout.write(`\nRecommended next step: ${formatNextStep(payload.nextStep)}\n`);
    stdout.write("\nOptions\n");
    for (const option of payload.options) {
      stdout.write(`- ${option.name}: ${option.phase} -> ${formatNextStep(option.nextStep)}\n`);
      if (option.mode === "multi-project") {
        stdout.write(`  projects: ${option.projects.map((project) => `${project.name} [done ${project.counts.completed}, pending ${project.counts.pending}, blocked ${project.counts.blocked}]`).join("; ")}\n`);
      }
    }
    stdout.write("Use --feature <name> to lock the recommendation to a single workflow.\n");
    return;
  }

  stdout.write(`\nNext step: ${formatNextStep(payload.nextStep)}\n`);
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
