"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Zap,
  User,
} from "lucide-react";
import ChatPanel, { ChatMessage, AttachedFile, MessageStep } from "@/components/ui/chatpanel";
import CodePanel from "@/components/ui/codepanel";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";

const DEFAULT_STEPS: MessageStep[] = [
  { title: "Thinking..", status: "in-progress" },
  { title: "Defining the Objective", status: "pending" },
  { title: "Developing Visuals and Features", status: "pending" },
  { title: "Refining Animations Further", status: "pending" },
  { title: "Implementing Visuals and UX", status: "pending" },
];

export default function WorkspaceClient() {
  const searchParams = useSearchParams();
  const initialPrompt =
    searchParams?.get("prompt") || "make a weather tracker app using react and tailwind";

  const { user } = useUser();
  const [isGenerating, setIsGenerating] = useState(false);

  // fileData holds the generated application files & dependencies (Step 4 & Step 8)
  const [fileData, setFileData] = useState<{
    files: Record<string, any>;
    dependencies?: Record<string, string>;
    title?: string;
  } | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const hasFiredInitial = useRef(false);

  // ── Helper to update active AI message steps ─────────────────
  const updateAiMessageSteps = (aiMsgId: string, activeStepIdx: number, isFinished = false) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== aiMsgId) return msg;

        const updatedSteps = DEFAULT_STEPS.map((s, idx) => {
          if (isFinished) return { ...s, status: "completed" as const };
          if (idx < activeStepIdx) return { ...s, status: "completed" as const };
          if (idx === activeStepIdx) return { ...s, status: "in-progress" as const };
          return { ...s, status: "pending" as const };
        });

        return { ...msg, steps: updatedSteps };
      })
    );
  };

  // ── Direct Gemini Generation via /api/gen-ai-code ───────────
  const generateCodeFromAI = async (promptText: string, attachments?: AttachedFile[]) => {
    setIsGenerating(true);

    const aiMsgId = `ai_${Date.now()}`;
    const initialAiMsg: ChatMessage = {
      id: aiMsgId,
      sender: "ai",
      text: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      steps: DEFAULT_STEPS,
    };

    setMessages((prev) => [...prev, initialAiMsg]);

    // Animate steps sequentially in background
    let currentStep = 0;
    const stepInterval = setInterval(() => {
      currentStep++;
      if (currentStep < DEFAULT_STEPS.length) {
        updateAiMessageSteps(aiMsgId, currentStep);
      } else {
        clearInterval(stepInterval);
      }
    }, 600);

    try {
      console.log("[Generate] Calling /api/gen-ai-code for prompt:", promptText);

      const res = await fetch("/api/gen-ai-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      });

      const data = await res.json();
      clearInterval(stepInterval);

      // Step 4: Verify frontend state
      console.log("[Generation Complete]");
      console.log("files:", data.files ? Object.keys(data.files) : []);

      if (data.files && Object.keys(data.files).length > 0) {
        setFileData({
          files: data.files,
          dependencies: data.dependencies,
          title: data.title,
        });
      }

      // Mark all steps as completed and attach generated files
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== aiMsgId) return msg;
          return {
            ...msg,
            text: data.assistantMessage || `Generated application for "${promptText}"`,
            steps: DEFAULT_STEPS.map((s) => ({ ...s, status: "completed" as const })),
            filesCreated: data.files ? Object.keys(data.files) : ["/App.tsx", "/styles.css"],
          };
        })
      );

    } catch (err: any) {
      clearInterval(stepInterval);
      console.error("[Frontend] Generation error:", err?.message);
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== aiMsgId) return msg;
          return {
            ...msg,
            text: `Generation failed: ${err?.message || "Unknown error"}. Please try again.`,
            steps: [],
          };
        })
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Run generation on initial load if prompt is provided
  useEffect(() => {
    if (initialPrompt && !hasFiredInitial.current) {
      hasFiredInitial.current = true;

      // Add user message
      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        sender: "user",
        text: initialPrompt,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([userMsg]);

      generateCodeFromAI(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSendMessage = (newPrompt: string, attachments?: AttachedFile[]) => {
    if ((!newPrompt.trim() && (!attachments || attachments.length === 0)) || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: newPrompt,
      attachments: attachments,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    generateCodeFromAI(newPrompt, attachments);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#09090b]">

      {/* ── Top Header Bar (Matching SS 2) ───────────────────── */}
      <header className="h-12 border-b border-neutral-800/80 bg-[#0a0a0d] px-4 flex items-center justify-between shrink-0 select-none">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="text-white font-bold text-base tracking-tight font-mono hover:opacity-80 transition-opacity">
            &lt;forge&gt;
          </Link>
        </div>

        {/* Right: Projects + Credits + User Avatar */}
        <div className="flex items-center gap-4">
          <Link
            href="/projects"
            className="text-xs text-neutral-400 hover:text-white font-medium transition-colors"
          >
            Projects
          </Link>

          <div className="flex items-center gap-1.5 bg-neutral-900/90 border border-neutral-800 text-neutral-200 text-xs px-3 py-1 rounded-full font-medium">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>24 / 50 credits</span>
          </div>

          <div className="flex items-center">
            {user ? (
              <UserButton />
            ) : (
              <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Two-Panel Workspace ───────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* PANEL 1 (LEFT): Chat & Reasoning Steps Panel */}
        <div className="w-full md:w-[360px] lg:w-[380px] border-r border-neutral-800/80 flex flex-col h-full shrink-0 bg-[#0a0a0d]">
          <ChatPanel
            initialPrompt={initialPrompt}
            messages={messages}
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
          />
        </div>

        {/* PANEL 2 (RIGHT): Code & Live Preview Panel */}
        <CodePanel
          files={fileData?.files}
          dependencies={fileData?.dependencies}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
}
