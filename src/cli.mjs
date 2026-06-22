import { fileURLToPath } from "node:url";
import path from "node:path";

import { runContracts } from "./commands/contracts.mjs";
import { runDoctor } from "./commands/doctor.mjs";
import { runImpact } from "./commands/impact.mjs";
import { runInit } from "./commands/init.mjs";
import { runList } from "./commands/list.mjs";
import { runNext } from "./commands/next.mjs";
import { runProjects } from "./commands/projects.mjs";
import { runStatus } from "./commands/status.mjs";
import { runUpdate } from "./commands/update.mjs";
import { runVerify } from "./commands/verify.mjs";

const HELP_TEXT = `flow-sdd

Usage:
  flow-sdd list [--json]
  flow-sdd init [--project <path>] [--tools <csv>] [--profile <name>]
  flow-sdd update [--project <path>] [--tools <csv>] [--profile <name>]
  flow-sdd doctor [--project <path>] [--strict]
  flow-sdd status [--project <path>] [--feature <name-or-path>] [--json]
  flow-sdd next [--project <path>] [--feature <name-or-path>] [--json]
  flow-sdd verify [--project <path>] [--feature <name-or-path>] [--json]
  flow-sdd impact [--project <path>] [--feature <name-or-path>] [--json]
  flow-sdd projects [--project <path>] [--feature <name-or-path>] [--json]
  flow-sdd contracts [--project <path>] [--feature <name-or-path>] [--json]
`;

export async function runCli(argv, cwd, io) {
  const { positionals, options } = parseArgs(argv);
  const command = positionals[0] ?? "help";
  const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const context = { cwd, io, packageRoot };

  switch (command) {
    case "list":
      return runList({ options, context });
    case "init":
      return runInit({ options, context });
    case "update":
      return runUpdate({ options, context });
    case "doctor":
      return runDoctor({ options, context });
    case "status":
    case "flow-status":
      return runStatus({ options, context });
    case "next":
    case "flow-next":
      return runNext({ options, context });
    case "verify":
    case "flow-verify":
      return runVerify({ options, context });
    case "impact":
      return runImpact({ options, context });
    case "projects":
      return runProjects({ options, context });
    case "contracts":
      return runContracts({ options, context });
    case "help":
    case "--help":
    case "-h":
    default:
      io.stdout.write(HELP_TEXT);
      return command === "help" || command === "--help" || command === "-h" ? 0 : 1;
  }
}

function parseArgs(argv) {
  const positionals = [];
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }

    if (token === "--json" || token === "--strict") {
      options[toOptionKey(token)] = true;
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      throw new Error(`Missing value for option ${token}`);
    }

    options[toOptionKey(token)] = next;
    index += 1;
  }

  return { positionals, options };
}

function toOptionKey(token) {
  return token
    .replace(/^--/, "")
    .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}
