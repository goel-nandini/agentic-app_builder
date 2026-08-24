import { NextRequest, NextResponse } from "next/server";
import { generateStructuredApp, generateFixForBuildError } from "@/lib/ai/gemini";
import { ensureWorkspace, getWorkspacePath } from "@/lib/sandbox/sandboxManager";
import { writeFile, getWorkspaceFilesMap } from "@/lib/sandbox/fileTools";
import { installProjectDependencies, runBuildScript } from "@/lib/sandbox/packageTools";
import { preparePreview } from "@/lib/sandbox/previewManager";
import { buildSmartFallbackApp } from "@/lib/ai/smartFallback";

const MAX_FIX_ATTEMPTS = 3;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { prompt, projectId = "default_sandbox", skipBuild = false } = body;

  if (!prompt || !prompt.trim()) {
    return NextResponse.json({ success: false, error: "Prompt is required." }, { status: 400 });
  }

  console.log(`[Agent] User prompt received for project '${projectId}': "${prompt}"`);

  try {
    // ── STEP 1: Call Gemini for structured JSON files ─────────────
    console.log("[Gemini] Request started...");
    const result = await generateStructuredApp(prompt);
    console.log("[Gemini] Response received.");
    console.log(`[Gemini] JSON validated. ${result.files.length} files generated.`);

    // ── STEP 2: Physical Disk Write to Sandbox Workspace ──────────
    console.log(`[Sandbox] Initializing isolated workspace at .sandboxes/${projectId}...`);
    const workspacePath = await ensureWorkspace(projectId);

    console.log(`[Sandbox] Writing ${result.files.length} files physically to disk...`);
    for (const f of result.files) {
      await writeFile(projectId, f.path, f.content);
      console.log(`  └─ Wrote physical file: ${f.path}`);
    }

    // ── STEP 3: Read Physical Sandbox Files from Disk ─────────────
    let sandboxDiskFiles = await getWorkspaceFilesMap(projectId);
    console.log(`[Sandbox] Physical verification complete. ${Object.keys(sandboxDiskFiles).length} files verified on disk.`);

    // ── STEP 4: Build Pipeline (Install + Build) ──────────────────
    let installResult = { success: true, exitCode: 0, stdout: "Skipped", stderr: "" };
    let buildResult = { success: true, exitCode: 0, stdout: "Skipped", stderr: "", buildCommand: "npm run build" };

    if (!skipBuild) {
      console.log(`[Sandbox Build] Installing dependencies for project '${projectId}'...`);
      installResult = await installProjectDependencies(projectId);

      console.log(`[Sandbox Build] Executing build command for project '${projectId}'...`);
      buildResult = await runBuildScript(projectId);

      // ── STEP 5: Gemini Build Error Self-Healing Loop ───────────
      if (!buildResult.success) {
        let fixAttempts = 0;
        while (!buildResult.success && fixAttempts < MAX_FIX_ATTEMPTS) {
          fixAttempts++;
          console.warn(`[Self-Healing] Build failed (Attempt ${fixAttempts}/${MAX_FIX_ATTEMPTS}). Triggering Gemini AI fix...`);

          try {
            const currentDiskFiles = await getWorkspaceFilesMap(projectId);
            const fixResult = await generateFixForBuildError({
              userPrompt: prompt,
              existingFiles: currentDiskFiles,
              buildCommand: buildResult.buildCommand,
              exitCode: buildResult.exitCode,
              stdout: buildResult.stdout,
              stderr: buildResult.stderr,
            });

            console.log(`[Self-Healing] Gemini returned ${fixResult.files.length} fix files. Writing to disk...`);
            for (const f of fixResult.files) {
              await writeFile(projectId, f.path, f.content);
              console.log(`  └─ Wrote fix file: ${f.path}`);
            }

            console.log(`[Self-Healing] Re-installing & Re-building project '${projectId}'...`);
            installResult = await installProjectDependencies(projectId);
            buildResult = await runBuildScript(projectId);

            if (buildResult.success) {
              console.log(`[Self-Healing] ✅ Build SUCCESS on fix attempt ${fixAttempts}!`);
              break;
            }
          } catch (fixErr: any) {
            console.error(`[Self-Healing] Fix attempt ${fixAttempts} failed:`, fixErr?.message);
            break;
          }
        }
      }
    }

    // Refresh final workspace files map after any self-healing fixes
    sandboxDiskFiles = await getWorkspaceFilesMap(projectId);

    // Prepare Preview Status & URL
    const previewStatus = await preparePreview(projectId);

    // ── STEP 6: Return Verified Sandbox Files & Preview Status ────
    return NextResponse.json({
      success: true,
      projectId,
      previewUrl: previewStatus.previewUrl,
      sandboxPath: workspacePath,
      files: sandboxDiskFiles,
      installResult,
      buildResult: {
        success: buildResult.success,
        exitCode: buildResult.exitCode,
        stdout: buildResult.stdout,
        stderr: buildResult.stderr,
        buildCommand: buildResult.buildCommand,
      },
      explanation: result.explanation || `Generated application for: "${prompt}"`,
      steps: [
        "Analyzed prompt requirements with Gemini AI",
        "Generated complete React application files",
        "Wrote files physically to isolated disk sandbox",
        `Installed dependencies (${installResult.success ? "success" : "failed"})`,
        `Ran build script '${buildResult.buildCommand}' (${buildResult.success ? "success" : "failed"})`,
        "Prepared live application preview",
      ],
    });
  } catch (err: any) {
    const errorMessage = err?.message || "Unknown generation error";
    console.error("[Agent] Generation failed:", errorMessage);

    // ── FALLBACK WORKSPACE DISK WRITE ─────────────────────────────
    console.warn("[Agent] Writing Smart Fallback App files to sandbox disk...");
    await ensureWorkspace(projectId);
    const fallbackApp = buildSmartFallbackApp(prompt);

    for (const [relPath, content] of Object.entries(fallbackApp.files)) {
      await writeFile(projectId, relPath, content);
    }

    const fallbackDiskFiles = await getWorkspaceFilesMap(projectId);
    const fallbackPreview = await preparePreview(projectId);

    return NextResponse.json({
      success: true,
      projectId,
      previewUrl: fallbackPreview.previewUrl,
      files: fallbackDiskFiles,
      explanation: fallbackApp.explanation,
      steps: fallbackApp.steps,
      isFallback: true,
      fallbackReason: errorMessage,
    });
  }
}
