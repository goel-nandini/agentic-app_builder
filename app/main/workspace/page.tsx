"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  Send,
  Code2,
  Eye,
  Terminal,
  Monitor,
  Tablet,
  Smartphone,
  Download,
  Share2,
  RotateCw,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  FileCode2,
  FolderTree,
  Zap,
  CheckCircle2,
  Loader2,
  Paperclip,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MockKanban from "@/components/MockKanban";
import MockChat from "@/components/MockChat";

type TabType = "preview" | "code" | "logs";
type ViewportType = "desktop" | "tablet" | "mobile";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  steps?: { title: string; status: "pending" | "in-progress" | "completed" }[];
}

const MOCK_FILES: Record<string, string> = {
  "App.tsx": `import React from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <Dashboard />
      </main>
    </div>
  );
}`,
  "components/Header.tsx": `import React from 'react';
import { Sparkles, Layers } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 font-bold text-lg text-purple-400">
        <Sparkles className="w-5 h-5" />
        <span>Generated AI Workspace</span>
      </div>
      <button className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors">
        Deploy App
      </button>
    </header>
  );
}`,
  "components/Dashboard.tsx": `import React from 'react';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold text-white">Project Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-sm text-slate-400">Total Users</div>
          <div className="text-2xl font-bold mt-2">12,480</div>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-sm text-slate-400">Active Builds</div>
          <div className="text-2xl font-bold mt-2 text-emerald-400">99.8%</div>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-sm text-slate-400">AI Generations</div>
          <div className="text-2xl font-bold mt-2 text-purple-400">1,420</div>
        </div>
      </div>
    </div>
  );
}`,
  "styles/globals.css": `@import "tailwindcss";

@layer base {
  body {
    background-color: #09090b;
    color: #f8fafc;
  }
}`,
};

export default function WorkspacePage() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams?.get("prompt") || "Build a task management dashboard with a Kanban board";

  const [inputPrompt, setInputPrompt] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("preview");
  const [viewport, setViewport] = useState<ViewportType>("desktop");
  const [projectTitle, setProjectTitle] = useState("AI Generated Workspace");
  const [selectedFile, setSelectedFile] = useState("App.tsx");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "user",
      text: initialPrompt,
      timestamp: "Just now",
    },
    {
      id: "2",
      sender: "ai",
      text: `I'm generating your full-stack AI application based on prompt: "${initialPrompt}". Here is the current progress:`,
      timestamp: "Just now",
      steps: [
        { title: "Analyzing prompt & generating project architecture", status: "completed" },
        { title: "Creating React components & Tailwind CSS styling", status: "completed" },
        { title: "Bundling dependencies and establishing live preview", status: "completed" },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleSendPrompt = () => {
    if (!inputPrompt.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: inputPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt("");
    setIsGenerating(true);

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: `Updating application layout and adding requested features for: "${inputPrompt}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        steps: [
          { title: "Updating UI state & component hierarchy", status: "completed" },
          { title: "Applying dynamic styling & responsive layout", status: "completed" },
        ],
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsGenerating(false);
    }, 1500);
  };

  const handleCopyCode = () => {
    const code = MOCK_FILES[selectedFile] || "";
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#09090b]">
      {/* Workspace Top Header Bar */}
      <header className="h-14 border-b border-white/10 bg-[#0d0d11] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="bg-transparent text-sm font-semibold text-white focus:outline-none focus:border-purple-500 border border-transparent rounded px-2 py-1 transition-colors"
          />
          <Badge variant="outline" className="gap-1 border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs">
            <Sparkles className="w-3 h-3" /> Gemini 3.6 Flash
          </Badge>
        </div>

        {/* Viewport Switcher Controls */}
        <div className="hidden sm:flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
          <button
            onClick={() => setViewport("desktop")}
            className={`p-1.5 rounded text-xs transition-colors ${
              viewport === "desktop" ? "bg-purple-600 text-white" : "text-neutral-400 hover:text-white"
            }`}
            title="Desktop View"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewport("tablet")}
            className={`p-1.5 rounded text-xs transition-colors ${
              viewport === "tablet" ? "bg-purple-600 text-white" : "text-neutral-400 hover:text-white"
            }`}
            title="Tablet View"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewport("mobile")}
            className={`p-1.5 rounded text-xs transition-colors ${
              viewport === "mobile" ? "bg-purple-600 text-white" : "text-neutral-400 hover:text-white"
            }`}
            title="Mobile View"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white"
          >
            <Download className="w-3.5 h-3.5" /> Export ZIP
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </Button>
        </div>
      </header>

      {/* Main Split-Pane Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Chat & Prompts */}
        <div className="w-full md:w-[420px] lg:w-[460px] border-r border-white/10 bg-[#0c0c0e] flex flex-col shrink-0">
          {/* Chat Header */}
          <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-neutral-300">AI Builder Assistant</span>
            </div>
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider">Live Chat</span>
          </div>

          {/* Chat Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl p-3.5 text-sm ${
                    msg.sender === "user"
                      ? "bg-purple-600/90 text-white rounded-br-none"
                      : "bg-white/5 border border-white/10 text-neutral-200 rounded-bl-none"
                  }`}
                >
                  <p className="leading-relaxed">{msg.text}</p>

                  {/* Render Execution Steps if AI message */}
                  {msg.steps && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                      {msg.steps.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-neutral-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{step.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isGenerating && (
              <div className="flex items-center gap-2.5 text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Generating code & updating workspace canvas...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Input Box */}
          <div className="p-3.5 border-t border-white/10 bg-[#09090b]">
            <div className="rounded-xl border border-white/10 bg-white/5 p-2 focus-within:border-purple-500/60 transition-colors">
              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPrompt();
                  }
                }}
                placeholder="Ask AI to make changes, add features, or adjust layout..."
                rows={2}
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none resize-none px-2 py-1"
              />
              <div className="flex items-center justify-between pt-2 border-t border-white/5 px-1">
                <button
                  type="button"
                  className="text-neutral-400 hover:text-white p-1 transition-colors"
                  title="Attach asset"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <Button
                  onClick={handleSendPrompt}
                  disabled={!inputPrompt.trim() || isGenerating}
                  size="sm"
                  className="h-8 px-3 gap-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-lg disabled:opacity-50"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Live Preview & Code Canvas */}
        <div className="flex-1 flex flex-col bg-[#09090b] overflow-hidden">
          {/* Tab Navigation Header */}
          <div className="h-11 border-b border-white/10 bg-[#0c0c0e] px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === "preview"
                    ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Preview
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === "code"
                    ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" /> Code
              </button>
              <button
                onClick={() => setActiveTab("logs")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === "logs"
                    ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" /> Logs
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="p-1.5 text-neutral-400 hover:text-white transition-colors"
                title="Reload Preview"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* TAB CONTENT AREA */}
          <div className="flex-1 overflow-hidden p-4 flex justify-center items-center bg-[#070709]">
            {/* TAB 1: PREVIEW */}
            {activeTab === "preview" && (
              <div
                className={`h-full transition-all duration-300 flex flex-col rounded-xl border border-white/10 bg-[#0d0d11] overflow-hidden shadow-2xl ${
                  viewport === "desktop"
                    ? "w-full"
                    : viewport === "tablet"
                    ? "w-[768px]"
                    : "w-[375px]"
                }`}
              >
                <div className="h-8 border-b border-white/10 bg-[#121217] px-3 flex items-center justify-between text-xs text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-[11px] text-neutral-500 font-mono">https://preview.forge.ai</span>
                  <ExternalLink className="w-3 h-3 text-neutral-500" />
                </div>
                <div className="flex-1 overflow-auto p-6 bg-black/40">
                  <MockKanban />
                </div>
              </div>
            )}

            {/* TAB 2: CODE */}
            {activeTab === "code" && (
              <div className="w-full h-full flex rounded-xl border border-white/10 bg-[#0d0d11] overflow-hidden">
                {/* File Tree Explorer Sidebar */}
                <div className="w-56 border-r border-white/10 bg-[#0a0a0d] p-3 flex flex-col">
                  <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5 text-purple-400" /> Files
                  </div>
                  <div className="space-y-1">
                    {Object.keys(MOCK_FILES).map((fileName) => (
                      <button
                        key={fileName}
                        onClick={() => setSelectedFile(fileName)}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          selectedFile === fileName
                            ? "bg-purple-600/20 text-purple-300 font-medium"
                            : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <FileCode2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{fileName}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Code Viewer Panel */}
                <div className="flex-1 flex flex-col bg-[#0d0d11]">
                  <div className="h-9 border-b border-white/10 px-4 flex items-center justify-between bg-[#111116]">
                    <span className="text-xs font-mono text-purple-300">{selectedFile}</span>
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="flex-1 p-4 font-mono text-xs text-neutral-200 overflow-auto bg-[#08080a] leading-relaxed">
                    <code>{MOCK_FILES[selectedFile]}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 3: LOGS */}
            {activeTab === "logs" && (
              <div className="w-full h-full rounded-xl border border-white/10 bg-[#0a0a0d] p-4 font-mono text-xs text-emerald-400 overflow-auto space-y-2">
                <div>[build] Starting Next.js compilation...</div>
                <div>[build] Compiling page components: App.tsx, Dashboard.tsx</div>
                <div>[build] Generated static assets in 120ms</div>
                <div className="text-neutral-400">[vite] dev server running at http://localhost:3000</div>
                <div className="text-purple-300">[AI Agent] Code successfully assembled and rendered in preview window.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
