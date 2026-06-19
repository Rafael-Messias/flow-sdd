import { BUILTIN_TOOL_DESTINATIONS, PROFILE_PRESETS, SKILLS } from "../lib/manifest.mjs";

export async function runList({ options, context }) {
  if (options.json) {
    context.io.stdout.write(
      JSON.stringify(
        {
          skills: SKILLS,
          profiles: PROFILE_PRESETS,
          tools: Object.keys(BUILTIN_TOOL_DESTINATIONS),
          supportsCustomToolTargets: true
        },
        null,
        2
      ) + "\n"
    );
    return 0;
  }

  context.io.stdout.write("Canonical skills\n\n");
  for (const skill of SKILLS) {
    const parts = [];
    if (skill.legacy) {
      parts.push(`legacy: ${skill.legacy}`);
    }
    if (skill.aliases.length) {
      parts.push(`aliases: ${skill.aliases.join(", ")}`);
    }
    const suffix = parts.length ? ` (${parts.join(" | ")})` : "";
    context.io.stdout.write(`- ${skill.canonical}${suffix}\n`);
  }

  context.io.stdout.write("\nProfiles\n\n");
  for (const [profile, preset] of Object.entries(PROFILE_PRESETS)) {
    context.io.stdout.write(`- ${profile}: ${preset.description}\n`);
  }

  context.io.stdout.write("\nTool targets\n\n");
  for (const [tool, destinationParts] of Object.entries(BUILTIN_TOOL_DESTINATIONS)) {
    context.io.stdout.write(`- ${tool} -> ${destinationParts.join("/")}\n`);
  }
  context.io.stdout.write("- custom tool targets -> define `toolTargets` in flow.config.yaml\n");

  return 0;
}
