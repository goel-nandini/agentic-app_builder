import { exec } from "child_process";
import { CommandResult } from "../ai/schemas";
import { getWorkspacePath, ensureWorkspace } from "./sandboxManager";

const DEFAULT_TIMEOUT_MS = parseInt(process.env.COMMAND_TIMEOUT_MS || "120000", 10);
const MAX_OUTPUT_BYTES = 50 * 1024; // 50KB limit

export async function runCommand(
  projectId: string,
  command: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<CommandResult> {
  await ensureWorkspace(projectId);
  const workspacePath = getWorkspacePath(projectId);
  const startTime = Date.now();

  // Basic command safety check
  const trimmed = command.trim();
  const dangerousPatterns = [/rm\s+-rf\s+\//, /sudo/, /shutdown/, /reboot/, /mkfs/];
  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      return {
        success: false,
        exitCode: 1,
        stdout: "",
        stderr: `Security Error: Command '${command}' matches forbidden dangerous pattern.`,
        durationMs: Date.now() - startTime,
      };
    }
  }

  return new Promise((resolve) => {
    const child = exec(command, {
      cwd: workspacePath,
      timeout: timeoutMs,
      maxBuffer: MAX_OUTPUT_BYTES,
      env: {
        ...process.env,
        PATH: process.env.PATH,
        NODE_ENV: "development",
      },
    }, (error, stdout, stderr) => {
      const durationMs = Date.now() - startTime;

      let stdoutClean = stdout ? stdout.toString().slice(0, MAX_OUTPUT_BYTES) : "";
      let stderrClean = stderr ? stderr.toString().slice(0, MAX_OUTPUT_BYTES) : "";

      if (error) {
        if (error.killed) {
          stderrClean += `\n[Process timed out after ${timeoutMs}ms]`;
        }
        return resolve({
          success: false,
          exitCode: error.code || 1,
          stdout: stdoutClean,
          stderr: stderrClean || error.message,
          durationMs,
        });
      }

      resolve({
        success: true,
        exitCode: 0,
        stdout: stdoutClean,
        stderr: stderrClean,
        durationMs,
      });
    });
  });
}
