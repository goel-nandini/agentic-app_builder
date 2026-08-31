/**
 * Tool Registry — Phase 4
 * Canonical definition of every tool the agent can reason about and use.
 * Tools are grouped by category and annotated with safety level + execution context.
 */

import type { ToolDefinition } from "@/types/pipeline";

// ─── Tool Registry ────────────────────────────────────────────────────────────

export const TOOL_REGISTRY: ToolDefinition[] = [
  // ── Research Tools ──────────────────────────────────────────────────────────

  {
    name: "web_search",
    description:
      "Search the web for current information about APIs, libraries, implementation approaches, or technology patterns. Use when the user's request involves live data, external APIs, or cutting-edge techniques not confidently known.",
    category: "research",
    safetyLevel: "safe",
    executionContext: "server",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "The search query optimized for finding technical implementation guidance.",
        required: true,
      },
      {
        name: "intent",
        type: "string",
        description:
          "One of: 'find_api', 'find_library', 'find_approach', 'find_example'. Used to shape result extraction.",
        required: true,
      },
    ],
    example: "web_search({ query: 'free weather API no key required 2024', intent: 'find_api' })",
  },

  {
    name: "package_search",
    description:
      "Search npm for packages matching a keyword. Use when the user wants a specific category of library (e.g. 'chart library', '3D renderer', 'drag-and-drop') to identify the best available option and confirm it exists.",
    category: "package",
    safetyLevel: "safe",
    executionContext: "server",
    parameters: [
      {
        name: "keyword",
        type: "string",
        description: "The npm search keyword (e.g. 'react-dnd', 'three.js', 'date picker').",
        required: true,
      },
      {
        name: "reason",
        type: "string",
        description: "Why this package is needed for the app.",
        required: true,
      },
    ],
    example: "package_search({ keyword: 'react drag drop', reason: 'Kanban board needs drag-and-drop columns' })",
  },

  {
    name: "documentation_search",
    description:
      "Fetch and extract key implementation guidance from a specific documentation URL. Use when you know the exact library URL and need usage patterns or API signatures.",
    category: "research",
    safetyLevel: "safe",
    executionContext: "server",
    parameters: [
      {
        name: "url",
        type: "string",
        description: "Direct URL to the documentation page.",
        required: true,
      },
      {
        name: "topic",
        type: "string",
        description: "The specific topic to extract from the page (e.g. 'installation', 'basic usage', 'API reference').",
        required: true,
      },
    ],
    example: "documentation_search({ url: 'https://recharts.org/en-US/guide/getting-started', topic: 'basic chart setup' })",
  },

  // ── File Tools (Sandbox-Aware) ───────────────────────────────────────────────

  {
    name: "list_files",
    description:
      "List all files currently in the sandbox project. Use to understand existing project structure before generating new code.",
    category: "file",
    safetyLevel: "safe",
    executionContext: "sandbox",
    parameters: [],
    example: "list_files()",
  },

  {
    name: "read_file",
    description:
      "Read the content of a specific file from the current sandbox. Use when you need to understand existing code before modifying it.",
    category: "file",
    safetyLevel: "safe",
    executionContext: "sandbox",
    parameters: [
      {
        name: "path",
        type: "string",
        description: "Sandbox file path (e.g. '/App.js', '/components/Header.js').",
        required: true,
      },
    ],
    example: "read_file({ path: '/App.js' })",
  },

  {
    name: "create_file",
    description:
      "Mark a new file to be created in the sandbox project. The Code Generator will use this instruction to produce the file.",
    category: "file",
    safetyLevel: "safe",
    executionContext: "sandbox",
    parameters: [
      {
        name: "path",
        type: "string",
        description: "The intended file path (e.g. '/components/Map.js').",
        required: true,
      },
      {
        name: "purpose",
        type: "string",
        description: "What this file should contain.",
        required: true,
      },
    ],
    example: "create_file({ path: '/components/WeatherWidget.js', purpose: 'Fetches and displays current weather using Open-Meteo API' })",
  },

  {
    name: "edit_file",
    description:
      "Mark an existing sandbox file for modification. The Code Generator will be instructed to update the specified file.",
    category: "file",
    safetyLevel: "safe",
    executionContext: "sandbox",
    parameters: [
      {
        name: "path",
        type: "string",
        description: "Path of the file to modify.",
        required: true,
      },
      {
        name: "changeDescription",
        type: "string",
        description: "Description of the changes needed.",
        required: true,
      },
    ],
    example: "edit_file({ path: '/App.js', changeDescription: 'Add weather state management and API call on mount' })",
  },

  {
    name: "delete_file",
    description:
      "Mark a sandbox file for deletion. Only removes files within the current project scope.",
    category: "file",
    safetyLevel: "restricted",
    executionContext: "sandbox",
    parameters: [
      {
        name: "path",
        type: "string",
        description: "Path of the file to delete.",
        required: true,
      },
      {
        name: "reason",
        type: "string",
        description: "Why this file should be removed.",
        required: true,
      },
    ],
    example: "delete_file({ path: '/components/OldWidget.js', reason: 'Replaced by WeatherWidget.js' })",
  },

  // ── Package Tools ────────────────────────────────────────────────────────────

  {
    name: "install_dependency",
    description:
      "Validate and add an npm package to the sandbox dependencies. Always runs package_search first. Skips if package already in sandbox BASE_DEPENDENCIES.",
    category: "package",
    safetyLevel: "restricted",
    executionContext: "server",
    parameters: [
      {
        name: "packageName",
        type: "string",
        description: "The exact npm package name.",
        required: true,
      },
      {
        name: "version",
        type: "string",
        description: "Version string (e.g. 'latest', '^4.0.0').",
        required: true,
      },
      {
        name: "reason",
        type: "string",
        description: "Why this package is needed.",
        required: true,
      },
    ],
    example: "install_dependency({ packageName: 'react-beautiful-dnd', version: 'latest', reason: 'Kanban board drag-and-drop' })",
  },

  // ── Development Tools (Sandbox Context Stubs) ────────────────────────────────

  {
    name: "run_command",
    description:
      "Conceptually represents running a command in the sandbox runtime. In practice the Sandpack sandbox auto-runs. Used by the agent to signal the app should auto-execute on load.",
    category: "sandbox",
    safetyLevel: "restricted",
    executionContext: "stub",
    parameters: [
      {
        name: "command",
        type: "string",
        description: "The conceptual command (e.g. 'npm start', 'node server.js').",
        required: true,
      },
    ],
    example: "run_command({ command: 'npm start' })",
  },

  {
    name: "run_build",
    description:
      "Signals that the generated app should be compilable and production-ready. The Sandpack sandbox validates this automatically on preview load.",
    category: "sandbox",
    safetyLevel: "safe",
    executionContext: "stub",
    parameters: [],
    example: "run_build()",
  },

  {
    name: "run_lint",
    description:
      "Signals that generated code should pass ESLint rules. The static inspector (Phase 3) performs equivalent checks.",
    category: "sandbox",
    safetyLevel: "safe",
    executionContext: "stub",
    parameters: [],
    example: "run_lint()",
  },

  {
    name: "run_tests",
    description:
      "Signals that the generated app components should include testable logic. Currently handled by the Phase 3 critic/evaluator.",
    category: "sandbox",
    safetyLevel: "safe",
    executionContext: "stub",
    parameters: [],
    example: "run_tests()",
  },

  // ── Sandbox App Lifecycle Tools ──────────────────────────────────────────────

  {
    name: "start_app",
    description:
      "Signals the sandbox preview should auto-start. The Sandpack preview handles this automatically.",
    category: "sandbox",
    safetyLevel: "safe",
    executionContext: "stub",
    parameters: [],
    example: "start_app()",
  },

  {
    name: "stop_app",
    description:
      "Signals a sandbox preview stop. Managed by the client-side Sandpack component.",
    category: "sandbox",
    safetyLevel: "safe",
    executionContext: "stub",
    parameters: [],
    example: "stop_app()",
  },

  {
    name: "get_app_status",
    description:
      "Returns the current sandbox status (running/error/idle). Provided by Sandpack's useSandpack hook on the frontend.",
    category: "sandbox",
    safetyLevel: "safe",
    executionContext: "stub",
    parameters: [],
    example: "get_app_status()",
  },

  {
    name: "get_preview_url",
    description:
      "Gets the preview URL of the running sandbox. Available in the CodePanel preview iframe.",
    category: "sandbox",
    safetyLevel: "safe",
    executionContext: "stub",
    parameters: [],
    example: "get_preview_url()",
  },

  // ── Browser / Visual Tools (Sandbox Context Stubs) ────────────────────────────

  {
    name: "open_page",
    description:
      "Navigates the sandbox preview to a specific route. The generated app should implement the route; Sandpack renders it.",
    category: "browser",
    safetyLevel: "safe",
    executionContext: "stub",
    parameters: [
      {
        name: "path",
        type: "string",
        description: "The route path to navigate to (e.g. '/dashboard', '/settings').",
        required: true,
      },
    ],
    example: "open_page({ path: '/dashboard' })",
  },

  {
    name: "click",
    description:
      "Represents a click interaction within the generated app. The Code Generator should ensure the targeted element has a real onClick handler.",
    category: "browser",
    safetyLevel: "safe",
    executionContext: "stub",
    parameters: [
      {
        name: "selector",
        type: "string",
        description: "Description of the element to click (e.g. 'Submit button in the login form').",
        required: true,
      },
    ],
    example: "click({ selector: 'Add Task button in Kanban board' })",
  },

  {
    name: "type",
    description:
      "Represents typing text into an input. The Code Generator should wire the input with React controlled state.",
    category: "browser",
    safetyLevel: "safe",
    executionContext: "stub",
    parameters: [
      {
        name: "selector",
        type: "string",
        description: "Description of the input field.",
        required: true,
      },
      {
        name: "text",
        type: "string",
        description: "Text to type.",
        required: true,
      },
    ],
    example: "type({ selector: 'Task title input', text: 'Fix bug #123' })",
  },

  {
    name: "scroll",
    description:
      "Represents scrolling the generated app. Ensures the Code Generator adds overflow-y-auto and correct scrollable containers.",
    category: "browser",
    safetyLevel: "safe",
    executionContext: "stub",
    parameters: [
      {
        name: "direction",
        type: "string",
        description: "Scroll direction: 'down', 'up', 'left', 'right'.",
        required: true,
      },
    ],
    example: "scroll({ direction: 'down' })",
  },

  {
    name: "screenshot",
    description:
      "Signals that the generated app should be visually complete and screenshottable. The Phase 3 evaluator assesses visual design quality.",
    category: "browser",
    safetyLevel: "safe",
    executionContext: "stub",
    parameters: [],
    example: "screenshot()",
  },
];

// ─── Registry Accessors ───────────────────────────────────────────────────────

export function getToolByName(name: string): ToolDefinition | undefined {
  return TOOL_REGISTRY.find((t) => t.name === name);
}

export function getToolsByCategory(
  category: ToolDefinition["category"]
): ToolDefinition[] {
  return TOOL_REGISTRY.filter((t) => t.category === category);
}

export function getExecutableServerTools(): ToolDefinition[] {
  return TOOL_REGISTRY.filter((t) => t.executionContext === "server");
}

/** Compact description for AI decision prompt — avoids token bloat */
export function buildToolMenuForPrompt(): string {
  return TOOL_REGISTRY.filter((t) => t.executionContext === "server")
    .map(
      (t) =>
        `• ${t.name} [${t.category}/${t.safetyLevel}]: ${t.description}\n  Params: ${
          t.parameters.length === 0
            ? "none"
            : t.parameters
                .map((p) => `${p.name}${p.required ? "*" : "?"} (${p.type})`)
                .join(", ")
        }`
    )
    .join("\n\n");
}

// ─── Sandbox BASE_DEPENDENCIES (mirrors CodePanel.tsx) ───────────────────────
// Used by the executor to skip unnecessary install_dependency calls

export const SANDBOX_BASE_DEPENDENCIES = new Set([
  "react",
  "react-dom",
  "react-is",
  "react-router-dom",
  "lucide-react",
  "recharts",
  "date-fns",
  "framer-motion",
  "react-hook-form",
  "@hookform/resolvers",
  "zod",
  "@radix-ui/react-dialog",
  "@radix-ui/react-dropdown-menu",
  "@radix-ui/react-tabs",
  "@radix-ui/react-tooltip",
  "@radix-ui/react-accordion",
  "@radix-ui/react-select",
  "axios",
  "clsx",
  "class-variance-authority",
  "tailwind-merge",
]);
