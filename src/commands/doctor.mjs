import path from "node:path";

import { loadProjectConfig, normalizeProjectConfig } from "../lib/config.mjs";
import { getInstalledSkillStatus } from "../lib/sync.mjs";

export async function runDoctor({ options, context }) {
  const projectRoot = path.resolve(context.cwd, options.project ?? ".");
  const loadedConfig = await loadProjectConfig(projectRoot);
  const config = normalizeProjectConfig(loadedConfig ?? {});
  const status = await getInstalledSkillStatus({
    projectRoot,
    config
  });

  let issueCount = 0;
  context.io.stdout.write(`Project: ${projectRoot}\n`);
  context.io.stdout.write(`Config file: ${loadedConfig ? "present" : "missing (using defaults)"}\n`);
  context.io.stdout.write(`Profile: ${config.profile}\n`);
  context.io.stdout.write(`Skills selected: ${config.skills.join(", ")}\n`);

  for (const toolStatus of status.tools) {
    context.io.stdout.write(`\n[${toolStatus.tool}] ${toolStatus.destination}\n`);
    for (const item of toolStatus.skills) {
      const line = `- ${item.name}: ${item.present ? "OK" : "MISSING"}\n`;
      context.io.stdout.write(line);
      if (!item.present) {
        issueCount += 1;
      }
    }

    for (const unexpected of toolStatus.unexpected) {
      context.io.stdout.write(`- ${unexpected}: UNEXPECTED\n`);
      issueCount += 1;
    }
  }

  if (issueCount > 0) {
    context.io.stderr.write(`\nDoctor found ${issueCount} missing managed skill directories.\n`);
    return options.strict ? 1 : 0;
  }

  context.io.stdout.write("\nDoctor found no managed-skill issues.\n");
  return 0;
}
