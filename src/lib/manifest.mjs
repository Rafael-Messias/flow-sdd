export const SKILLS = [
  { canonical: "flow-explore", aliases: ["explore"] },
  { canonical: "flow-doc-workshop", aliases: ["docs"] },
  { canonical: "flow-plan", aliases: ["plan"] },
  { canonical: "flow-prd", aliases: ["prd", "propose"] },
  { canonical: "flow-techspec", aliases: ["techspec", "design"] },
  { canonical: "flow-tasks", aliases: ["tasks", "breakdown"] },
  { canonical: "flow-validate-tasks", aliases: [] },
  { canonical: "flow-run-task", aliases: [] },
  { canonical: "flow-run", aliases: ["run"] },
  { canonical: "flow-review", aliases: ["review"] },
  { canonical: "flow-fix-review", aliases: ["fix-review"] },
  { canonical: "flow-verify", aliases: ["verify"] },
  { canonical: "flow-validation-plan", aliases: [] },
  { canonical: "flow-memory", aliases: [] }
];

export const PROFILE_PRESETS = {
  strict: {
    description: "Full governed workflow with planning, generic document drafting, execution, review, verification, validation, and memory.",
    skills: SKILLS.map((skill) => skill.canonical),
    aliases: true
  },
  quick: {
    description: "Lean workflow with exploration, planning, execution, review, and verification.",
    skills: [
      "flow-explore",
      "flow-plan",
      "flow-prd",
      "flow-techspec",
      "flow-tasks",
      "flow-validate-tasks",
      "flow-run-task",
      "flow-run",
      "flow-review",
      "flow-fix-review",
      "flow-verify"
    ],
    aliases: true
  },
  workspace: {
    description: "Planning-centric workspace profile focused on exploration, artifact design, generic docs, verification, and shared memory.",
    skills: [
      "flow-explore",
      "flow-doc-workshop",
      "flow-plan",
      "flow-prd",
      "flow-techspec",
      "flow-tasks",
      "flow-validate-tasks",
      "flow-verify",
      "flow-memory"
    ],
    aliases: true
  }
};

export const BUILTIN_TOOL_DESTINATIONS = {
  codex: [".agents", "skills"],
  claude: [".claude", "skills"]
};

export const DEFAULT_PROJECT_CONFIG = {
  profile: "strict",
  tools: ["codex", "claude"],
  toolTargets: {},
  workspace: {
    mode: "single"
  },
  projects: {},
  skills: PROFILE_PRESETS.strict.skills,
  delivery: "skills",
  aliases: PROFILE_PRESETS.strict.aliases,
  defaultLanguage: "pt-BR",
  rules: {},
  context: ""
};

export const SKILL_INDEX = new Map(SKILLS.map((skill) => [skill.canonical, skill]));

export function getProfilePreset(name) {
  return PROFILE_PRESETS[name] ?? PROFILE_PRESETS[DEFAULT_PROJECT_CONFIG.profile];
}

export function getProfileNames() {
  return Object.keys(PROFILE_PRESETS);
}

export function getAllManagedNames() {
  const names = new Set();

  for (const skill of SKILLS) {
    names.add(skill.canonical);
    for (const alias of skill.aliases) {
      names.add(alias);
    }
  }

  return [...names].sort();
}

export function resolveToolDestinations(customToolTargets = {}) {
  return {
    ...BUILTIN_TOOL_DESTINATIONS,
    ...customToolTargets
  };
}
