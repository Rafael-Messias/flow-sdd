import path from "node:path";

import { loadProjectConfig, writeProjectConfig } from "../lib/config.mjs";
import { ensureDir } from "../lib/fs-utils.mjs";
import { syncProjectSkills } from "../lib/sync.mjs";

export async function runUpdate({ options, context }) {
  const projectRoot = path.resolve(context.cwd, options.project ?? ".");
  await ensureDir(projectRoot);
  const existingConfig = await loadProjectConfig(projectRoot);
  const config = {
    ...(existingConfig ?? {}),
    ...(options.profile ? { profile: options.profile } : {}),
    ...(options.tools ? { tools: options.tools.split(",").map((tool) => tool.trim()).filter(Boolean) } : {}),
    compat: {
      ...(existingConfig?.compat ?? {}),
      ...(options.compatCmdPrefix !== undefined ? { cmd_prefix: options.compatCmdPrefix } : {})
    }
  };

  const written = await writeProjectConfig(projectRoot, config);
  const result = await syncProjectSkills({
    packageRoot: context.packageRoot,
    projectRoot,
    config: written.config
  });

  context.io.stdout.write(`Updated flow-skills in ${projectRoot}\n`);
  context.io.stdout.write(`Tools: ${result.config.tools.join(", ")}\n`);
  return 0;
}
