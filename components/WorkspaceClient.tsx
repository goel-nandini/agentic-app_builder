"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  Download,
  Share2,
  Zap,
  CheckCircle2,
  Loader2,
  Clock,
  Rocket,
  ChevronRight,
  Crown,
  ArrowUpRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ChatPanel, { ChatMessage, AttachedFile } from "@/components/ui/chatpanel";
import CodePanel from "@/components/ui/codepanel";
import Link from "next/link";

// ─── Build Status ────────────────────────────────────────────
type BuildStatus = "initializing" | "analyzing" | "building" | "compiling" | "ready";

const STATUS_STEPS: { key: BuildStatus; label: string }[] = [
  { key: "initializing", label: "Initializing" },
  { key: "analyzing",    label: "Analyzing" },
  { key: "building",     label: "Building" },
  { key: "compiling",    label: "Compiling" },
  { key: "ready",        label: "Ready" },
];

function BuildStatusBar({ status }: { status: BuildStatus }) {
  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === status);
  const isReady = status === "ready";

  return (
    <div className="h-9 border-b border-white/8 bg-[#0a0a0d] px-4 flex items-center gap-4 shrink-0 select-none">
      {/* Status dot + label */}
      <div className="flex items-center gap-2 min-w-[130px]">
        {isReady ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        ) : (
          <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin shrink-0" />
        )}
        <span className={`text-[11px] font-semibold tracking-wide ${isReady ? "text-emerald-300" : "text-purple-300"}`}>
          {isReady ? "Project Ready" : `${STATUS_STEPS[currentIdx]?.label ?? "Working"}…`}
        </span>
      </div>

      {/* Step progress pills */}
      <div className="hidden sm:flex items-center gap-1.5">
        {STATUS_STEPS.map((step, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          return (
            <React.Fragment key={step.key}>
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all duration-300 ${
                  done
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                    : active
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse"
                    : "text-neutral-600 border border-white/5"
                }`}
              >
                {done && <CheckCircle2 className="w-2.5 h-2.5" />}
                {active && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                {!done && !active && <Clock className="w-2.5 h-2.5" />}
                {step.label}
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <ChevronRight className="w-3 h-3 text-neutral-700 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Right side timing */}
      <div className="ml-auto text-[10px] text-neutral-500">
        {isReady ? (
          <span className="text-emerald-500/70">✓ Completed</span>
        ) : (
          <span>Generating…</span>
        )}
      </div>
    </div>
  );
}

// ─── Improve With AI Panel ────────────────────────────────────
function ImproveWithAIPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="mx-3 mb-3 rounded-xl border border-purple-500/25 bg-gradient-to-br from-purple-950/40 via-[#0e0a1a] to-[#0a0a0f] p-3.5 relative overflow-hidden shrink-0">
      {/* Glow */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-neutral-500 hover:text-white transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className="h-7 w-7 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
          <Crown className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div>
          <div className="text-xs font-bold text-white leading-tight">Improve with AI</div>
          <div className="text-[10px] text-neutral-400">Unlock advanced generation models</div>
        </div>
      </div>

      {/* Feature list */}
      <ul className="space-y-1.5 mb-3">
        {[
          "GPT-4o & Claude Sonnet 4 models",
          "10× faster code generation",
          "Multi-file project scaffolding",
          "Priority queue & no rate limits",
        ].map((feat) => (
          <li key={feat} className="flex items-center gap-2 text-[11px] text-neutral-300">
            <CheckCircle2 className="w-3 h-3 text-purple-400 shrink-0" />
            {feat}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link href="/#pricing" className="block">
        <Button
          size="sm"
          className="w-full h-8 text-[11px] bg-purple-600 hover:bg-purple-500 text-white gap-1.5 shadow-lg shadow-purple-600/20 font-medium"
        >
          <Rocket className="w-3.5 h-3.5" />
          View Plans & Upgrade
          <ArrowUpRight className="w-3 h-3 ml-auto" />
        </Button>
      </Link>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function WorkspaceClient() {
  const searchParams = useSearchParams();
  const initialPrompt =
    searchParams?.get("prompt") || "Build a responsive task management app with a Kanban board";

  const [isGenerating, setIsGenerating] = useState(false);
  const [buildStatus, setBuildStatus] = useState<BuildStatus>("initializing");
  const [showImprovePanel, setShowImprovePanel] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "user",
      text: initialPrompt,
      timestamp: "Just now",
    },
    {
      id: "2",
      sender: "ai",
      text: `I'm generating your full-stack AI application for: "${initialPrompt}". I've set up the React Sandpack canvas and state management:`,
      timestamp: "Just now",
      steps: [
        { title: "Analyzed project prompt & component architecture", status: "completed" },
        { title: "Generated React components & CSS design system", status: "completed" },
        { title: "Mounted live Sandpack preview canvas", status: "completed" },
      ],
      filesCreated: ["/App.tsx", "/styles.css"],
    },
  ]);

  // Simulate build status progression on mount
  useEffect(() => {
    const sequence: BuildStatus[] = ["initializing", "analyzing", "building", "compiling", "ready"];
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i < sequence.length) {
        setBuildStatus(sequence[i]);
      } else {
        clearInterval(interval);
      }
    }, 900);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = (newPrompt: string, attachments?: AttachedFile[]) => {
    if ((!newPrompt.trim() && (!attachments || attachments.length === 0)) || isGenerating) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: newPrompt,
      attachments: attachments,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);
    setBuildStatus("building");

    setTimeout(() => {
      setBuildStatus("compiling");
      setTimeout(() => {
        const hasAttachments = attachments && attachments.length > 0;
        const attachmentSummary = hasAttachments
          ? ` Analyzed ${attachments.length} uploaded asset(s) and applied code changes.`
          : "";

        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: `Updated application and generated requested changes for: "${newPrompt || "Uploaded assets"}"${attachmentSummary}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          steps: [
            { title: "Processed uploaded context assets", status: "completed" },
            { title: "Updated UI state & component layout", status: "completed" },
            { title: "Hot-reloaded live Sandpack preview canvas", status: "completed" },
          ],
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsGenerating(false);
        setBuildStatus("ready");
      }, 800);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#09090b]">

      {/* ── Top Header Bar ─────────────────────────────────── */}
      <header className="h-12 border-b border-white/10 bg-[#0d0d11] px-4 flex items-center justify-between shrink-0 select-none">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-base tracking-tight font-mono">
            &lt;forge&gt;
          </span>
          <div className="h-4 w-px bg-white/10" />
          <Badge
            variant="outline"
            className="gap-1 border-purple-500/30 bg-purple-500/10 text-purple-300 text-[11px]"
          >
            <Sparkles className="w-3 h-3 text-purple-400" /> Gemini 3.6 Flash
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <Badge
            variant="outline"
            className="gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-300 text-[11px] py-1 cursor-pointer hover:bg-amber-500/20 transition-colors"
          >
            <Zap className="w-3 h-3 fill-amber-400 text-amber-400" /> 10 Credits
          </Badge>

          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-[11px] border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white"
          >
            <Download className="w-3 h-3" /> Export
          </Button>
          <Button
            size="sm"
            className="h-7 gap-1.5 text-[11px] bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20"
          >
            <Share2 className="w-3 h-3" /> Share
          </Button>
        </div>
      </header>

      {/* ── Build Status Bar ───────────────────────────────── */}
      <BuildStatusBar status={buildStatus} />

      {/* ── Main Dual-Pane Workspace ───────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: Chat Panel + Improve with AI */}
        <div className="w-full md:w-[420px] lg:w-[460px] border-r border-white/10 flex flex-col h-full shrink-0">
          {/* Chat takes all remaining space */}
          <div className="flex-1 overflow-hidden">
            <ChatPanel
              initialPrompt={initialPrompt}
              messages={messages}
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
            />
          </div>

          {/* Improve with AI panel (dismissible) */}
          {showImprovePanel && (
            <ImproveWithAIPanel onClose={() => setShowImprovePanel(false)} />
          )}

          {/* Collapsed trigger when dismissed */}
          {!showImprovePanel && (
            <button
              onClick={() => setShowImprovePanel(true)}
              className="mx-3 mb-3 flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-[11px] text-purple-400 hover:bg-purple-500/10 transition-colors shrink-0"
            >
              <Crown className="w-3.5 h-3.5" />
              Improve with AI — Upgrade model
              <ArrowUpRight className="w-3 h-3 ml-auto" />
            </button>
          )}
        </div>

        {/* RIGHT: Code & Live Preview */}
        <CodePanel />
      </div>
    </div>
  );
}
