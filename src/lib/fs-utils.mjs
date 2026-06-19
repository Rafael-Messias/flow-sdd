import fs from "node:fs/promises";
import path from "node:path";

const TEXT_EXTENSIONS = new Set([".md", ".yaml", ".yml", ".json", ".txt"]);

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function removeDirIfExists(dirPath) {
  await fs.rm(dirPath, { recursive: true, force: true });
}

export async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function copyDir(sourceDir, targetDir, transformText) {
  await ensureDir(targetDir);
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath, transformText);
      continue;
    }

    if (isTextFile(entry.name)) {
      let contents = await fs.readFile(sourcePath, "utf8");
      if (transformText) {
        contents = transformText(contents, sourcePath);
      }
      await fs.writeFile(targetPath, contents, "utf8");
      continue;
    }

    await fs.copyFile(sourcePath, targetPath);
  }
}

function isTextFile(fileName) {
  return TEXT_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}
