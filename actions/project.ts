"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import type { ProjectSummary } from "@/types/project";

export type { ProjectSummary } from "@/types/project";

// ─── Get all workspaces for the current user ──────────────────────────────────

export async function getUserProjects(): Promise<ProjectSummary[]> {
    const { userId: clerkId } = await auth();
    if (!clerkId) redirect("/");

    const user = await db.user.findUnique({
        where: { clerkId },
        select: { id: true },
    });
    if (!user) redirect("/");

    const workspaces = await db.workspace.findMany({
        where: { userId: user.id },
        select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true,
            message: true,
        },
        orderBy: { updatedAt: "desc" },
    });

    return workspaces.map((w: (typeof workspaces)[number]) => {
        const msgs = Array.isArray(w.message) ? (w.message as Array<Record<string, unknown>>) : [];
        const firstUserMsg = msgs.find(
            (m) => typeof m === "object" && m !== null && m.role === "user"
        );

        return {
            id: w.id,
            title: w.title,
            firstPrompt: typeof firstUserMsg?.content === "string" ? firstUserMsg.content.slice(0, 120) : null,
            createdAt: w.createdAt,
            updatedAt: w.updatedAt,
            messageCount: Array.isArray(w.message) ? w.message.length : 0,
        };
    });
}

// ─── Delete a workspace ───────────────────────────────────────────────────────

export async function deleteProject(workspaceId: string): Promise<void> {
    const { userId: clerkId } = await auth();
    if (!clerkId) redirect("/");

    const user = await db.user.findUnique({
        where: { clerkId },
        select: { id: true },
    });
    if (!user) redirect("/");

    await db.workspace.deleteMany({
        where: { id: workspaceId, userId: user.id },
    });

    revalidatePath("/projects");
}