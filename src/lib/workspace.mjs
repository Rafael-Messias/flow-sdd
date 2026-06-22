import path from "node:path";

export function resolveWorkspace(config, projectRoot) {
  const workspaceMode = config?.workspace?.mode === "multi-project" ? "multi-project" : "single";

  if (workspaceMode !== "multi-project") {
    return {
      mode: "single",
      root: projectRoot,
      projects: {
        default: {
          name: "default",
          path: projectRoot,
          relativePath: ".",
          type: "repository",
          stack: null,
          configured: false
        }
      },
      projectNames: ["default"]
    };
  }

  const projects = {};

  for (const [name, projectConfig] of Object.entries(config?.projects ?? {})) {
    const projectPath = typeof projectConfig?.path === "string" && projectConfig.path.trim()
      ? path.resolve(projectRoot, projectConfig.path.trim())
      : projectRoot;

    projects[name] = {
      name,
      path: projectPath,
      relativePath: normalizeRelativePath(path.relative(projectRoot, projectPath) || "."),
      type: normalizeOptionalString(projectConfig?.type) ?? "repository",
      stack: normalizeOptionalString(projectConfig?.stack),
      configured: true
    };
  }

  return {
    mode: "multi-project",
    root: projectRoot,
    projects,
    projectNames: Object.keys(projects).sort()
  };
}

export function resolveTaskProject({ workspace, projectName, repository }) {
  const normalizedProjectName = normalizeOptionalString(projectName);
  const normalizedRepository = normalizeOptionalString(repository);

  if (workspace.mode === "single") {
    const resolved = normalizedProjectName && workspace.projects[normalizedProjectName]
      ? workspace.projects[normalizedProjectName]
      : workspace.projects.default;

    return {
      name: resolved.name,
      configured: true,
      path: resolved.path,
      relativePath: resolved.relativePath,
      type: resolved.type,
      stack: resolved.stack,
      repository: normalizedRepository ?? resolved.relativePath
    };
  }

  if (!normalizedProjectName) {
    return {
      name: "unassigned",
      configured: false,
      path: null,
      relativePath: null,
      type: null,
      stack: null,
      repository: normalizedRepository
    };
  }

  const resolved = workspace.projects[normalizedProjectName];
  if (!resolved) {
    return {
      name: normalizedProjectName,
      configured: false,
      path: null,
      relativePath: null,
      type: null,
      stack: null,
      repository: normalizedRepository
    };
  }

  return {
    name: resolved.name,
    configured: true,
    path: resolved.path,
    relativePath: resolved.relativePath,
    type: resolved.type,
    stack: resolved.stack,
    repository: normalizedRepository ?? resolved.relativePath
  };
}

function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
}

function normalizeRelativePath(relativePath) {
  return relativePath.split(path.sep).join("/");
}
