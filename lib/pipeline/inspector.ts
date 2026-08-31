import type {
  CodeInspectionResult,
  InspectionIssue,
  DesignDNA,
} from "@/types/pipeline";

/**
 * Static Inspector for generated React Sandbox files.
 * Validates syntax sanity, import linkages, dead handlers, and Design DNA rules without execution overhead.
 */
export function inspectGeneratedCode(
  files: Record<string, { code: string }>,
  designDNA?: DesignDNA
): CodeInspectionResult {
  const issues: InspectionIssue[] = [];
  let deadHandlerCount = 0;
  let missingExportCount = 0;
  let totalLines = 0;

  const filePaths = Object.keys(files);

  // 1. Entry point check
  if (!files["/App.js"]) {
    issues.push({
      severity: "critical",
      filePath: "/App.js",
      category: "syntax",
      description: "Missing required root entry point /App.js with default export.",
      suggestedFix: "Create /App.js exporting a default React component.",
    });
  }

  // 2. Iterate through each file
  for (const [path, { code }] of Object.entries(files)) {
    const lines = code.split("\n");
    totalLines += lines.length;

    // Check for default export
    const hasDefaultExport =
      code.includes("export default") ||
      /export\s+default\s+function|export\s+default\s+class|export\s*\{\s*\w+\s+as\s+default\s*\}/.test(
        code
      );

    if (!hasDefaultExport && (path === "/App.js" || path.startsWith("/components/"))) {
      missingExportCount++;
      issues.push({
        severity: "warning",
        filePath: path,
        category: "syntax",
        description: `Component in ${path} is missing an 'export default' declaration.`,
        suggestedFix: `Add 'export default function ComponentName() { ... }'`,
      });
    }

    // Check for dummy/dead handlers
    const deadHandlerRegex =
      /onClick=\{(?:\(\)\s*=>\s*\{\s*\}|\(\)\s*=>\s*console\.log\([^)]*\)|undefined|null)\}/g;
    const deadMatches = code.match(deadHandlerRegex);
    if (deadMatches) {
      deadHandlerCount += deadMatches.length;
      issues.push({
        severity: "warning",
        filePath: path,
        category: "interactivity",
        description: `Found ${deadMatches.length} non-functional dead click handler(s) in ${path}.`,
        suggestedFix: "Wire real state mutation handlers (e.g. useState setters or callback props).",
      });
    }

    // Check for unresolved local component imports
    const importRegex = /import\s+[\w{},*\s]+\s+from\s+['"](\.[^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      const importedPath = match[1];
      const normalizedPath = importedPath.startsWith("/")
        ? importedPath
        : importedPath.replace(/^\.\//, "/components/").replace(/^\.\.\//, "/");

      const possibleExtensions = ["", ".js", ".jsx", ".ts", ".tsx"];
      const resolved = possibleExtensions.some(
        (ext) =>
          filePaths.includes(normalizedPath + ext) ||
          filePaths.includes(importedPath + ext) ||
          filePaths.some((p) => p.endsWith(importedPath.replace(/^\.\//, "")))
      );

      if (!resolved && !importedPath.includes("/data/mockData")) {
        issues.push({
          severity: "warning",
          filePath: path,
          category: "imports",
          description: `Import target '${importedPath}' in ${path} may not match any generated file.`,
          suggestedFix: "Ensure imported file is created or fix the import path.",
        });
      }
    }

    // Check for Design DNA avoidPattern violations if provided
    if (designDNA?.avoidPatterns) {
      for (const pattern of designDNA.avoidPatterns) {
        if (
          pattern.toLowerCase().includes("rounded-3xl") &&
          code.includes("rounded-3xl")
        ) {
          issues.push({
            severity: "suggestion",
            filePath: path,
            category: "design_dna",
            description: `Uses 'rounded-3xl' which contradicts Design DNA constraint: ${pattern}`,
            suggestedFix: `Replace with '${designDNA.componentShapeStrategy.borderRadius}'`,
          });
        }
        if (
          pattern.toLowerCase().includes("purple") &&
          code.includes("from-purple-500") &&
          code.includes("to-indigo-500")
        ) {
          issues.push({
            severity: "suggestion",
            filePath: path,
            category: "design_dna",
            description: `Uses generic purple/indigo gradient which violates Design DNA avoid list: ${pattern}`,
            suggestedFix: `Use Design DNA palette (${designDNA.colorStrategy.primary}, ${designDNA.colorStrategy.accent})`,
          });
        }
      }
    }
  }

  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const passedStaticAnalysis = criticalCount === 0;

  return {
    passedStaticAnalysis,
    issues,
    metrics: {
      totalFiles: filePaths.length,
      totalLines,
      deadHandlerCount,
      missingExportCount,
    },
  };
}
