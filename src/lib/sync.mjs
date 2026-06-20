import fs from "node:fs/promises";
import path from "node:path";

import { ensureDir, copyDir, pathExists, removeDirIfExists } from "./fs-utils.mjs";
import {
  DEFAULT_PROJECT_CONFIG,
  PROFILE_PRESETS,
  SKILLS,
  resolveToolDestinations
} from "./manifest.mjs";

export async function syncProjectSkills({ packageRoot, projectRoot, config }) {
  const normalizedConfig = {
    ...DEFAULT_PROJECT_CONFIG,
    ...config,
    compat: {
      ...DEFAULT_PROJECT_CONFIG.compat,
      ...(config.compat ?? {})
    }
  };
  const selectedSkills = new Set(normalizedConfig.skills);
  const toolDestinations = resolveToolDestinations(normalizedConfig.toolTargets);

  for (const [tool, destinationParts] of Object.entries(toolDestinations)) {
    const destinationRoot = path.join(projectRoot, ...destinationParts);
    await ensureDir(destinationRoot);
    await removeManagedSkillDirectories(destinationRoot);

    if (!normalizedConfig.tools.includes(tool)) {
      continue;
    }

    const transforms = buildTransforms(normalizedConfig);

    for (const skill of SKILLS) {
      if (!selectedSkills.has(skill.canonical)) {
        continue;
      }

      const sourceDir = path.join(packageRoot, "skills-src", skill.canonical);

      await copyDir(sourceDir, path.join(destinationRoot, skill.canonical), transforms.canonical(skill));

      if (normalizedConfig.aliases) {
        for (const alias of skill.aliases) {
          await copyDir(sourceDir, path.join(destinationRoot, alias), transforms.alias(skill, alias));
        }
      }

      if (normalizedConfig.compat.cmd_prefix && skill.legacy) {
        await copyDir(sourceDir, path.join(destinationRoot, skill.legacy), transforms.legacy(skill));
      }
    }
  }

  return { config: normalizedConfig };
}

export async function getInstalledSkillStatus({ projectRoot, config }) {
  const tools = [];
  const normalizedConfig = {
    ...DEFAULT_PROJECT_CONFIG,
    ...config,
    compat: {
      ...DEFAULT_PROJECT_CONFIG.compat,
      ...(config.compat ?? {})
    }
  };
  const toolDestinations = resolveToolDestinations(normalizedConfig.toolTargets);

  for (const tool of normalizedConfig.tools) {
    const destinationParts = toolDestinations[tool];
    if (!destinationParts) {
      continue;
    }

    const destinationRoot = path.join(projectRoot, ...destinationParts);
    const installedNames = await readInstalledNames(destinationRoot);
    const skills = [];

    for (const skill of SKILLS) {
      if (!normalizedConfig.skills.includes(skill.canonical)) {
        continue;
      }

      skills.push({
        name: skill.canonical,
        present: await pathExists(path.join(destinationRoot, skill.canonical))
      });

      if (normalizedConfig.aliases) {
        for (const alias of skill.aliases) {
          skills.push({
            name: alias,
            present: await pathExists(path.join(destinationRoot, alias))
          });
        }
      }

      if (normalizedConfig.compat.cmd_prefix && skill.legacy) {
        skills.push({
          name: skill.legacy,
          present: await pathExists(path.join(destinationRoot, skill.legacy))
        });
      }
    }

    tools.push({
      tool,
      destination: destinationRoot,
      skills,
      unexpected: installedNames.filter((name) => !buildExpectedNamesForTool(normalizedConfig).has(name))
    });
  }

  return {
    tools,
    profiles: PROFILE_PRESETS
  };
}

function buildTransforms(config) {
  return {
    canonical(skill) {
      return (contents, sourcePath) => transformSkillContents(contents, sourcePath, skill.canonical, config);
    },
    alias(skill, alias) {
      return (contents, sourcePath) => transformSkillContents(contents, sourcePath, alias, config, skill.canonical);
    },
    legacy(skill) {
      return (contents, sourcePath) => transformSkillContents(contents, sourcePath, skill.legacy, config, skill.canonical);
    }
  };
}

function transformSkillContents(contents, sourcePath, installedName, config, replaceSelfReferenceFrom = null) {
  let transformed = contents;

  if (replaceSelfReferenceFrom) {
    transformed = transformed.split(replaceSelfReferenceFrom).join(installedName);
  }

  if (path.basename(sourcePath).toLowerCase() === "skill.md") {
    transformed = injectProjectOverlay(transformed, config);
  }

  return transformed;
}

function injectProjectOverlay(contents, config) {
  const sections = [];

  sections.push("## Flow Package Overlay");
  sections.push("");
  sections.push("Estas instrucoes sao geradas a partir de `flow.config.yaml` pelo pacote `flow-sdd`.");
  sections.push("");
  sections.push(`- Perfil ativo: \`${config.profile}\``);
  sections.push(`- Compatibilidade legada \`cmd-*\`: ${config.compat.cmd_prefix ? "enabled" : "disabled"}`);
  sections.push(`- Aliases de UX: ${config.aliases ? "enabled" : "disabled"}`);
  sections.push(`- Idioma padrao do projeto: \`${config.defaultLanguage}\``);

  if (config.context) {
    sections.push("");
    sections.push("### Contexto do Projeto");
    sections.push(config.context);
  }

  const ruleEntries = Object.entries(config.rules);
  if (ruleEntries.length > 0) {
    sections.push("");
    sections.push("### Regras do Projeto");
    for (const [scope, rules] of ruleEntries) {
      sections.push(`- ${scope}: ${rules.join(" | ")}`);
    }
  }

  return `${contents.trimEnd()}\n\n${sections.join("\n")}\n`;
}

async function removeManagedSkillDirectories(destinationRoot) {
  for (const skill of SKILLS) {
    await removeDirIfExists(path.join(destinationRoot, skill.canonical));
    for (const alias of skill.aliases) {
      await removeDirIfExists(path.join(destinationRoot, alias));
    }
    if (skill.legacy) {
      await removeDirIfExists(path.join(destinationRoot, skill.legacy));
    }
  }
}

async function readInstalledNames(destinationRoot) {
  if (!(await pathExists(destinationRoot))) {
    return [];
  }

  const entries = await fs.readdir(destinationRoot, { withFileTypes: true });
  const managedNames = new Set();

  for (const skill of SKILLS) {
    managedNames.add(skill.canonical);
    for (const alias of skill.aliases) {
      managedNames.add(alias);
    }
    if (skill.legacy) {
      managedNames.add(skill.legacy);
    }
  }

  return entries
    .filter((entry) => entry.isDirectory() && managedNames.has(entry.name))
    .map((entry) => entry.name)
    .sort();
}

function buildExpectedNamesForTool(config) {
  const names = new Set();

  for (const skill of SKILLS) {
    if (!config.skills.includes(skill.canonical)) {
      continue;
    }

    names.add(skill.canonical);

    if (config.aliases) {
      for (const alias of skill.aliases) {
        names.add(alias);
      }
    }

    if (config.compat.cmd_prefix && skill.legacy) {
      names.add(skill.legacy);
    }
  }

  return names;
}
