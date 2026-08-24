import { ensureWorkspace } from "./lib/sandbox/sandboxManager.ts";
import { writeFile } from "./lib/sandbox/fileTools.ts";
import { detectPackageManager, installProjectDependencies, runBuildScript } from "./lib/sandbox/packageTools.ts";

async function testPhase4() {
  console.log("==========================================");
  console.log("PHASE 4 TEST: SANDBOX PACKAGE INSTALL & BUILD PIPELINE");
  console.log("==========================================");

  const projectId = `phase4_test_${Date.now()}`;
  console.log(`1. Initializing isolated sandbox workspace: '${projectId}'...`);
  await ensureWorkspace(projectId);

  // Write a clean package.json and test build files
  const samplePkgJson = {
    name: `app-${projectId}`,
    version: "1.0.0",
    private: true,
    scripts: {
      build: "echo '[BUILD SUCCESSFUL] Web application bundle created.'"
    },
    dependencies: {
      "is-even": "^1.0.0"
    }
  };

  await writeFile(projectId, "/package.json", JSON.stringify(samplePkgJson, null, 2));
  await writeFile(projectId, "/App.tsx", `export default function App() { return <div>Todo App with Dark Mode</div>; }`);
  await writeFile(projectId, "/styles.css", `body { background: #09090b; color: white; }`);

  console.log("\n2. Detecting Package Manager...");
  const pkgManager = await detectPackageManager(projectId);
  console.log(`   └─ Detected Package Manager: '${pkgManager}'`);

  console.log("\n3. Installing Dependencies inside Sandbox Workspace...");
  const installRes = await installProjectDependencies(projectId);
  console.log(`   └─ Install Success: ${installRes.success}`);
  console.log(`   └─ Install Exit Code: ${installRes.exitCode}`);
  console.log(`   └─ Install stdout snippet: ${installRes.stdout.slice(0, 150).trim()}`);

  console.log("\n4. Running Build Command from package.json...");
  const buildRes = await runBuildScript(projectId);
  console.log(`   └─ Build Command Run: '${buildRes.buildCommand}'`);
  console.log(`   └─ Build Success: ${buildRes.success}`);
  console.log(`   └─ Build Exit Code: ${buildRes.exitCode}`);
  console.log(`   └─ Build stdout: ${buildRes.stdout.trim()}`);
  console.log(`   └─ Build stderr: ${buildRes.stderr.trim()}`);

  console.log("\n==========================================");
  console.log("PHASE 4 VERIFICATION RESULTS:");
  console.log("Package manager detected:", pkgManager);
  console.log("Dependencies installed in sandbox:", installRes.success);
  console.log("Build script executed successfully:", buildRes.success);
  console.log("Exit Code:", buildRes.exitCode);
  console.log("==========================================");
}

testPhase4().catch(console.error);
