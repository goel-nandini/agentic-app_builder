import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { runCommand } from "./commandTools";
import { getWorkspacePath } from "./sandboxManager";

export async function detectPackageManager(projectId: string): Promise<"npm" | "pnpm" | "yarn" | "bun"> {
  const workspacePath = getWorkspacePath(projectId);

  if (existsSync(path.join(workspacePath, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(path.join(workspacePath, "yarn.lock"))) return "yarn";
  if (existsSync(path.join(workspacePath, "bun.lockb"))) return "bun";
  return "npm";
}

export async function installProjectDependencies(
  projectId: string
): Promise<{ success: boolean; exitCode: number; stdout: string; stderr: string }> {
  const pkgManager = await detectPackageManager(projectId);
  let cmd = "npm install";

  if (pkgManager === "pnpm") {
    cmd = "pnpm install";
  } else if (pkgManager === "yarn") {
    cmd = "yarn install";
  } else if (pkgManager === "bun") {
    cmd = "bun install";
  }

  console.log(`[Sandbox Build] Running dependency install in workspace '${projectId}': ${cmd}`);
  const result = await runCommand(projectId, cmd);

  return {
    success: result.success,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

export async function runBuildScript(
  projectId: string
): Promise<{ success: boolean; exitCode: number; stdout: string; stderr: string; buildCommand: string }> {
  const workspacePath = getWorkspacePath(projectId);
  const pkgJsonPath = path.join(workspacePath, "package.json");

  let buildCommand = "npm run build";
  const pkgManager = await detectPackageManager(projectId);

  if (existsSync(pkgJsonPath)) {
    try {
      const content = await fs.readFile(pkgJsonPath, "utf-8");
      const pkg = JSON.parse(content);
      if (pkg.scripts && pkg.scripts.build) {
        if (pkgManager === "pnpm") buildCommand = "pnpm run build";
        else if (pkgManager === "yarn") buildCommand = "yarn build";
        else if (pkgManager === "bun") buildCommand = "bun run build";
        else buildCommand = "npm run build";
      }
    } catch {
      // Use default command
    }
  }

  console.log(`[Sandbox Build] Executing build script in workspace '${projectId}': ${buildCommand}`);
  const result = await runCommand(projectId, buildCommand);

  return {
    success: result.success,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
    buildCommand,
  };
}

export async function installPackage(
  projectId: string,
  packageName: string
): Promise<{ success: boolean; stdout: string; stderr: string }> {
  // Validate package name against invalid characters
  const cleanPackage = packageName.trim();
  if (!/^[a-zA-Z0-9_@/-]+$/.test(cleanPackage)) {
    return {
      success: false,
      stdout: "",
      stderr: `Invalid package name format: ${packageName}`,
    };
  }

  const pkgManager = await detectPackageManager(projectId);
  let cmd = `npm install ${cleanPackage}`;

  if (pkgManager === "pnpm") {
    cmd = `pnpm add ${cleanPackage}`;
  } else if (pkgManager === "yarn") {
    cmd = `yarn add ${cleanPackage}`;
  } else if (pkgManager === "bun") {
    cmd = `bun add ${cleanPackage}`;
  }

  const result = await runCommand(projectId, cmd);

  // Also update package.json in workspace directly if command didn't modify it
  try {
    const pkgJsonPath = path.join(getWorkspacePath(projectId), "package.json");
    if (existsSync(pkgJsonPath)) {
      const content = await fs.readFile(pkgJsonPath, "utf-8");
      const pkg = JSON.parse(content);
      pkg.dependencies = pkg.dependencies || {};
      if (!pkg.dependencies[cleanPackage]) {
        pkg.dependencies[cleanPackage] = "latest";
        await fs.writeFile(pkgJsonPath, JSON.stringify(pkg, null, 2), "utf-8");
      }
    }
  } catch (err: any) {
    console.warn("Failed to manually patch package.json:", err?.message);
  }

  return {
    success: result.success,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}
