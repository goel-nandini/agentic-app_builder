import { ToolResult } from "../ai/schemas";
import { listFiles, readFile, writeFile, deleteFile } from "../sandbox/fileTools";
import { installPackage } from "../sandbox/packageTools";
import { runCommand } from "../sandbox/commandTools";
import { preparePreview } from "../sandbox/previewManager";

export async function executeToolCall(
  projectId: string,
  toolName: string,
  args: Record<string, any>
): Promise<ToolResult> {
  try {
    switch (toolName) {
      case "list_files": {
        const files = await listFiles(projectId, args.path || "");
        return {
          success: true,
          tool: toolName,
          data: { files },
        };
      }

      case "read_file": {
        if (!args.path) {
          throw new Error("Missing 'path' argument for read_file");
        }
        const content = await readFile(projectId, args.path);
        return {
          success: true,
          tool: toolName,
          data: { path: args.path, content },
        };
      }

      case "write_file": {
        if (!args.path || args.content === undefined) {
          throw new Error("Missing 'path' or 'content' argument for write_file");
        }
        const res = await writeFile(projectId, args.path, args.content);
        return {
          success: true,
          tool: toolName,
          data: res,
        };
      }

      case "delete_file": {
        if (!args.path) {
          throw new Error("Missing 'path' argument for delete_file");
        }
        const res = await deleteFile(projectId, args.path);
        return {
          success: true,
          tool: toolName,
          data: res,
        };
      }

      case "install_package": {
        if (!args.package) {
          throw new Error("Missing 'package' argument for install_package");
        }
        const res = await installPackage(projectId, args.package);
        return {
          success: res.success,
          tool: toolName,
          data: res,
        };
      }

      case "run_command": {
        if (!args.command) {
          throw new Error("Missing 'command' argument for run_command");
        }
        const res = await runCommand(projectId, args.command);
        return {
          success: res.success,
          tool: toolName,
          data: res,
        };
      }

      case "get_build_status": {
        const res = await runCommand(projectId, "npm run build");
        return {
          success: res.success,
          tool: toolName,
          data: res,
        };
      }

      case "start_preview": {
        const res = await preparePreview(projectId);
        return {
          success: res.success,
          tool: toolName,
          data: res,
        };
      }

      default:
        return {
          success: false,
          tool: toolName,
          error: {
            code: "UNKNOWN_TOOL",
            message: `Tool '${toolName}' is not registered.`,
          },
        };
    }
  } catch (err: any) {
    return {
      success: false,
      tool: toolName,
      error: {
        code: "TOOL_EXECUTION_ERROR",
        message: err?.message || "Unknown error executing tool.",
      },
    };
  }
}
