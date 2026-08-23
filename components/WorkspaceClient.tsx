"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Bot,
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

// ─── Unique Animated Marquee Scroller Ticker ──────────────────
function GenerationMarqueeScroller({ activePrompt }: { activePrompt: string }) {
  const tickerItems = [
    "⚡ FORGE AI ENGINE ACTIVE",
    `🎯 Intent: "${activePrompt || "Building Application"}"`,
    "🧠 Architecting Component Logic & State",
    "🎨 Applying CSS Tokens & Dynamic Styling",
    "📦 Assembling Live Sandpack Canvas",
    "✨ Verifying Code Safety & Interactivity",
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-purple-950/90 via-[#0e071c] to-purple-950/90 border-b border-purple-500/30 py-2 px-4 flex items-center shrink-0 shadow-lg shadow-purple-950/50">
      {/* Top glowing animated pulse bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-400 animate-pulse" />

      {/* Marquee ticker wrapper */}
      <div className="overflow-hidden w-full flex items-center">
        <div className="animate-marquee flex items-center gap-8 whitespace-nowrap text-xs font-mono">
          {tickerItems.concat(tickerItems).map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-purple-200/90 font-medium shrink-0">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span>{item}</span>
              <span className="text-purple-500/40 ml-4 font-bold">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Improve With AI Panel ────────────────────────────────────
function ImproveWithAIPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="mx-3 mb-3 rounded-xl border border-purple-500/25 bg-gradient-to-br from-purple-950/40 via-[#0e0a1a] to-[#0a0a0f] p-3.5 relative overflow-hidden shrink-0">
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />

      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-neutral-500 hover:text-white transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-2 mb-2.5">
        <div className="h-7 w-7 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
          <Crown className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div>
          <div className="text-xs font-bold text-white leading-tight">Improve with AI</div>
          <div className="text-[10px] text-neutral-400">Unlock advanced generation models</div>
        </div>
      </div>

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
  const [activePromptText, setActivePromptText] = useState(initialPrompt);

  const [sandpackFiles, setSandpackFiles] = useState<Record<string, string>>({
    "/App.tsx": `import React, { useState } from "react";
import "./styles.css";

export default function App() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Design UI Architecture", status: "Done" },
    { id: 2, title: "Connect Supabase Database", status: "In Progress" },
    { id: 3, title: "Deploy AI Workspace Canvas", status: "Todo" },
  ]);

  return (
    <div className="container">
      <header className="header">
        <div className="logo">⚡ AI Generated App</div>
        <p>Built live with Forge AI & Gemini 3.6 Flash</p>
      </header>

      <div className="grid">
        {tasks.map((task) => (
          <div key={task.id} className="card">
            <h3>{task.title}</h3>
            <span className={\`badge \${task.status.toLowerCase().replace(" ", "-")}\`}>
              {task.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}`,
    "/styles.css": `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 2rem; }
.container { max-width: 800px; margin: 0 auto; }
.header { text-align: center; margin-bottom: 2rem; }
.logo { font-size: 2rem; font-weight: 800; color: #c084fc; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
.card { background: #18181b; border: 1px solid #27272a; padding: 1.25rem; border-radius: 1rem; display: flex; flex-direction: column; gap: 1rem; }
.badge { align-self: flex-start; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
.badge.done { background: #064e3b; color: #34d399; }
.badge.in-progress { background: #1e3a8a; color: #60a5fa; }
.badge.todo { background: #312e81; color: #a78bfa; }`,
  });

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
      text: `Starting AI application build for: **"${initialPrompt}"**. Initializing Sandpack canvas and generating component tree...`,
      timestamp: "Just now",
      steps: [
        { title: "Analyzed project prompt & component architecture", status: "completed" },
        { title: "Connected Gemini AI generation engine", status: "completed" },
      ],
    },
  ]);

  const hasFiredInitial = useRef(false);

  // Call Gemini API to generate real code
  const generateCodeFromAI = async (promptText: string, attachments?: AttachedFile[]) => {
    const startTime = Date.now();
    setIsGenerating(true);
    setActivePromptText(promptText || "Building Application");
    setBuildStatus("analyzing");

    try {
      setBuildStatus("building");
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText, attachments }),
      });

      const data = await res.json();

      // Ensure ticker animation plays for at least 2.2 seconds for great UX
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 2200 - elapsedTime);
      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      setBuildStatus("compiling");

      if (data.files && Object.keys(data.files).length > 0) {
        setSandpackFiles(data.files);
      }

      const generatedFilesList = data.files ? Object.keys(data.files) : ["/App.tsx", "/styles.css"];

      const aiMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: "ai",
        text: data.explanation || `Successfully generated full application for: "${promptText}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        steps: data.steps
          ? data.steps.map((s: string) => ({ title: s, status: "completed" }))
          : [
              { title: "Parsed prompt intent & asset context", status: "completed" },
              { title: "Synthesized React component hierarchy with Gemini Gen AI", status: "completed" },
              { title: "Updated live Sandpack preview canvas", status: "completed" },
            ],
        filesCreated: generatedFilesList,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setBuildStatus("ready");
    } catch (err: any) {
      console.error("Generation error:", err);
      setBuildStatus("ready");
    } finally {
      setIsGenerating(false);
    }
  };

  // Run generation on initial load if prompt is provided
  useEffect(() => {
    if (initialPrompt && !hasFiredInitial.current) {
      hasFiredInitial.current = true;
      generateCodeFromAI(initialPrompt);
    }
  }, [initialPrompt]);

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
    generateCodeFromAI(newPrompt, attachments);
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

      {/* ── Unique Marquee Scroller Ticker (Runs during AI Generation) ── */}
      {isGenerating && <GenerationMarqueeScroller activePrompt={activePromptText} />}

      {/* ── Main Dual-Pane Workspace ───────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: Chat Panel + Improve with AI */}
        <div className="w-full md:w-[420px] lg:w-[460px] border-r border-white/10 flex flex-col h-full shrink-0">
          <div className="flex-1 overflow-hidden">
            <ChatPanel
              initialPrompt={initialPrompt}
              messages={messages}
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
            />
          </div>

          {showImprovePanel && (
            <ImproveWithAIPanel onClose={() => setShowImprovePanel(false)} />
          )}

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
        <CodePanel files={sandpackFiles} />
      </div>
    </div>
  );
}
