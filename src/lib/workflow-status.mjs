import fs from "node:fs/promises";
import path from "node:path";

import YAML from "yaml";

import { pathExists } from "./fs-utils.mjs";
import { resolveTaskProject, resolveWorkspace } from "./workspace.mjs";

const WORKFLOW_ROOT_SPECS = [{ kind: "tasks", parts: ["tasks"], label: "tasks/" }];
const TASK_FILE_PATTERN = /^task_\d+\.md$/i;
const REVIEW_DIR_PATTERN = /^reviews-(\d+)$/i;
const ISSUE_FILE_PATTERN = /^issue_\d+\.md$/i;
const ADR_FILE_PATTERN = /^adr-\d+\.md$/i;
const VALIDATION_SCENARIO_PATTERN = /^_validation_scenarios_.+\.md$/i;
const PRELIMINARY_VALIDATION_SCENARIO_PATTERN = /^_validation_scenarios_.+\.preliminary\.md$/i;
const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const PHASE_PRIORITY = new Map([
  ["blocked", 0],
  ["review-fixes", 1],
  ["executing", 2],
  ["ready-for-review", 3],
  ["ready-for-validation", 4],
  ["validation-planned", 5],
  ["ready-to-run", 6],
  ["needs-tasks", 7],
  ["needs-techspec", 8],
  ["needs-prd", 9],
  ["validation-documented", 10]
]);
const INTEGRATION_PROJECT_TYPES = new Set(["api", "worker", "service", "backend"]);
const DATABASE_HINTS = ["database", "db", "migration", "schema", "sql"];

export async function collectWorkflowStatus({ projectRoot, feature, config = {} }) {
  const workspace = resolveWorkspace(config, projectRoot);
  const workflowRoots = await discoverWorkflowRoots(projectRoot);
  const features = await collectFeatures(workflowRoots, projectRoot, workspace);

  if (feature) {
    const selectedFeature = await resolveFeature(features, projectRoot, feature, workspace);
    return {
      mode: "feature",
      workspace: serializeWorkspace(workspace),
      workflowRoots: workflowRoots.map(serializeWorkflowRoot),
      feature: selectedFeature
    };
  }

  if (features.length === 0) {
    return {
      mode: "empty",
      workspace: serializeWorkspace(workspace),
      workflowRoots: workflowRoots.map(serializeWorkflowRoot),
      features: [],
      nextStep: {
        command: "flow-plan <feature>",
        reason: "No workflow artifacts were found."
      }
    };
  }

  if (features.length === 1) {
    return {
      mode: "feature",
      workspace: serializeWorkspace(workspace),
      workflowRoots: workflowRoots.map(serializeWorkflowRoot),
      feature: features[0]
    };
  }

  return {
    mode: "workspace",
    workspace: serializeWorkspace(workspace),
    workflowRoots: workflowRoots.map(serializeWorkflowRoot),
    features,
    nextStep: {
      ...features[0].nextStep,
      reason: `Multiple workflow features were found. Start with ${features[0].name} because it is in phase ${features[0].phase}.`
    }
  };
}

async function discoverWorkflowRoots(projectRoot) {
  const workflowRoots = [];

  for (const spec of WORKFLOW_ROOT_SPECS) {
    const rootPath = path.join(projectRoot, ...spec.parts);
    if (await pathExists(rootPath)) {
      workflowRoots.push({
        ...spec,
        path: rootPath
      });
    }
  }

  return workflowRoots;
}

async function collectFeatures(workflowRoots, projectRoot, workspace) {
  const features = [];

  for (const workflowRoot of workflowRoots) {
    const entries = await fs.readdir(workflowRoot.path, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const featureDir = path.join(workflowRoot.path, entry.name);
      if (!(await looksLikeFeatureDirectory(featureDir))) {
        continue;
      }
      features.push(await inspectFeatureDirectory(featureDir, workflowRoot, projectRoot, workspace));
    }
  }

  return features.sort(compareFeatures);
}

async function resolveFeature(features, projectRoot, feature, workspace) {
  const directPath = path.resolve(projectRoot, feature);
  if (await pathExists(directPath)) {
    return inspectFeatureDirectory(directPath, deriveWorkflowRootFromPath(projectRoot, directPath), projectRoot, workspace);
  }

  const matches = features.filter((item) => item.name === feature);
  if (matches.length === 1) {
    return matches[0];
  }

  if (matches.length > 1) {
    throw new Error(`Feature '${feature}' is ambiguous across workflow roots. Use a path instead.`);
  }

  throw new Error(`Feature '${feature}' was not found under tasks/.`);
}

async function inspectFeatureDirectory(featureDir, workflowRoot, projectRoot, workspace) {
  const entries = await fs.readdir(featureDir, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  const directories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const masterTaskList = files.includes("_tasks.md")
    ? await inspectMasterTaskList(path.join(featureDir, "_tasks.md"))
    : { present: false, rows: [], columns: {}, error: null };

  const taskFiles = files.filter((fileName) => TASK_FILE_PATTERN.test(fileName)).sort();
  const taskSummaries = await Promise.all(
    taskFiles.map((fileName) => inspectTaskFile(path.join(featureDir, fileName), fileName, workspace))
  );
  const analyzedTasks = analyzeTaskGraph(taskSummaries, workspace);
  const reviewDirectories = directories
    .map((name) => ({ name, match: name.match(REVIEW_DIR_PATTERN) }))
    .filter((entry) => entry.match)
    .sort((left, right) => Number(left.match[1]) - Number(right.match[1]));
  const reviews = await Promise.all(
    reviewDirectories.map((entry) => inspectReviewDirectory(path.join(featureDir, entry.name), entry.name))
  );

  const taskCounts = countTaskStatuses(taskSummaries);
  const reviewCounts = countReviewStatuses(reviews);
  const validation = {
    testPlanPresent: files.includes("_test_plan.md"),
    scenarioCount: files.filter((fileName) => isFinalValidationScenarioFile(fileName)).length,
    evidenceReportPresent: files.includes("_validation_evidence_report.md"),
    preliminaryTestPlanPresent: files.includes("_test_plan.preliminary.md"),
    preliminaryScenarioCount: files.filter((fileName) => isPreliminaryValidationScenarioFile(fileName)).length,
    preliminaryEvidenceReportPresent: files.includes("_validation_evidence_report.preliminary.md")
  };
  const memoryFileCount = directories.includes("memory")
    ? await countFiles(path.join(featureDir, "memory"))
    : 0;

  const summary = {
    name: path.basename(featureDir),
    mode: workspace.mode,
    directory: featureDir,
    workflowRoot: workflowRoot.label,
    phase: "needs-prd",
    artifacts: {
      ideaPresent: files.includes("_idea.md"),
      prdPresent: files.includes("_prd.md"),
      techspecPresent: files.includes("_techspec.md"),
      tasksMasterPresent: files.includes("_tasks.md"),
      impactMapPresent: files.includes("_impact-map.md"),
      contractsPresent: files.includes("_contracts.md"),
      releasePlanPresent: files.includes("_release-plan.md"),
      rollbackPlanPresent: files.includes("_rollback-plan.md"),
      adrCount: directories.includes("adrs")
        ? await countMatchingFiles(path.join(featureDir, "adrs"), ADR_FILE_PATTERN)
        : 0
    },
    tasks: {
      total: taskSummaries.length,
      counts: taskCounts,
      files: analyzedTasks.tasks,
      invalidFiles: taskSummaries.filter((task) => task.error).map((task) => task.name),
      masterList: masterTaskList,
      execution: analyzedTasks.execution
    },
    projects: {
      items: analyzedTasks.projectSummaries,
      configuredCount: workspace.projectNames.length,
      impactedCount: analyzedTasks.projectSummaries.length,
      crossProjectDependencies: analyzedTasks.crossProjectDependencies,
      invalidAssignments: analyzedTasks.invalidAssignments,
      unassignedTasks: analyzedTasks.unassignedTasks
    },
    reviews: {
      rounds: reviews.length,
      latestRound: reviews.at(-1)?.name ?? null,
      latestOpenRound: reviews.findLast((review) => review.counts.open > 0)?.name ?? null,
      openIssues: reviewCounts.open,
      counts: reviewCounts,
      directories: reviews
    },
    validation,
    memory: {
      fileCount: memoryFileCount
    },
    requirements: deriveFeatureRequirements(analyzedTasks, workspace),
    blockers: [],
    warnings: []
  };

  summary.phase = derivePhase(summary);
  summary.blockers = deriveBlockers(summary);
  summary.warnings = deriveWarnings(summary);
  summary.nextStep = deriveNextStep(summary);
  return summary;
}

async function looksLikeFeatureDirectory(featureDir) {
  const entries = await fs.readdir(featureDir, { withFileTypes: true });

  return entries.some((entry) => {
    if (entry.isDirectory()) {
      return entry.name === "adrs" || entry.name === "memory" || REVIEW_DIR_PATTERN.test(entry.name);
    }

    return [
      "_idea.md",
      "_prd.md",
      "_techspec.md",
      "_tasks.md",
      "_impact-map.md",
      "_contracts.md",
      "_release-plan.md",
      "_rollback-plan.md",
      "_test_plan.md",
      "_test_plan.preliminary.md",
      "_validation_evidence_report.md",
      "_validation_evidence_report.preliminary.md"
    ].includes(entry.name) || TASK_FILE_PATTERN.test(entry.name) || VALIDATION_SCENARIO_PATTERN.test(entry.name);
  });
}

async function inspectTaskFile(filePath, name, workspace) {
  const contents = await fs.readFile(filePath, "utf8");
  const frontmatter = parseFrontmatter(contents);
  const rawStatus = typeof frontmatter.data?.status === "string" ? frontmatter.data.status : null;
  const rawProject = normalizeOptionalString(frontmatter.data?.project);
  const rawRepository = normalizeOptionalString(frontmatter.data?.repository);
  const resolvedProject = resolveTaskProject({
    workspace,
    projectName: rawProject,
    repository: rawRepository
  });

  return {
    id: normalizeTaskId(frontmatter.data?.id ?? name.replace(/\.md$/i, "")),
    name,
    path: filePath,
    status: normalizeTaskStatus(rawStatus),
    title: normalizeOptionalString(frontmatter.data?.title),
    complexity: normalizeOptionalString(frontmatter.data?.complexity)?.toLowerCase() ?? null,
    dependencies: normalizeDependencies(frontmatter.data?.dependencies),
    project: resolvedProject,
    repository: rawRepository,
    area: normalizeOptionalString(frontmatter.data?.area)?.toLowerCase() ?? null,
    type: normalizeOptionalString(frontmatter.data?.type)?.toLowerCase() ?? null,
    referencedPaths: parseTaskReferencedPaths(contents),
    error: frontmatter.error
  };
}

async function inspectReviewDirectory(reviewDir, name) {
  const entries = await fs.readdir(reviewDir, { withFileTypes: true });
  const issueFiles = entries
    .filter((entry) => entry.isFile() && ISSUE_FILE_PATTERN.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  const issues = await Promise.all(issueFiles.map((fileName) => inspectIssueFile(path.join(reviewDir, fileName), fileName)));

  return {
    name,
    directory: reviewDir,
    counts: countIssueStatuses(issues),
    issues
  };
}

async function inspectIssueFile(filePath, name) {
  const contents = await fs.readFile(filePath, "utf8");
  const frontmatter = parseFrontmatter(contents);
  const rawStatus = typeof frontmatter.data?.status === "string" ? frontmatter.data.status : null;
  const normalizedStatus = normalizeIssueStatus(rawStatus);

  return {
    name,
    path: filePath,
    status: normalizedStatus,
    file: typeof frontmatter.data?.file === "string" ? frontmatter.data.file.trim() : null,
    severity: typeof frontmatter.data?.severity === "string" ? frontmatter.data.severity.trim().toLowerCase() : null,
    error: frontmatter.error
  };
}

function parseFrontmatter(contents) {
  const match = contents.match(FRONTMATTER_PATTERN);

  if (!match) {
    return {
      data: {},
      error: "missing frontmatter"
    };
  }

  try {
    return {
      data: YAML.parse(match[1]) ?? {},
      error: null
    };
  } catch (error) {
    return {
      data: {},
      error: error instanceof Error ? error.message : "invalid frontmatter"
    };
  }
}

async function inspectMasterTaskList(filePath) {
  const contents = await fs.readFile(filePath, "utf8");
  return {
    present: true,
    ...parseMasterTaskList(contents)
  };
}

function parseMasterTaskList(contents) {
  const table = parseMarkdownTable(contents);
  if (!table) {
    return {
      rows: [],
      columns: {},
      error: "no task rows found in _tasks.md"
    };
  }

  const columns = detectMasterTaskColumns(table.header);
  if (columns.id === null || columns.title === null || columns.status === null) {
    return {
      rows: [],
      columns,
      error: "required task table columns were not found in _tasks.md"
    };
  }

  const rows = [];

  for (const cells of table.rows) {
    const rawId = cells[columns.id] ?? "";
    const id = normalizeTaskId(rawId);
    if (!id) {
      continue;
    }

    rows.push({
      id,
      project: columns.project === null ? null : normalizeOptionalString(cells[columns.project]),
      title: normalizeOptionalString(cells[columns.title]),
      status: normalizeTaskStatus(cells[columns.status]),
      complexity: columns.complexity === null
        ? null
        : normalizeOptionalString(cells[columns.complexity])?.toLowerCase() ?? null,
      dependencies: columns.dependencies === null ? [] : parseDependencyCell(cells[columns.dependencies])
    });
  }

  return {
    rows,
    columns,
    error: rows.length === 0 ? "no task rows found in _tasks.md" : null
  };
}

function parseMarkdownTable(contents) {
  const lines = contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));

  if (lines.length < 2) {
    return null;
  }

  const header = parseTableRow(lines[0]);
  const hasDivider = /^\|\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(lines[1]);
  const dataLines = lines.slice(hasDivider ? 2 : 1);
  const rows = dataLines
    .map(parseTableRow)
    .filter((cells) => cells.length >= header.length && cells.some((cell) => cell.length > 0));

  if (header.length === 0 || rows.length === 0) {
    return null;
  }

  return { header, rows };
}

function parseTableRow(line) {
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function detectMasterTaskColumns(header) {
  const normalized = header.map(normalizeHeaderLabel);

  return {
    id: findColumnIndex(normalized, ["#", "id"]),
    project: findColumnIndex(normalized, ["projeto", "project"]),
    title: findColumnIndex(normalized, ["titulo", "title"]),
    status: findColumnIndex(normalized, ["status", "estado"]),
    complexity: findColumnIndex(normalized, ["complexidade", "complexity"]),
    dependencies: findColumnIndex(normalized, ["dependencias", "dependencies"])
  };
}

function findColumnIndex(normalizedHeader, candidates) {
  const index = normalizedHeader.findIndex((value) => candidates.includes(value));
  return index === -1 ? null : index;
}

function normalizeHeaderLabel(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function analyzeTaskGraph(taskSummaries, workspace) {
  const sortedTasks = [...taskSummaries].sort((left, right) => compareTaskIds(left.id, right.id));
  const taskMap = new Map(sortedTasks.map((task) => [task.id, task]));
  const cycles = detectCycles(taskMap);
  const taskIdsInCycles = new Set(cycles.flat());
  const crossProjectDependencies = [];
  const invalidAssignments = [];
  const unassignedTasks = [];
  const executableTasks = [];
  const inProgressTasks = [];
  const projectSummaries = new Map();
  let missingDependencyCount = 0;

  for (const task of sortedTasks) {
    const missingDependencies = [];
    const pendingDependencies = [];
    const crossProject = [];

    for (const dependencyId of task.dependencies) {
      const dependency = taskMap.get(dependencyId);
      if (!dependency) {
        missingDependencies.push(dependencyId);
        missingDependencyCount += 1;
        continue;
      }

      if (dependency.project.name !== task.project.name) {
        const relation = {
          taskId: task.id,
          taskProject: task.project.name,
          dependencyId,
          dependencyProject: dependency.project.name
        };
        crossProject.push(relation);
        crossProjectDependencies.push(relation);
      }

      if (dependency.status !== "completed") {
        pendingDependencies.push({
          id: dependencyId,
          project: dependency.project.name,
          status: dependency.status
        });
      }
    }

    task.missingDependencies = missingDependencies;
    task.pendingDependencies = pendingDependencies;
    task.crossProjectDependencies = crossProject;
    task.hasCycle = taskIdsInCycles.has(task.id);
    task.hasInvalidProject = workspace.mode === "multi-project" && !task.project.configured;
    task.isExecutable = task.status === "pending"
      && !task.hasCycle
      && task.missingDependencies.length === 0
      && task.pendingDependencies.length === 0
      && !task.hasInvalidProject;
    task.isBlockedByDependencies = task.status === "pending"
      && (task.missingDependencies.length > 0 || task.pendingDependencies.length > 0 || task.hasCycle || task.hasInvalidProject);
    task.executionState = deriveTaskExecutionState(task);
    task.blockedReasons = buildTaskBlockedReasons(task);

    if (task.isExecutable) {
      executableTasks.push(task);
    }
    if (task.status === "in_progress") {
      inProgressTasks.push(task);
    }
    if (task.hasInvalidProject) {
      invalidAssignments.push({
        taskId: task.id,
        taskName: task.name,
        project: task.project.name
      });
    }
    if (workspace.mode === "multi-project" && task.project.name === "unassigned") {
      unassignedTasks.push(task.id);
    }

    const projectKey = task.project.name;
    if (!projectSummaries.has(projectKey)) {
      projectSummaries.set(projectKey, {
        name: task.project.name,
        configured: task.project.configured,
        type: task.project.type,
        stack: task.project.stack,
        repository: task.project.repository,
        taskCount: 0,
        counts: {
          pending: 0,
          inProgress: 0,
          completed: 0,
          blocked: 0,
          unknown: 0
        },
        execution: {
          executable: 0,
          crossProjectBlocked: 0
        }
      });
    }

    const projectSummary = projectSummaries.get(projectKey);
    projectSummary.taskCount += 1;
    projectSummary.counts[task.executionState] += 1;
    if (task.isExecutable) {
      projectSummary.execution.executable += 1;
    }
    if (task.crossProjectDependencies.length > 0 && task.isBlockedByDependencies) {
      projectSummary.execution.crossProjectBlocked += 1;
    }
  }

  const blockedTasks = sortedTasks.filter((task) => task.executionState === "blocked");

  return {
    tasks: sortedTasks,
    taskMap,
    cycles,
    invalidAssignments,
    unassignedTasks,
    crossProjectDependencies,
    execution: {
      executableTasks: executableTasks.map(serializeTaskPointer),
      inProgressTasks: inProgressTasks.map(serializeTaskPointer),
      blockedTasks: blockedTasks.map((task) => ({
        ...serializeTaskPointer(task),
        blockedReasons: task.blockedReasons
      })),
      missingDependencyCount,
      cycleCount: cycles.length
    },
    projectSummaries: [...projectSummaries.values()].sort((left, right) => left.name.localeCompare(right.name))
  };
}

function detectCycles(taskMap) {
  const visiting = new Set();
  const visited = new Set();
  const trail = [];
  const cycles = [];
  const seen = new Set();

  function visit(taskId) {
    if (visited.has(taskId)) {
      return;
    }

    if (visiting.has(taskId)) {
      const cycleStart = trail.indexOf(taskId);
      if (cycleStart >= 0) {
        const cycle = [...trail.slice(cycleStart), taskId];
        const signature = cycle.join("->");
        if (!seen.has(signature)) {
          seen.add(signature);
          cycles.push(cycle);
        }
      }
      return;
    }

    visiting.add(taskId);
    trail.push(taskId);

    const task = taskMap.get(taskId);
    for (const dependencyId of task?.dependencies ?? []) {
      if (!taskMap.has(dependencyId)) {
        continue;
      }
      visit(dependencyId);
    }

    trail.pop();
    visiting.delete(taskId);
    visited.add(taskId);
  }

  for (const taskId of taskMap.keys()) {
    visit(taskId);
  }

  return cycles;
}

function deriveTaskExecutionState(task) {
  if (task.status === "completed") {
    return "completed";
  }
  if (task.status === "in_progress") {
    return "inProgress";
  }
  if (task.status === "unknown") {
    return "unknown";
  }
  if (task.status === "blocked" || task.isBlockedByDependencies) {
    return "blocked";
  }
  return "pending";
}

function buildTaskBlockedReasons(task) {
  const reasons = [];

  if (task.hasInvalidProject) {
    reasons.push(`project '${task.project.name}' is not configured in flow.config.yaml`);
  }
  if (task.hasCycle) {
    reasons.push("task is part of a dependency cycle");
  }
  for (const dependencyId of task.missingDependencies) {
    reasons.push(`depends on missing task ${dependencyId}`);
  }
  for (const dependency of task.pendingDependencies) {
    reasons.push(`depends on ${dependency.id} (${dependency.project}) with status ${dependency.status}`);
  }

  return reasons;
}

function serializeTaskPointer(task) {
  return {
    id: task.id,
    title: task.title,
    project: task.project.name,
    status: task.status
  };
}

function deriveFeatureRequirements(analyzedTasks, workspace) {
  const impactedProjectNames = analyzedTasks.projectSummaries
    .filter((projectSummary) => projectSummary.name !== "default" && projectSummary.name !== "unassigned")
    .map((projectSummary) => projectSummary.name);
  const impactedProjects = impactedProjectNames
    .map((name) => workspace.projects[name])
    .filter(Boolean);
  const impactedCount = impactedProjects.length || analyzedTasks.projectSummaries.length;
  const projectTypes = new Set(
    impactedProjects
      .map((projectInfo) => normalizeOptionalString(projectInfo.type)?.toLowerCase())
      .filter(Boolean)
  );
  const areaHints = analyzedTasks.tasks
    .flatMap((task) => [task.area, task.type, task.project.type])
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  const requiresContracts = workspace.mode === "multi-project"
    && impactedCount > 1
    && (
      analyzedTasks.crossProjectDependencies.length > 0
      || [...projectTypes].some((projectType) => INTEGRATION_PROJECT_TYPES.has(projectType))
    );
  const requiresReleasePlan = workspace.mode === "multi-project" && impactedCount > 1;
  const requiresRollbackPlan = workspace.mode === "multi-project"
    && areaHints.some((value) => DATABASE_HINTS.some((hint) => value.includes(hint)));

  return {
    requiresImpactMap: workspace.mode === "multi-project" && impactedCount > 1,
    requiresContracts,
    requiresReleasePlan,
    requiresRollbackPlan
  };
}

function countTaskStatuses(taskSummaries) {
  const counts = {
    pending: 0,
    inProgress: 0,
    completed: 0,
    blocked: 0,
    unknown: 0
  };

  for (const task of taskSummaries) {
    switch (task.status) {
      case "pending":
        counts.pending += 1;
        break;
      case "in_progress":
        counts.inProgress += 1;
        break;
      case "completed":
        counts.completed += 1;
        break;
      case "blocked":
        counts.blocked += 1;
        break;
      default:
        counts.unknown += 1;
        break;
    }
  }

  return counts;
}

function countIssueStatuses(issues) {
  const counts = {
    pending: 0,
    valid: 0,
    invalid: 0,
    resolved: 0,
    unknown: 0,
    open: 0
  };

  for (const issue of issues) {
    switch (issue.status) {
      case "pending":
        counts.pending += 1;
        counts.open += 1;
        break;
      case "valid":
        counts.valid += 1;
        counts.open += 1;
        break;
      case "invalid":
        counts.invalid += 1;
        counts.open += 1;
        break;
      case "resolved":
        counts.resolved += 1;
        break;
      default:
        counts.unknown += 1;
        counts.open += 1;
        break;
    }
  }

  return counts;
}

function countReviewStatuses(reviews) {
  const counts = {
    pending: 0,
    valid: 0,
    invalid: 0,
    resolved: 0,
    unknown: 0,
    open: 0
  };

  for (const review of reviews) {
    counts.pending += review.counts.pending;
    counts.valid += review.counts.valid;
    counts.invalid += review.counts.invalid;
    counts.resolved += review.counts.resolved;
    counts.unknown += review.counts.unknown;
    counts.open += review.counts.open;
  }

  return counts;
}

function derivePhase(summary) {
  if (!summary.artifacts.prdPresent) {
    return "needs-prd";
  }

  if (!summary.artifacts.techspecPresent) {
    return "needs-techspec";
  }

  if (!summary.artifacts.tasksMasterPresent || summary.tasks.total === 0) {
    return "needs-tasks";
  }

  if (hasHardTaskProblems(summary)) {
    return "blocked";
  }

  const allTasksCompleted = summary.tasks.total > 0 && summary.tasks.counts.completed === summary.tasks.total;
  const hasPendingExecution = summary.tasks.counts.pending > 0 || summary.tasks.counts.inProgress > 0;

  if (!allTasksCompleted) {
    if (summary.tasks.counts.completed === 0 && summary.tasks.counts.inProgress === 0 && hasExecutableTask(summary)) {
      return "ready-to-run";
    }
    return hasPendingExecution ? "executing" : "blocked";
  }

  if (summary.reviews.openIssues > 0) {
    return "review-fixes";
  }

  if (summary.reviews.rounds === 0) {
    return "ready-for-review";
  }

  if (!hasFinalValidationArtifacts(summary.validation)) {
    return "ready-for-validation";
  }

  if (!summary.validation.evidenceReportPresent) {
    return "validation-planned";
  }

  return "validation-documented";
}

function hasHardTaskProblems(summary) {
  return (
    summary.tasks.counts.blocked > 0
    || summary.tasks.counts.unknown > 0
    || summary.tasks.invalidFiles.length > 0
    || summary.tasks.execution.missingDependencyCount > 0
    || summary.tasks.execution.cycleCount > 0
    || summary.projects.invalidAssignments.length > 0
    || (summary.mode === "multi-project" && summary.projects.unassignedTasks.length > 0)
  );
}

function hasExecutableTask(summary) {
  return summary.tasks.execution.executableTasks.length > 0;
}

function deriveBlockers(summary) {
  const blockers = [];

  if (!summary.artifacts.prdPresent) {
    blockers.push("Missing _prd.md.");
  }

  if (summary.artifacts.prdPresent && !summary.artifacts.techspecPresent) {
    blockers.push("Missing _techspec.md.");
  }

  if (summary.artifacts.techspecPresent && (!summary.artifacts.tasksMasterPresent || summary.tasks.total === 0)) {
    blockers.push("Missing _tasks.md or individual task files.");
  }

  if (summary.tasks.counts.blocked > 0) {
    blockers.push(`${summary.tasks.counts.blocked} task file(s) are explicitly marked as blocked.`);
  }

  if (summary.tasks.counts.unknown > 0) {
    blockers.push(`${summary.tasks.counts.unknown} task file(s) have unreadable or unsupported status values.`);
  }

  if (summary.tasks.invalidFiles.length > 0) {
    blockers.push(`Task frontmatter needs repair: ${summary.tasks.invalidFiles.join(", ")}.`);
  }

  if (summary.tasks.execution.missingDependencyCount > 0) {
    blockers.push("At least one task depends on a missing task id.");
  }

  if (summary.tasks.execution.cycleCount > 0) {
    blockers.push(`Detected ${summary.tasks.execution.cycleCount} dependency cycle(s) across task files.`);
  }

  if (summary.projects.invalidAssignments.length > 0) {
    blockers.push(`Tasks reference unknown projects: ${summary.projects.invalidAssignments.map((item) => `${item.taskId} -> ${item.project}`).join(", ")}.`);
  }

  if (summary.mode === "multi-project" && summary.projects.unassignedTasks.length > 0) {
    blockers.push(`Tasks missing project metadata in multi-project mode: ${summary.projects.unassignedTasks.join(", ")}.`);
  }

  if (summary.reviews.openIssues > 0) {
    blockers.push(`${summary.reviews.openIssues} unresolved review issue(s) across ${summary.reviews.rounds} round(s).`);
  }

  return blockers;
}

function deriveWarnings(summary) {
  const warnings = [];

  for (const relation of summary.projects.crossProjectDependencies) {
    warnings.push(`${relation.taskId} (${relation.taskProject}) depends on ${relation.dependencyId} (${relation.dependencyProject}).`);
  }

  if (summary.requirements.requiresImpactMap && !summary.artifacts.impactMapPresent) {
    warnings.push("_impact-map.md is recommended for multi-project features.");
  }

  if (summary.requirements.requiresContracts && !summary.artifacts.contractsPresent) {
    warnings.push("_contracts.md is recommended when multiple services integrate.");
  }

  if (summary.requirements.requiresReleasePlan && !summary.artifacts.releasePlanPresent) {
    warnings.push("_release-plan.md is recommended for multi-project release orchestration.");
  }

  if (summary.requirements.requiresRollbackPlan && !summary.artifacts.rollbackPlanPresent) {
    warnings.push("_rollback-plan.md is recommended when the feature changes data or critical integrations.");
  }

  return warnings;
}

function deriveNextStep(summary) {
  const nextTask = pickNextExecutableTask(summary);

  switch (summary.phase) {
    case "needs-prd":
      return {
        command: `flow-plan ${summary.name}`,
        reason: "The workflow has not produced a PRD yet."
      };
    case "needs-techspec":
      return {
        command: `flow-techspec ${summary.name}`,
        reason: "A PRD exists, but the TechSpec is missing."
      };
    case "needs-tasks":
      return {
        command: `flow-tasks ${summary.name}`,
        reason: "Planning is missing the executable task breakdown."
      };
    case "blocked":
      return {
        command: null,
        reason: summary.blockers[0] ?? "Resolve blockers before continuing execution."
      };
    case "ready-to-run":
    case "executing":
      if (nextTask) {
        return {
          command: `flow-run-task ${summary.name} ${nextTask.id}`,
          reason: buildNextTaskReason(nextTask),
          task: serializeTaskPointer(nextTask)
        };
      }
      if (summary.tasks.execution.inProgressTasks.length > 0) {
        return {
          command: null,
          reason: `No pending executable task was found. Continue the in-progress work: ${summary.tasks.execution.inProgressTasks.map((task) => task.id).join(", ")}.`
        };
      }
      return {
        command: null,
        reason: "No executable task is available because the remaining tasks are blocked by dependencies."
      };
    case "review-fixes":
      return {
        command: `flow-fix-review ${summary.name}`,
        reason: "There are unresolved issues in the review rounds."
      };
    case "ready-for-review":
      return {
        command: `flow-review ${summary.name}`,
        reason: "All tracked tasks are completed and no review round exists yet."
      };
    case "ready-for-validation":
      return {
        command: `flow-validation-plan ${summary.name}`,
        reason: hasPreliminaryValidationArtifacts(summary.validation)
          ? "A preliminary validation draft exists, but final validation artifacts are still missing after execution/review."
          : "Execution and review are done, but validation artifacts are still missing."
      };
    case "validation-planned":
      return {
        command: null,
        reason: "Run the validation scenarios and update the evidence artifacts."
      };
    case "validation-documented":
      return {
        command: null,
        reason: "Validation artifacts are present. Close the workflow or reopen review if code changed."
      };
    default:
      return {
        command: null,
        reason: "Manual follow-up required."
      };
  }
}

function pickNextExecutableTask(summary) {
  const candidates = summary.tasks.files.filter((task) => task.isExecutable);
  if (candidates.length === 0) {
    return null;
  }

  return candidates.sort((left, right) => {
    if (left.dependencies.length !== right.dependencies.length) {
      return left.dependencies.length - right.dependencies.length;
    }
    return compareTaskIds(left.id, right.id);
  })[0];
}

function buildNextTaskReason(task) {
  if (task.dependencies.length === 0) {
    return task.project.name === "default"
      ? `${task.id} has no pending dependencies.`
      : `${task.id} is ready in project ${task.project.name} because it has no pending dependencies.`;
  }

  const dependencyList = task.dependencies.join(", ");
  return task.project.name === "default"
    ? `${task.id} is ready because ${dependencyList} are completed.`
    : `${task.id} is ready in project ${task.project.name} because ${dependencyList} are completed.`;
}

function normalizeTaskStatus(status) {
  if (!status) {
    return "unknown";
  }

  const normalized = String(status).trim().toLowerCase();
  if (normalized === "done" || normalized === "finished") {
    return "completed";
  }
  if (normalized === "in progress") {
    return "in_progress";
  }

  if (["pending", "in_progress", "completed", "blocked"].includes(normalized)) {
    return normalized;
  }

  return "unknown";
}

function normalizeDependencies(rawDependencies) {
  if (!Array.isArray(rawDependencies)) {
    return [];
  }

  return rawDependencies
    .map((dependency) => normalizeTaskId(dependency))
    .filter(Boolean);
}

function parseTaskReferencedPaths(contents) {
  const references = new Set();
  const matches = contents.matchAll(/- `([^`]+)`/g);

  for (const match of matches) {
    const candidate = match[1].trim();
    if (
      !candidate
      || candidate.startsWith("caminho/")
      || candidate.startsWith("path/")
      || candidate.includes("[")
      || candidate.includes("]")
      || candidate.includes("<")
      || candidate.includes(">")
    ) {
      continue;
    }

    references.add(candidate);
  }

  return [...references].sort();
}

function parseDependencyCell(value) {
  if (!value || value === "-") {
    return [];
  }

  return value
    .split(/[;,]/)
    .flatMap((entry) => entry.split(/\s+/))
    .map((entry) => normalizeTaskId(entry))
    .filter(Boolean);
}

function normalizeIssueStatus(status) {
  if (!status) {
    return "unknown";
  }

  const normalized = String(status).trim().toLowerCase();
  if (["pending", "valid", "invalid", "resolved"].includes(normalized)) {
    return normalized;
  }

  return "unknown";
}

function normalizeTaskId(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim().replace(/\.md$/i, "");
  if (!normalized || normalized === "-") {
    return null;
  }

  if (/^\d+$/.test(normalized)) {
    return `task_${normalized}`;
  }

  const lowered = normalized.toLowerCase().replace(/\s+/g, "_");
  if (/^task[-_]\d+$/i.test(lowered)) {
    return lowered.replace("-", "_");
  }

  return lowered;
}

function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
}

function isPreliminaryValidationScenarioFile(fileName) {
  return PRELIMINARY_VALIDATION_SCENARIO_PATTERN.test(fileName);
}

function isFinalValidationScenarioFile(fileName) {
  return VALIDATION_SCENARIO_PATTERN.test(fileName) && !isPreliminaryValidationScenarioFile(fileName);
}

function hasFinalValidationArtifacts(validation) {
  return validation.testPlanPresent || validation.scenarioCount > 0 || validation.evidenceReportPresent;
}

function hasPreliminaryValidationArtifacts(validation) {
  return (
    validation.preliminaryTestPlanPresent
    || validation.preliminaryScenarioCount > 0
    || validation.preliminaryEvidenceReportPresent
  );
}

function serializeWorkflowRoot(workflowRoot) {
  return {
    kind: workflowRoot.kind,
    label: workflowRoot.label,
    path: workflowRoot.path
  };
}

function serializeWorkspace(workspace) {
  return {
    mode: workspace.mode,
    projects: workspace.projectNames.map((name) => workspace.projects[name])
  };
}

function deriveWorkflowRootFromPath(projectRoot, featureDir) {
  const relativePath = path.relative(projectRoot, featureDir);
  const normalizedPath = relativePath.split(path.sep).join("/");

  for (const spec of WORKFLOW_ROOT_SPECS) {
    const prefix = spec.parts.join("/");
    if (normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)) {
      return {
        ...spec,
        path: path.join(projectRoot, ...spec.parts)
      };
    }
  }

  return {
    kind: "custom",
    label: path.dirname(normalizedPath) || ".",
    path: path.dirname(featureDir)
  };
}

function compareFeatures(left, right) {
  const leftPriority = PHASE_PRIORITY.get(left.phase) ?? Number.MAX_SAFE_INTEGER;
  const rightPriority = PHASE_PRIORITY.get(right.phase) ?? Number.MAX_SAFE_INTEGER;

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  return left.name.localeCompare(right.name);
}

function compareTaskIds(left, right) {
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
}

async function countMatchingFiles(directoryPath, pattern) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile() && pattern.test(entry.name)).length;
}

async function countFiles(directoryPath) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile()).length;
}
