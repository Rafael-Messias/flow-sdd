import { fileURLToPath } from "node:url";
import path from "node:path";

import { runDoctor } from "./commands/doctor.mjs";
import { runInit } from "./commands/init.mjs";
import { runList } from "./commands/list.mjs";
import { runNext } from "./commands/next.mjs";
import { runStatus } from "./commands/status.mjs";
import { runUpdate } from "./commands/update.mjs";
import { runVerify } from "./commands/verify.mjs";

const HELP_TEXT = `flow-skills

Usage:
  flow-skills list [--json]
  flow-skills init [--project <path>] [--tools <csv>] [--profile <name>] [--compat-cmd-prefix|--no-compat-cmd-prefix]
  flow-skills update [--project <path>] [--tools <csv>] [--profile <name>] [--compat-cmd-prefix|--no-compat-cmd-prefix]
  flow-skills doctor [--project <path>] [--strict]
  flow-skills status [--project <path>] [--feature <name-or-path>] [--json]
  flow-skills next [--project <path>] [--feature <name-or-path>] [--json]
  flow-skills verify [--project <path>] [--feature <name-or-path>] [--json]
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

    if (token === "--json" || token === "--strict" || token === "--compat-cmd-prefix") {
      options[toOptionKey(token)] = true;
      continue;
    }

    if (token === "--no-compat-cmd-prefix") {
      options.compatCmdPrefix = false;
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
