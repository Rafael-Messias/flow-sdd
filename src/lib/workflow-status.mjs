import fs from "node:fs/promises";
import path from "node:path";

import YAML from "yaml";

import { pathExists } from "./fs-utils.mjs";

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

export async function collectWorkflowStatus({ projectRoot, feature }) {
  const workflowRoots = await discoverWorkflowRoots(projectRoot);
  const features = await collectFeatures(workflowRoots);

  if (feature) {
    const selectedFeature = await resolveFeature(features, projectRoot, feature);
    return {
      mode: "feature",
      workflowRoots: workflowRoots.map(serializeWorkflowRoot),
      feature: selectedFeature
    };
  }

  if (features.length === 0) {
    return {
      mode: "empty",
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
      workflowRoots: workflowRoots.map(serializeWorkflowRoot),
      feature: features[0]
    };
  }

  return {
    mode: "workspace",
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

async function collectFeatures(workflowRoots) {
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
      features.push(await inspectFeatureDirectory(featureDir, workflowRoot));
    }
  }

  return features.sort(compareFeatures);
}

async function resolveFeature(features, projectRoot, feature) {
  const directPath = path.resolve(projectRoot, feature);
  if (await pathExists(directPath)) {
    return inspectFeatureDirectory(directPath, deriveWorkflowRootFromPath(projectRoot, directPath));
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

async function inspectFeatureDirectory(featureDir, workflowRoot) {
  const entries = await fs.readdir(featureDir, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  const directories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const masterTaskList = files.includes("_tasks.md")
    ? await inspectMasterTaskList(path.join(featureDir, "_tasks.md"))
    : { present: false, rows: [], error: null };

  const taskFiles = files.filter((fileName) => TASK_FILE_PATTERN.test(fileName)).sort();
  const taskSummaries = await Promise.all(taskFiles.map((fileName) => inspectTaskFile(path.join(featureDir, fileName), fileName)));
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
    directory: featureDir,
    workflowRoot: workflowRoot.label,
    phase: "needs-prd",
    artifacts: {
      ideaPresent: files.includes("_idea.md"),
      prdPresent: files.includes("_prd.md"),
      techspecPresent: files.includes("_techspec.md"),
      tasksMasterPresent: files.includes("_tasks.md"),
      adrCount: directories.includes("adrs")
        ? await countMatchingFiles(path.join(featureDir, "adrs"), ADR_FILE_PATTERN)
        : 0
    },
    tasks: {
      total: taskSummaries.length,
      counts: taskCounts,
      files: taskSummaries,
      invalidFiles: taskSummaries.filter((task) => task.error).map((task) => task.name),
      masterList: masterTaskList
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
    blockers: []
  };

  summary.phase = derivePhase(summary);
  summary.blockers = deriveBlockers(summary);
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
      "_test_plan.md",
      "_test_plan.preliminary.md",
      "_validation_evidence_report.md",
      "_validation_evidence_report.preliminary.md"
    ].includes(entry.name) || TASK_FILE_PATTERN.test(entry.name) || VALIDATION_SCENARIO_PATTERN.test(entry.name);
  });
}

async function inspectTaskFile(filePath, name) {
  const contents = await fs.readFile(filePath, "utf8");
  const frontmatter = parseFrontmatter(contents);
  const rawStatus = typeof frontmatter.data?.status === "string" ? frontmatter.data.status : null;
  return {
    id: name.replace(/\.md$/i, ""),
    name,
    path: filePath,
    status: normalizeTaskStatus(rawStatus),
    title: typeof frontmatter.data?.title === "string" ? frontmatter.data.title : null,
    complexity: typeof frontmatter.data?.complexity === "string" ? frontmatter.data.complexity.trim().toLowerCase() : null,
    dependencies: normalizeDependencies(frontmatter.data?.dependencies),
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

async function readFrontmatter(filePath) {
  const contents = await fs.readFile(filePath, "utf8");
  return parseFrontmatter(contents);
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

function normalizeTaskStatus(status) {
  if (!status) {
    return "unknown";
  }

  const normalized = status.trim().toLowerCase();
  if (normalized === "done" || normalized === "finished") {
    return "completed";
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
    .map((dependency) => String(dependency).trim().replace(/\.md$/i, ""))
    .filter(Boolean);
}

function parseTaskReferencedPaths(contents) {
  const references = new Set();
  const matches = contents.matchAll(/- `([^`]+)`/g);

  for (const match of matches) {
    const candidate = match[1].trim();
    if (
      !candidate ||
      candidate.startsWith("caminho/") ||
      candidate.startsWith("path/") ||
      candidate.includes("[") ||
      candidate.includes("]") ||
      candidate.includes("<") ||
      candidate.includes(">")
    ) {
      continue;
    }

    references.add(candidate);
  }

  return [...references].sort();
}

function parseMasterTaskList(contents) {
  const rows = [];

  for (const rawLine of contents.split(/\r?\n/)) {
    if (!rawLine.trim().startsWith("|")) {
      continue;
    }

    const cells = rawLine
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());

    if (cells.length < 5 || !/^\d+$/.test(cells[0])) {
      continue;
    }

    rows.push({
      number: cells[0],
      id: `task_${cells[0]}`,
      title: cells[1],
      status: normalizeTaskStatus(cells[2]),
      complexity: cells[3].trim().toLowerCase(),
      dependencies: parseDependencyCell(cells[4])
    });
  }

  return {
    rows,
    error: rows.length === 0 ? "no task rows found in _tasks.md" : null
  };
}

function parseDependencyCell(value) {
  if (!value || value === "-") {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim().replace(/\.md$/i, ""))
    .filter(Boolean);
}

function normalizeIssueStatus(status) {
  if (!status) {
    return "unknown";
  }

  const normalized = status.trim().toLowerCase();
  if (["pending", "valid", "invalid", "resolved"].includes(normalized)) {
    return normalized;
  }

  return "unknown";
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

  if (summary.tasks.counts.blocked > 0 || summary.tasks.counts.unknown > 0) {
    return "blocked";
  }

  if (
    summary.tasks.total > 0 &&
    summary.tasks.counts.pending === summary.tasks.total &&
    summary.tasks.counts.inProgress === 0 &&
    summary.tasks.counts.completed === 0
  ) {
    return "ready-to-run";
  }

  if (summary.tasks.counts.pending > 0 || summary.tasks.counts.inProgress > 0) {
    return "executing";
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
    blockers.push(`${summary.tasks.counts.blocked} task file(s) are marked as blocked.`);
  }

  if (summary.tasks.counts.unknown > 0) {
    blockers.push(`${summary.tasks.counts.unknown} task file(s) have unreadable or unsupported status values.`);
  }

  if (summary.tasks.invalidFiles.length > 0) {
    blockers.push(`Task frontmatter needs repair: ${summary.tasks.invalidFiles.join(", ")}.`);
  }

  if (summary.reviews.openIssues > 0) {
    blockers.push(`${summary.reviews.openIssues} unresolved review issue(s) across ${summary.reviews.rounds} round(s).`);
  }

  return blockers;
}

function deriveNextStep(summary) {
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
        reason: "Resolve blocked or invalid task files before continuing execution."
      };
    case "ready-to-run":
      return {
        command: `flow-run ${summary.name}`,
        reason: "Planning artifacts are ready and execution has not started."
      };
    case "executing":
      return {
        command: `flow-run ${summary.name}`,
        reason: "There are still pending or in-progress tasks."
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
    validation.preliminaryTestPlanPresent ||
    validation.preliminaryScenarioCount > 0 ||
    validation.preliminaryEvidenceReportPresent
  );
}

function serializeWorkflowRoot(workflowRoot) {
  return {
    kind: workflowRoot.kind,
    label: workflowRoot.label,
    path: workflowRoot.path
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

async function countMatchingFiles(directoryPath, pattern) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile() && pattern.test(entry.name)).length;
}

async function countFiles(directoryPath) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile()).length;
}
