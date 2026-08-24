import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { getWorkspacePath, ensureWorkspace } from "./sandboxManager";

function resolveSafePath(projectId: string, relativePath: string): string {
  const workspacePath = getWorkspacePath(projectId);
  const cleanRelative = relativePath.replace(/^\/+/, "");
  const resolvedPath = path.resolve(workspacePath, cleanRelative);

  if (!resolvedPath.startsWith(workspacePath)) {
    throw new Error(`Security Violation: Path '${relativePath}' traverses outside project workspace.`);
  }

  return resolvedPath;
}

export async function listFiles(
  projectId: string,
  targetSubPath: string = ""
): Promise<Array<{ path: string; isDir: boolean; size?: number }>> {
  await ensureWorkspace(projectId);
  const workspacePath = getWorkspacePath(projectId);
  const targetDir = resolveSafePath(projectId, targetSubPath);

  if (!existsSync(targetDir)) {
    return [];
  }

  const results: Array<{ path: string; isDir: boolean; size?: number }> = [];

  async function walk(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".next") {
        continue;
      }

      const fullPath = path.join(currentDir, entry.name);
      const relPath = "/" + path.relative(workspacePath, fullPath).replace(/\\/g, "/");

      if (entry.isDirectory()) {
        results.push({ path: relPath, isDir: true });
        await walk(fullPath);
      } else {
        const stat = await fs.stat(fullPath);
        results.push({ path: relPath, isDir: false, size: stat.size });
      }
    }
  }

  await walk(targetDir);
  return results;
}

export async function readFile(projectId: string, relativePath: string): Promise<string> {
  await ensureWorkspace(projectId);
  const safePath = resolveSafePath(projectId, relativePath);

  if (!existsSync(safePath)) {
    throw new Error(`File not found: ${relativePath}`);
  }

  return await fs.readFile(safePath, "utf-8");
}

export async function writeFile(
  projectId: string,
  relativePath: string,
  content: string
): Promise<{ success: boolean; path: string }> {
  await ensureWorkspace(projectId);
  const safePath = resolveSafePath(projectId, relativePath);

  const parentDir = path.dirname(safePath);
  if (!existsSync(parentDir)) {
    await fs.mkdir(parentDir, { recursive: true });
  }

  await fs.writeFile(safePath, content, "utf-8");
  const normalizedRel = "/" + path.relative(getWorkspacePath(projectId), safePath).replace(/\\/g, "/");
  return { success: true, path: normalizedRel };
}

export async function deleteFile(
  projectId: string,
  relativePath: string
): Promise<{ success: boolean; path: string }> {
  await ensureWorkspace(projectId);
  const safePath = resolveSafePath(projectId, relativePath);
  const workspacePath = getWorkspacePath(projectId);

  if (safePath === workspacePath) {
    throw new Error("Security Violation: Deleting root project directory is prohibited.");
  }

  if (existsSync(safePath)) {
    const stat = await fs.stat(safePath);
    if (stat.isDirectory()) {
      await fs.rm(safePath, { recursive: true, force: true });
    } else {
      await fs.unlink(safePath);
    }
  }

  const normalizedRel = "/" + path.relative(workspacePath, safePath).replace(/\\/g, "/");
  return { success: true, path: normalizedRel };
}

export async function getWorkspaceFilesMap(projectId: string): Promise<Record<string, string>> {
  await ensureWorkspace(projectId);
  const workspacePath = getWorkspacePath(projectId);
  const filesMap: Record<string, string> = {};

  async function walk(currentDir: string) {
    if (!existsSync(currentDir)) return;
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".next") {
        continue;
      }
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        const relPath = "/" + path.relative(workspacePath, fullPath).replace(/\\/g, "/");
        try {
          const content = await fs.readFile(fullPath, "utf-8");
          filesMap[relPath] = content;
        } catch {
          // ignore binary or unreadable files
        }
      }
    }
  }

  await walk(workspacePath);
  return filesMap;
}
