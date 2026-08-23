"use client";

import React, { useState } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
} from "@codesandbox/sandpack-react";
import { nightOwl } from "@codesandbox/sandpack-themes";
import {
  Eye,
  Code2,
  Columns,
  Monitor,
  Tablet,
  Smartphone,
} from "lucide-react";

type ViewMode = "preview" | "code" | "split";
type Viewport = "desktop" | "tablet" | "mobile";

interface CodePanelProps {
  files?: Record<string, string>;
}

const DEFAULT_SANDPACK_FILES = {
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
        <p>Built live with Forge AI & Sandpack</p>
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
  "/styles.css": `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: #09090b;
  color: #f4f4f5;
  padding: 2rem;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  font-size: 2rem;
  font-weight: 800;
  color: #c084fc;
}

.header p {
  color: #71717a;
  margin-top: 0.5rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.card {
  background: #18181b;
  border: 1px solid #27272a;
  padding: 1.25rem;
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
}

.card h3 {
  font-size: 1rem;
  color: #f4f4f5;
}

.badge {
  align-self: flex-start;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge.done {
  background: #064e3b;
  color: #34d399;
}

.badge.in-progress {
  background: #1e3a8a;
  color: #60a5fa;
}

.badge.todo {
  background: #312e81;
  color: #a78bfa;
}`,
};

export default function CodePanel({ files = DEFAULT_SANDPACK_FILES }: CodePanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [viewport, setViewport] = useState<Viewport>("desktop");

  return (
    <div className="flex-1 flex flex-col h-full bg-[#09090b] overflow-hidden min-w-0">
      <SandpackProvider
        key={Object.keys(files).join("-") + Object.values(files).reduce((acc, f) => acc + f.length, 0)}
        template="react-ts"
        theme={nightOwl}
        files={files}
        options={{ recompileMode: "immediate", recompileDelay: 300 }}
        style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}
      >
        {/* ── Control Bar ───────────────────────────────────── */}
        <div className="h-11 border-b border-white/10 bg-[#0c0c0e] px-3 flex items-center justify-between shrink-0 select-none gap-2">
          {/* View Mode */}
          <div className="flex items-center gap-0.5 bg-white/5 border border-white/10 rounded-lg p-0.5">
            {(["preview", "code", "split"] as ViewMode[]).map((mode) => {
              const Icon = mode === "preview" ? Eye : mode === "code" ? Code2 : Columns;
              return (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all ${
                    viewMode === mode
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {mode}
                </button>
              );
            })}
          </div>

          {/* Viewport Controls (only in preview/split) */}
          {viewMode !== "code" && (
            <div className="flex items-center gap-0.5 bg-white/5 border border-white/10 rounded-lg p-0.5">
              {([
                { key: "desktop", Icon: Monitor, title: "Laptop / Desktop View (Full Width)" },
                { key: "tablet",  Icon: Tablet,  title: "Tablet View (768px)" },
                { key: "mobile",  Icon: Smartphone, title: "Phone View (375px)" },
              ] as { key: Viewport; Icon: React.ElementType; title: string }[]).map(({ key, Icon, title }) => (
                <button
                  key={key}
                  onClick={() => setViewport(key)}
                  title={title}
                  className={`p-1.5 rounded transition-colors ${
                    viewport === key
                      ? "bg-purple-600/30 text-purple-300 border border-purple-500/40"
                      : "text-neutral-500 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Sandpack Canvas ───────────────────────────────── */}
        <div
          style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex" }}
          className="bg-[#070709]"
        >
          <SandpackLayout
            style={{
              display: "flex",
              flex: 1,
              height: "100%",
              minHeight: 0,
              width: "100%",
              border: "none",
              borderRadius: 0,
              background: "transparent",
              gap: 0,
            }}
          >
            {/* File Explorer + Code Editor */}
            {(viewMode === "code" || viewMode === "split") && (
              <>
                <SandpackFileExplorer
                  style={{ height: "100%", background: "#0a0a0d", borderRight: "1px solid rgba(255,255,255,0.08)", minWidth: 150, maxWidth: 180 }}
                />
                <SandpackCodeEditor
                  showTabs
                  showLineNumbers
                  showInlineErrors
                  wrapContent
                  closableTabs
                  style={{ height: "100%", flex: 1, minWidth: 0, background: "#08080a" }}
                />
              </>
            )}

            {/* Live Preview Container */}
            {(viewMode === "preview" || viewMode === "split") && (
              <div
                className={`flex-1 h-full min-h-0 flex flex-col justify-center items-center overflow-hidden transition-all duration-300 ${
                  viewport !== "desktop" ? "p-3 sm:p-4 bg-[#050507]" : ""
                }`}
                style={{
                  borderLeft: viewMode === "split" ? "1px solid rgba(255,255,255,0.08)" : "none",
                }}
              >
                {/* LAPTOP / DESKTOP VIEW: Full width edge-to-edge */}
                {viewport === "desktop" && (
                  <div className="w-full h-full min-h-0 flex flex-col">
                    <SandpackPreview
                      showNavigator
                      showRefreshButton
                      showOpenInCodeSandbox={false}
                      style={{ flex: 1, height: "100%", minHeight: 0, background: "#0d0d11" }}
                    />
                  </div>
                )}

                {/* TABLET VIEW: 768px Centered Frame with Bezel */}
                {viewport === "tablet" && (
                  <div className="w-full max-w-[768px] h-full max-h-[100%] flex flex-col rounded-2xl border-4 border-neutral-800 bg-[#0d0d11] shadow-2xl overflow-hidden relative">
                    {/* Tablet Top Camera Notch Strip */}
                    <div className="h-6 bg-neutral-900 border-b border-white/5 flex items-center justify-center gap-2 shrink-0 select-none">
                      <div className="w-2 h-2 rounded-full bg-neutral-700" />
                      <span className="text-[10px] text-neutral-400 font-mono">Tablet (768px)</span>
                    </div>
                    <SandpackPreview
                      showNavigator
                      showRefreshButton
                      showOpenInCodeSandbox={false}
                      style={{ flex: 1, height: "100%", minHeight: 0, background: "#0d0d11" }}
                    />
                  </div>
                )}

                {/* PHONE VIEW: 375px Centered Mockup Frame */}
                {viewport === "mobile" && (
                  <div className="w-[375px] h-full max-h-[667px] flex flex-col rounded-[32px] border-[6px] border-neutral-800 bg-[#0d0d11] shadow-2xl overflow-hidden relative">
                    {/* Phone Camera & Speaker Notch */}
                    <div className="h-6 bg-neutral-900 border-b border-white/5 flex items-center justify-center shrink-0 select-none">
                      <div className="w-16 h-3 bg-black rounded-full flex items-center justify-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
                        <div className="w-6 h-1 rounded-full bg-neutral-800" />
                      </div>
                    </div>
                    <SandpackPreview
                      showNavigator
                      showRefreshButton
                      showOpenInCodeSandbox={false}
                      style={{ flex: 1, height: "100%", minHeight: 0, background: "#0d0d11" }}
                    />
                  </div>
                )}
              </div>
            )}
          </SandpackLayout>
        </div>
      </SandpackProvider>
    </div>
  );
}
