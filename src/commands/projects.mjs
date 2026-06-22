import path from "node:path";

import { loadProjectConfig, normalizeProjectConfig } from "../lib/config.mjs";
import { collectWorkflowStatus } from "../lib/workflow-status.mjs";

export async function runProjects({ options, context }) {
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
    return payload.mode === "error" ? 1 : 0;
  }

  renderHumanProjects(payload, context.io.stdout);
  return payload.mode === "error" ? 1 : 0;
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
      mode: "workspace",
      features: status.features.map((feature) => ({
        name: feature.name,
        phase: feature.phase,
        projects: feature.projects.items
      }))
    };
  }

  return {
    ...base,
    mode: "feature",
    feature: {
      name: status.feature.name,
      phase: status.feature.phase,
      projects: status.feature.projects.items
    }
  };
}

function renderHumanProjects(payload, stdout) {
  stdout.write(`Project: ${payload.projectRoot}\n`);
  stdout.write(`Workspace mode: ${payload.workspace.mode}\n`);

  if (payload.mode === "empty") {
    stdout.write("\nNo workflow features found.\n");
    return;
  }

  if (payload.mode === "workspace") {
    stdout.write("\nProjects status by feature\n");
    for (const feature of payload.features) {
      stdout.write(`\n${feature.name} (${feature.phase})\n`);
      renderProjects(feature.projects, stdout);
    }
    return;
  }

  stdout.write(`\nFeature: ${payload.feature.name}\n`);
  stdout.write(`Phase: ${payload.feature.phase}\n`);
  stdout.write("\nProjects status\n");
  renderProjects(payload.feature.projects, stdout);
}

function renderProjects(projects, stdout) {
  if (projects.length === 0) {
    stdout.write("- no impacted projects detected\n");
    return;
  }

  for (const project of projects) {
    stdout.write(`- ${project.name}: completed ${project.counts.completed}, pending ${project.counts.pending}, in progress ${project.counts.inProgress}, blocked ${project.counts.blocked}\n`);
  }
}
