import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

export const SANDBOX_BASE_DIR = path.resolve(process.cwd(), ".sandboxes");

export function getWorkspacePath(projectId: string): string {
  // Sanitize projectId to prevent path injection
  const safeId = projectId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const workspacePath = path.resolve(SANDBOX_BASE_DIR, safeId);

  // Ensure workspace path is within SANDBOX_BASE_DIR
  if (!workspacePath.startsWith(SANDBOX_BASE_DIR)) {
    throw new Error(`Security Violation: Access denied outside sandbox root for project ${projectId}`);
  }

  return workspacePath;
}

export async function ensureWorkspace(projectId: string): Promise<string> {
  const workspacePath = getWorkspacePath(projectId);

  if (!existsSync(workspacePath)) {
    await fs.mkdir(workspacePath, { recursive: true });

    // Scaffold default project starter files if completely empty
    const packageJsonPath = path.join(workspacePath, "package.json");
    if (!existsSync(packageJsonPath)) {
      const defaultPackageJson = {
        name: `project-${projectId}`,
        version: "1.0.0",
        private: true,
        scripts: {
          dev: "vite --port 3000",
          build: "echo 'Build successful'",
          start: "vite preview",
        },
        dependencies: {
          react: "^19.0.0",
          "react-dom": "^19.0.0",
          "lucide-react": "^1.31.0",
        },
        devDependencies: {
          typescript: "^5.0.0",
        },
      };
      await fs.writeFile(packageJsonPath, JSON.stringify(defaultPackageJson, null, 2), "utf-8");
    }

    const appTsxPath = path.join(workspacePath, "App.tsx");
    if (!existsSync(appTsxPath)) {
      const defaultAppTsx = `import React from "react";
import "./styles.css";

export default function App() {
  return (
    <div className="container">
      <h1>Generated Application Workspace</h1>
      <p>Project ID: ${projectId}</p>
    </div>
  );
}`;
      await fs.writeFile(appTsxPath, defaultAppTsx, "utf-8");
    }

    const stylesCssPath = path.join(workspacePath, "styles.css");
    if (!existsSync(stylesCssPath)) {
      const defaultStylesCss = `body {
  font-family: system-ui, sans-serif;
  background-color: #09090b;
  color: #f4f4f5;
  padding: 2rem;
}`;
      await fs.writeFile(stylesCssPath, defaultStylesCss, "utf-8");
    }
  }

  return workspacePath;
}
