import { NextRequest } from "next/server";
import { runAgentPipeline } from "@/lib/agent/agentLoop";
import { db } from "@/lib/prisma";

// Allow up to 5 minutes for long-running agent pipelines
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId = `proj_${Date.now()}`, prompt, attachments, userId } = body;

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        `data: ${JSON.stringify({ type: "error", error: "Prompt is required." })}\n\n`,
        {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        }
      );
    }

    const agentRunId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: any) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          } catch {
            // stream closed
          }
        };

        sendEvent({
          type: "agent_status",
          agentRunId,
          projectId,
          status: "planning",
          timestamp: new Date().toISOString(),
        });

        const result = await runAgentPipeline({
          agentRunId,
          projectId,
          prompt,
          attachments,
          onEvent: (event) => sendEvent(event),
        });

        // Persist updated files to DB workspace
        try {
          const existing = await db.workspace.findUnique({ where: { id: projectId } }).catch(() => null);
          if (existing) {
            await db.workspace.update({
              where: { id: projectId },
              data: { fileData: result.files, updatedAt: new Date() },
            }).catch(() => null);
          } else if (userId) {
            await db.workspace.create({
              data: {
                id: projectId,
                name: `App - ${prompt.slice(0, 20)}`,
                title: prompt.slice(0, 40),
                userId,
                fileData: result.files,
              },
            }).catch(() => null);
          }
        } catch {
          // DB persistence is non-critical
        }

        sendEvent({
          type: "agent_finished",
          agentRunId,
          projectId,
          success: result.success,
          explanation: result.explanation,
          steps: result.steps,
          files: result.files,
          error: result.error,
        });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("[AgentRoute] Error:", error);
    return new Response(
      `data: ${JSON.stringify({ type: "error", error: error?.message || "Internal error" })}\n\n`,
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      }
    );
  }
}
