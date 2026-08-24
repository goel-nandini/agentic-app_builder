import { ToolDefinition } from "../ai/schemas";

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  list_files: {
    name: "list_files",
    description: "List the file tree inside the isolated project sandbox.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: {
          type: "STRING",
          description: "Optional subfolder path to list, e.g. 'src'",
        },
      },
    },
  },

  read_file: {
    name: "read_file",
    description: "Read content of a specific file inside the project workspace.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: {
          type: "STRING",
          description: "Relative file path inside workspace, e.g. 'src/App.tsx'",
        },
      },
      required: ["path"],
    },
  },

  write_file: {
    name: "write_file",
    description: "Create or overwrite a file with specified content inside the workspace.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: {
          type: "STRING",
          description: "Relative file path, e.g. 'src/App.tsx' or 'styles.css'",
        },
        content: {
          type: "STRING",
          description: "Full file content string",
        },
      },
      required: ["path", "content"],
    },
  },

  delete_file: {
    name: "delete_file",
    description: "Delete a file from the project workspace.",
    parameters: {
      type: "OBJECT",
      properties: {
        path: {
          type: "STRING",
          description: "Relative file path to delete, e.g. 'src/OldComponent.tsx'",
        },
      },
      required: ["path"],
    },
  },

  install_package: {
    name: "install_package",
    description: "Install an npm package into the project sandbox.",
    parameters: {
      type: "OBJECT",
      properties: {
        package: {
          type: "STRING",
          description: "Package name to install, e.g. 'recharts' or 'lucide-react'",
        },
      },
      required: ["package"],
    },
  },

  run_command: {
    name: "run_command",
    description: "Execute a shell command strictly inside the sandbox project workspace.",
    parameters: {
      type: "OBJECT",
      properties: {
        command: {
          type: "STRING",
          description: "Shell command to run, e.g. 'npm run build'",
        },
      },
      required: ["command"],
    },
  },

  get_build_status: {
    name: "get_build_status",
    description: "Run application build verification check and return status and output.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },

  start_preview: {
    name: "start_preview",
    description: "Prepare and start the live preview environment for the generated application.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
};

export function getGeminiToolDeclarations() {
  return Object.values(TOOL_REGISTRY).map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));
}
