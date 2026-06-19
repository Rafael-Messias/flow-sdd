import path from "node:path";

import { pathExists } from "./fs-utils.mjs";
import { collectWorkflowStatus } from "./workflow-status.mjs";

export async function collectWorkflowVerification({ projectRoot, feature }) {
  const status = await collectWorkflowStatus({ projectRoot, feature });

  if (status.mode === "empty") {
    return {
      mode: "empty",
      verdict: "PASS",
      workflowRoots: status.workflowRoots,
      features: [],
      nextStep: status.nextStep
    };
  }

  if (status.mode === "feature") {
    const report = await verifyFeature(status.feature, projectRoot);
    return {
      mode: "feature",
      verdict: report.verdict,
      workflowRoots: status.workflowRoots,
      feature: report
    };
  }

  const features = [];
  for (const item of status.features) {
    features.push(await verifyFeature(item, projectRoot));
  }

  return {
    mode: "workspace",
    verdict: features.every((item) => item.verdict === "PASS") ? "PASS" : "FAIL",
    workflowRoots: status.workflowRoots,
    features,
    nextStep: status.nextStep
  };
}

async function verifyFeature(feature, projectRoot) {
  const findings = {
    completeness: [],
    correctness: [],
    coherence: []
  };
  const taskMap = new Map(feature.tasks.files.map((task) => [task.id, task]));
  const masterList = feature.tasks.masterList;
  const allTasksCompleted = feature.tasks.total > 0 && feature.tasks.counts.completed === feature.tasks.total;
  const hasFinalValidationArtifacts =
    feature.validation.testPlanPresent ||
    feature.validation.scenarioCount > 0 ||
    feature.validation.evidenceReportPresent;
  const hasPreliminaryValidationArtifacts =
    feature.validation.preliminaryTestPlanPresent ||
    feature.validation.preliminaryScenarioCount > 0 ||
    feature.validation.preliminaryEvidenceReportPresent;

  if (!feature.artifacts.prdPresent) {
    findings.completeness.push("Missing _prd.md.");
  }

  if (!feature.artifacts.techspecPresent) {
    findings.completeness.push("Missing _techspec.md.");
  }

  if (!feature.artifacts.tasksMasterPresent) {
    findings.completeness.push("Missing _tasks.md.");
  }

  if (feature.tasks.total === 0) {
    findings.completeness.push("No individual task files were found.");
  }

  if (feature.tasks.invalidFiles.length > 0) {
    findings.correctness.push(`Task frontmatter needs repair: ${feature.tasks.invalidFiles.join(", ")}.`);
  }

  if (masterList.present && masterList.error) {
    findings.correctness.push(`_tasks.md could not be parsed cleanly: ${masterList.error}.`);
  }

  if (allTasksCompleted && feature.reviews.rounds === 0) {
    findings.completeness.push("All tasks are completed, but no review round exists yet.");
  }

  if (allTasksCompleted && feature.reviews.rounds > 0 && !hasFinalValidationArtifacts) {
    findings.completeness.push(
      hasPreliminaryValidationArtifacts
        ? "Only preliminary validation draft artifacts exist. Generate the final validation plan after review."
        : "Execution and review exist, but validation artifacts are missing."
    );
  }

  if (feature.reviews.openIssues > 0) {
    findings.coherence.push(`${feature.reviews.openIssues} unresolved review issue(s) still block closure.`);
  }

  if (hasFinalValidationArtifacts && !allTasksCompleted) {
    findings.coherence.push("Final validation artifacts exist even though not all task files are completed.");
  }

  for (const task of feature.tasks.files) {
    if (task.status === "unknown") {
      findings.correctness.push(`${task.name} has an unsupported status value.`);
    }

    for (const dependency of task.dependencies) {
      if (!taskMap.has(dependency)) {
        findings.coherence.push(`${task.name} depends on missing task id ${dependency}.`);
        continue;
      }

      if (dependency >= task.id) {
        findings.coherence.push(`${task.name} depends on ${dependency}, which is not an earlier task id.`);
      }
    }

    if (task.status === "completed") {
      for (const referencedPath of task.referencedPaths) {
        const candidatePath = path.join(projectRoot, ...referencedPath.split(/[\\/]+/));
        if (!(await pathExists(candidatePath))) {
          findings.correctness.push(`${task.name} references missing path ${referencedPath}.`);
        }
      }
    }
  }

  if (masterList.present && !masterList.error) {
    const masterMap = new Map(masterList.rows.map((row) => [row.id, row]));

    for (const task of feature.tasks.files) {
      const masterRow = masterMap.get(task.id);
      if (!masterRow) {
        findings.coherence.push(`${task.name} exists as a task file but is missing from _tasks.md.`);
        continue;
      }

      if (task.title && masterRow.title && task.title !== masterRow.title) {
        findings.coherence.push(`${task.name} title differs between task file and _tasks.md.`);
      }

      if (task.status !== masterRow.status) {
        findings.coherence.push(`${task.name} status differs between task file and _tasks.md.`);
      }

      if (task.complexity && masterRow.complexity && task.complexity !== masterRow.complexity) {
        findings.coherence.push(`${task.name} complexity differs between task file and _tasks.md.`);
      }

      if (!sameDependencies(task.dependencies, masterRow.dependencies)) {
        findings.coherence.push(`${task.name} dependencies differ between task file and _tasks.md.`);
      }
    }

    for (const row of masterList.rows) {
      if (!taskMap.has(row.id)) {
        findings.coherence.push(`_tasks.md lists ${row.id}, but the task file is missing.`);
      }
    }
  }

  for (const reviewDirectory of feature.reviews.directories) {
    for (const issue of reviewDirectory.issues) {
      if (issue.error) {
        findings.correctness.push(`${reviewDirectory.name}/${issue.name} has invalid frontmatter.`);
      }

      if (issue.file && issue.file !== "unknown") {
        const candidatePath = path.join(projectRoot, ...issue.file.split(/[\\/]+/));
        if (!(await pathExists(candidatePath))) {
          findings.correctness.push(`${reviewDirectory.name}/${issue.name} points to missing file ${issue.file}.`);
        }
      }
    }
  }

  const counts = {
    completeness: findings.completeness.length,
    correctness: findings.correctness.length,
    coherence: findings.coherence.length
  };
  const verdict = counts.completeness + counts.correctness + counts.coherence === 0 ? "PASS" : "FAIL";

  return {
    name: feature.name,
    directory: feature.directory,
    workflowRoot: feature.workflowRoot,
    phase: feature.phase,
    verdict,
    findings,
    counts,
    nextStep: feature.nextStep
  };
}

function sameDependencies(left, right) {
  const normalizedLeft = [...left].sort().join("|");
  const normalizedRight = [...right].sort().join("|");
  return normalizedLeft === normalizedRight;
}
