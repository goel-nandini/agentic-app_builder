import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceFilesMap } from "@/lib/sandbox/fileTools";
import { existsSync } from "fs";
import path from "path";

const SANDBOX_ROOT = path.join(process.cwd(), ".sandboxes");

/**
 * GET /api/preview/[projectId]
 *
 * Reads the generated application's source files from disk and serves
 * a self-contained HTML page that renders the React app in the browser
 * using Babel standalone (no build step required for preview).
 *
 * The CodePanel's <iframe src="/api/preview/:projectId"> loads this page,
 * giving the user a live preview of the ACTUAL generated application —
 * not the App Builder shell.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  // Basic safety: reject traversal attempts in project ID
  if (!projectId || projectId.includes("..") || projectId.includes("/") || projectId.includes("\\")) {
    return new NextResponse("Invalid project ID", { status: 400 });
  }

  const workspacePath = path.join(SANDBOX_ROOT, projectId);
  if (!existsSync(workspacePath)) {
    return new NextResponse(buildErrorPage(`Project '${projectId}' not found. Generate an app first.`), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Read all source files from the sandbox workspace
  let files: Record<string, string> = {};
  try {
    files = await getWorkspaceFilesMap(projectId);
  } catch (err: any) {
    return new NextResponse(buildErrorPage(`Failed to read workspace: ${err?.message}`), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (Object.keys(files).length === 0) {
    return new NextResponse(buildErrorPage("No files found in this project workspace."), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Resolve the main entry component — prefer /App.tsx, /App.jsx, /src/App.tsx
  const appEntry =
    files["/App.tsx"] ??
    files["/App.jsx"] ??
    files["/src/App.tsx"] ??
    files["/src/App.jsx"];

  // Resolve CSS
  const cssContent =
    files["/styles.css"] ??
    files["/src/styles.css"] ??
    files["/index.css"] ??
    files["/src/index.css"] ??
    "";

  if (!appEntry) {
    return new NextResponse(
      buildErrorPage("No App.tsx / App.jsx entry point found in the generated project."),
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const html = buildPreviewPage(appEntry, cssContent, files);

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Allow iframe embedding from same origin
      "X-Frame-Options": "SAMEORIGIN",
      // Disable caching so fresh builds are always shown
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

// ── HTML page builder ──────────────────────────────────────────────────────

function buildPreviewPage(
  appCode: string,
  cssContent: string,
  allFiles: Record<string, string>
): string {
  // Strip TypeScript type annotations and JSX imports that Babel standalone
  // can't handle well, keeping the logic intact.
  const cleanedApp = stripTypeScriptTypes(appCode);

  // Build a module map so relative imports (e.g. ./utils, ../components/Foo)
  // resolve inside the browser without a bundler.
  const moduleScripts = buildInlineModules(allFiles, appCode);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>App Preview</title>

  <!-- React + ReactDOM from CDN -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>

  <!-- Babel Standalone: transpiles JSX/TSX in the browser -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <!-- Global resets -->
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 100%; min-height: 100vh; }
  </style>

  <!-- Generated Application CSS -->
  <style id="app-styles">
${cssContent}
  </style>
</head>
<body>
  <div id="root"></div>

${moduleScripts}

  <!-- Main App Entry -->
  <script type="text/babel" data-presets="react,typescript">
${cleanedApp}

const rootEl = document.getElementById('root');
const root = ReactDOM.createRoot(rootEl);
root.render(React.createElement(App));
  </script>

  <!-- Error boundary overlay -->
  <script>
    window.addEventListener('error', function(e) {
      const root = document.getElementById('root');
      root.innerHTML = \`
        <div style="font-family:monospace;padding:2rem;background:#1a0000;color:#ff6b6b;min-height:100vh;">
          <h2 style="margin-bottom:1rem;color:#ff4444;">⚠ Preview Error</h2>
          <pre style="white-space:pre-wrap;font-size:0.85rem;">\${e.message}\\n\\n\${e.filename}:\${e.lineno}</pre>
        </div>
      \`;
    });
  </script>
</body>
</html>`;
}

function buildInlineModules(
  allFiles: Record<string, string>,
  mainAppCode: string
): string {
  // Find any files referenced via import statements in App.tsx (not node_modules)
  const relativeImportRegex = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
  const referenced = new Set<string>();

  for (const code of Object.values(allFiles)) {
    let m;
    while ((m = relativeImportRegex.exec(code)) !== null) {
      referenced.add(m[1]);
    }
  }

  if (referenced.size === 0) return "";

  // For simple utility files referenced by the app, inject them as Babel scripts
  const scripts: string[] = [];
  for (const importPath of referenced) {
    // Resolve the path relative to /App.tsx (root)
    const resolvedKey =
      allFiles["/" + importPath.replace(/^\.\//, "") + ".ts"] ||
      allFiles["/" + importPath.replace(/^\.\//, "") + ".tsx"] ||
      allFiles["/" + importPath.replace(/^\.\//, "")] ||
      null;

    if (resolvedKey) {
      scripts.push(`<!-- Inline module: ${importPath} -->
<script type="text/babel" data-presets="react,typescript">
${stripTypeScriptTypes(resolvedKey)}
</script>`);
    }
  }

  return scripts.join("\n");
}

/**
 * Light TypeScript stripping for browser Babel standalone.
 * Handles: interface, type alias, type annotations on variables and parameters.
 * Does NOT attempt to strip generics from JSX (Babel handles these).
 */
function stripTypeScriptTypes(code: string): string {
  return code
    // Remove import type statements
    .replace(/^import\s+type\s+.+?from\s+['"][^'"]+['"];?\s*$/gm, "")
    // Remove standalone interface declarations
    .replace(/^interface\s+\w[\s\S]*?^}/gm, "")
    // Remove type alias declarations
    .replace(/^type\s+\w+\s*=[\s\S]*?;$/gm, "")
    // Remove React import (it's available globally via CDN)
    .replace(/^import\s+React.*?from\s+['"]react['"];?\s*$/gm, "")
    // Remove CSS imports (styles are injected separately)
    .replace(/^import\s+['"][^'"]*\.css['"];?\s*$/gm, "")
    // Remove other relative imports that won't resolve (handled via moduleScripts)
    .replace(/^import\s+.*?from\s+['"]\.\.?\/[^'"]+['"];?\s*$/gm, "")
    // Remove node_modules imports except react (those are globals)
    .replace(/^import\s+.*?from\s+['"](?!react)(?!react-dom)[^.][^'"]+['"];?\s*$/gm, "")
    .trim();
}

function buildErrorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: monospace; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .box { text-align: center; max-width: 480px; padding: 2rem; }
    h2 { color: #f87171; margin-bottom: 1rem; }
    p { color: #a1a1aa; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="box">
    <h2>⚠ Preview Unavailable</h2>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
