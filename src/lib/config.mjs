import fs from "node:fs/promises";
import path from "node:path";

import YAML from "yaml";

import {
  DEFAULT_PROJECT_CONFIG,
  SKILL_INDEX,
  getProfilePreset,
  resolveToolDestinations
} from "./manifest.mjs";

const CONFIG_FILE = "flow.config.yaml";

export async function loadProjectConfig(projectRoot) {
  const filePath = path.join(projectRoot, CONFIG_FILE);
  try {
    const contents = await fs.readFile(filePath, "utf8");
    return normalizeProjectConfig(YAML.parse(contents) ?? {});
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export function normalizeProjectConfig(rawConfig) {
  const profile = typeof rawConfig.profile === "string" && rawConfig.profile.trim()
    ? rawConfig.profile.trim()
    : DEFAULT_PROJECT_CONFIG.profile;
  const profilePreset = getProfilePreset(profile);
  const toolTargets = normalizeToolTargets(rawConfig.toolTargets ?? DEFAULT_PROJECT_CONFIG.toolTargets);
  const availableToolDestinations = resolveToolDestinations(toolTargets);
  const hasExplicitTools = Array.isArray(rawConfig.tools);
  const requestedTools = hasExplicitTools
    ? rawConfig.tools.map((tool) => String(tool).trim()).filter(Boolean)
    : null;
  const tools = hasExplicitTools
    ? requestedTools.filter((tool) => tool in availableToolDestinations)
    : [...DEFAULT_PROJECT_CONFIG.tools];
  const skills = Array.isArray(rawConfig.skills) && rawConfig.skills.length
    ? rawConfig.skills.filter((skill) => SKILL_INDEX.has(skill))
    : [...profilePreset.skills];

  return {
    profile,
    tools,
    toolTargets,
    workspace: normalizeWorkspace(rawConfig.workspace ?? DEFAULT_PROJECT_CONFIG.workspace),
    projects: normalizeProjects(rawConfig.projects ?? DEFAULT_PROJECT_CONFIG.projects),
    skills: skills.length ? skills : [...profilePreset.skills],
    delivery: rawConfig.delivery ?? DEFAULT_PROJECT_CONFIG.delivery,
    aliases: rawConfig.aliases ?? profilePreset.aliases ?? DEFAULT_PROJECT_CONFIG.aliases,
    defaultLanguage: normalizeLanguage(rawConfig.defaultLanguage ?? DEFAULT_PROJECT_CONFIG.defaultLanguage),
    rules: normalizeRules(rawConfig.rules ?? DEFAULT_PROJECT_CONFIG.rules),
    context: normalizeContext(rawConfig.context ?? DEFAULT_PROJECT_CONFIG.context)
  };
}

export async function writeProjectConfig(projectRoot, rawConfig) {
  const filePath = path.join(projectRoot, CONFIG_FILE);
  const config = normalizeProjectConfig(rawConfig);
  validateProjectConfig(config, rawConfig);
  const contents = YAML.stringify(config);
  await fs.writeFile(filePath, contents, "utf8");
  return { filePath, config };
}

export function validateProjectConfig(config, rawConfig = {}) {
  if (!Array.isArray(rawConfig.tools)) {
    return;
  }

  const requestedTools = rawConfig.tools.map((tool) => String(tool).trim()).filter(Boolean);
  if (requestedTools.length === 0) {
    throw new Error("At least one tool must be selected. Use built-in tools like `codex` or `claude`, or configure `toolTargets` for custom tools.");
  }

  if (config.tools.length === 0) {
    throw new Error(`No valid tools were selected from: ${requestedTools.join(", ")}.`);
  }
}

function normalizeWorkspace(rawWorkspace) {
  if (!rawWorkspace || typeof rawWorkspace !== "object" || Array.isArray(rawWorkspace)) {
    return { ...DEFAULT_PROJECT_CONFIG.workspace };
  }

  return {
    mode: rawWorkspace.mode === "multi-project" ? "multi-project" : "single"
  };
}

function normalizeProjects(rawProjects) {
  if (!rawProjects || typeof rawProjects !== "object" || Array.isArray(rawProjects)) {
    return {};
  }

  const normalized = {};

  for (const [name, rawProject] of Object.entries(rawProjects)) {
    const projectName = String(name).trim();
    if (!projectName || !rawProject || typeof rawProject !== "object" || Array.isArray(rawProject)) {
      continue;
    }

    const pathValue = typeof rawProject.path === "string" ? rawProject.path.trim() : "";
    const typeValue = typeof rawProject.type === "string" ? rawProject.type.trim() : "";
    const stackValue = typeof rawProject.stack === "string" ? rawProject.stack.trim() : "";

    normalized[projectName] = {
      ...(pathValue ? { path: pathValue } : {}),
      ...(typeValue ? { type: typeValue } : {}),
      ...(stackValue ? { stack: stackValue } : {})
    };
  }

  return normalized;
}

function normalizeToolTargets(rawToolTargets) {
  if (!rawToolTargets || typeof rawToolTargets !== "object" || Array.isArray(rawToolTargets)) {
    return {};
  }

  const normalized = {};

  for (const [tool, rawTarget] of Object.entries(rawToolTargets)) {
    const parts = normalizeToolTarget(rawTarget);
    if (tool.trim() && parts.length > 0) {
      normalized[tool.trim()] = parts;
    }
  }

  return normalized;
}

function normalizeToolTarget(rawTarget) {
  if (Array.isArray(rawTarget)) {
    return rawTarget.map((part) => String(part).trim()).filter(Boolean);
  }

  if (typeof rawTarget === "string") {
    return rawTarget
      .split(/[\\/]+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeRules(rawRules) {
  if (rawRules === null || rawRules === undefined || rawRules === "") {
    return {};
  }

  if (typeof rawRules === "string") {
    return {
      general: [rawRules.trim()].filter(Boolean)
    };
  }

  if (Array.isArray(rawRules)) {
    return {
      general: rawRules.map((entry) => String(entry).trim()).filter(Boolean)
    };
  }

  if (typeof rawRules !== "object") {
    return {
      general: [String(rawRules).trim()].filter(Boolean)
    };
  }

  const normalized = {};

  for (const [key, value] of Object.entries(rawRules)) {
    const rules = Array.isArray(value) ? value : [value];
    const entries = rules.map((entry) => String(entry).trim()).filter(Boolean);
    if (entries.length > 0) {
      normalized[key] = entries;
    }
  }

  return normalized;
}

function normalizeContext(rawContext) {
  if (rawContext === null || rawContext === undefined) {
    return "";
  }

  if (typeof rawContext === "string") {
    return rawContext.trim();
  }

  if (Array.isArray(rawContext)) {
    return rawContext.map((entry) => String(entry).trim()).filter(Boolean).join("\n");
  }

  return String(rawContext).trim();
}

function normalizeLanguage(rawLanguage) {
  if (rawLanguage === null || rawLanguage === undefined) {
    return DEFAULT_PROJECT_CONFIG.defaultLanguage;
  }

  const normalized = String(rawLanguage).trim();
  return normalized || DEFAULT_PROJECT_CONFIG.defaultLanguage;
}
