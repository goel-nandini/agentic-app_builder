"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { CheckoutButton } from "@clerk/nextjs/experimental";
import {
  ArrowRight,
  Zap,
  ChevronRight,
  Check,
  Sparkles,
  Laptop,
  Tablet,
  Smartphone,
  Code2,
  Eye,
  ShieldCheck,
  Cpu,
  Layers,
  Flame,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HoleBackground } from "@/components/animate-ui/components/backgrounds/hole";
import { Badge } from "@/components/ui/badge";
import { FEATURES, PLACEHOLDERS, STEPS, SUGGESTIONS } from "@/lib/data";
import { PRICING_PLANS } from "@/lib/constants";
import {
  BlueTitle,
  GrayTitle,
  SectionHeading,
  SectionLabel,
} from "@/components/Reusables";
import Footer from "@/components/Footer";

export default function LandingPage() {
  const { isSignedIn, has } = useAuth();
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [prompt, setPrompt] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [demoTab, setDemoTab] = useState<"preview" | "code">("preview");
  const [demoDevice, setDemoDevice] = useState<"laptop" | "tablet" | "mobile">("laptop");

  useEffect(() => {
    if (isFocused || prompt) return;
    const t = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3200);
    return () => clearInterval(t);
  }, [isFocused, prompt]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }, [prompt]);

  const handleSubmit = () => {
    if (!prompt.trim() || !isSignedIn) return;
    router.push(`/workspace?prompt=${encodeURIComponent(prompt.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestion = (s: string) => {
    setPrompt(s);
    textareaRef.current?.focus();
  };

  return (
    <main className="min-h-screen bg-[#070709] text-white selection:bg-cyan-500/30 selection:text-white">
      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center overflow-hidden px-4 pb-12 pt-6 sm:pt-8 text-center">
        <HoleBackground
          strokeColor="rgba(255,255,255,0.04)"
          className="absolute inset-0 h-full w-full pointer-events-none"
          style={{
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
          }}
        />

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-cyan-500/15 via-violet-600/10 to-transparent blur-3xl pointer-events-none" />

        <Badge
          variant="outline"
          className="gap-2 px-3.5 py-1 backdrop-blur-md border-cyan-500/30 bg-cyan-500/5 text-cyan-300 text-xs shadow-[0_0_15px_rgba(6,182,212,0.15)]"
        >
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
          Powered by Nodex Agentic AI
        </Badge>

        <h1 className="mx-auto max-w-4xl text-balance font-sans font-extrabold text-3xl sm:text-5xl lg:text-[54px] leading-[1.15] tracking-tight z-10 mt-3">
          <GrayTitle>Build software at lightspeed</GrayTitle>
          <br />
          <BlueTitle>from a single prompt with Nodex.</BlueTitle>
        </h1>

        <p className="mx-auto mt-2.5 max-w-xl text-balance text-xs sm:text-sm leading-relaxed text-white/55 z-10">
          Describe what you want to build in natural language. Nodex AI architects the code, organizes modular files, and renders a live multi-device preview inside your browser.
        </p>

        {/* ── Prompt Input Box ── */}
        <div className="relative mx-auto mt-6 w-full max-w-2xl z-10">
          {/* Ambient Box Glow */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500/25 via-violet-600/25 to-fuchsia-500/25 blur-xl opacity-75 pointer-events-none" />

          <div
            className={cn(
              "relative rounded-2xl border bg-[#0c0c0f]/95 backdrop-blur-2xl duration-200 shadow-2xl",
              isFocused
                ? "border-cyan-500/50 ring-2 ring-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                : "border-white/10"
            )}
          >
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={PLACEHOLDERS[placeholderIndex]}
              rows={1}
              className="w-full resize-none bg-transparent px-5 pb-3.5 pt-4 text-sm text-white placeholder:text-white/30 caret-cyan-400 focus:outline-none sm:text-base selection:bg-cyan-500/30"
              style={{ minHeight: 52, maxHeight: 180 }}
            />

            <div className="flex items-center justify-between border-t border-white/6 px-4 py-2">
              <span className="text-[11px] text-white/35 font-mono">
                Press ⏎ to generate · Shift+⏎ for new line
              </span>

              {isSignedIn ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!prompt.trim()}
                  className={cn(
                    "h-7.5 rounded-full px-4.5 text-xs font-semibold transition-all duration-300 cursor-pointer",
                    prompt.trim()
                      ? "bg-gradient-to-r from-cyan-500 via-violet-600 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] active:scale-95"
                      : "bg-white/10 text-white/40"
                  )}
                >
                  Generate
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <SignInButton mode="modal">
                  <Button className="h-7.5 rounded-full bg-gradient-to-r from-cyan-500 via-violet-600 to-fuchsia-600 px-4.5 text-xs font-semibold text-white shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] cursor-pointer">
                    Generate
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </SignInButton>
              )}
            </div>
          </div>

          {/* Sample Prompts */}
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-[11px] text-white/45 hover:border-cyan-500/40 hover:bg-white/8 hover:text-white transition-all cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── ECOSYSTEM & TECH STACK BADGES ─────────────────────────────────── */}
      <section className="px-4 py-8 border-y border-white/6 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-medium text-white/40">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-cyan-400" />
            <span>Google Gemini 3.6 Flash</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-violet-400" />
            <span>React 19 + Tailwind CSS</span>
          </div>
          <div className="flex items-center gap-2">
            <Laptop className="h-4 w-4 text-fuchsia-400" />
            <span>Sandpack Virtual Runtime</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Arcjet AI Security</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-400" />
            <span>Self-Healing Diagnostics</span>
          </div>
        </div>
      </section>

      {/* ── WORKSPACE INTERACTIVE PREVIEW SHOWCASE ─────────────────────────── */}
      <section className="px-4 py-20 relative">
        <div className="max-w-5xl mx-auto text-center mb-10">
          <SectionLabel>Interactive IDE</SectionLabel>
          <SectionHeading
            gray="Experience the workspace"
            blue="built for instant velocity."
          />
        </div>

        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/12 bg-[#0c0c0f] shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          {/* Mock Browser Header */}
          <div className="flex items-center justify-between border-b border-white/6 px-4 py-3 bg-[#08080a]">
            <div className="flex gap-1.5 items-center">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>

            <div className="flex h-6 items-center justify-center rounded-md bg-white/5 px-4">
              <span className="text-xs text-cyan-400/70 font-mono">
                nodex.ai/workspace/project-live
              </span>
            </div>

            {/* Device Switcher Simulation */}
            <div className="flex items-center rounded-lg border border-white/8 bg-white/4 p-0.5">
              <button
                onClick={() => setDemoDevice("laptop")}
                className={cn(
                  "flex h-5 items-center gap-1 rounded px-1.5 text-[10px] transition-all cursor-pointer",
                  demoDevice === "laptop"
                    ? "bg-white/15 text-white"
                    : "text-white/40 hover:text-white/70"
                )}
              >
                <Laptop className="h-3 w-3" />
                <span className="hidden sm:inline">Laptop</span>
              </button>
              <button
                onClick={() => setDemoDevice("tablet")}
                className={cn(
                  "flex h-5 items-center gap-1 rounded px-1.5 text-[10px] transition-all cursor-pointer",
                  demoDevice === "tablet"
                    ? "bg-white/15 text-white"
                    : "text-white/40 hover:text-white/70"
                )}
              >
                <Tablet className="h-3 w-3" />
                <span className="hidden sm:inline">Tablet</span>
              </button>
              <button
                onClick={() => setDemoDevice("mobile")}
                className={cn(
                  "flex h-5 items-center gap-1 rounded px-1.5 text-[10px] transition-all cursor-pointer",
                  demoDevice === "mobile"
                    ? "bg-white/15 text-white"
                    : "text-white/40 hover:text-white/70"
                )}
              >
                <Smartphone className="h-3 w-3" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row h-[420px]">
            {/* Mock Chat panel */}
            <div className="w-full md:w-80 flex flex-col border-b md:border-b-0 md:border-r border-white/6 bg-[#09090b]">
              <div className="border-b border-white/6 px-4 py-2.5 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  Nodex Agent Chat
                </p>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>

              <div className="flex-1 space-y-3 px-4 py-3 overflow-y-auto">
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-gradient-to-r from-cyan-600/30 to-violet-600/30 border border-cyan-500/20 px-3 py-2">
                    <p className="text-xs text-white/90">
                      Build a Crypto Analytics Dashboard with live price trends and dark mode
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-600 text-white shadow-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>

                  <div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/6 px-3 py-2">
                    <p className="text-xs text-white/70">
                      Generating full-stack dashboard with <code className="text-cyan-300">Recharts</code>, <code className="text-violet-300">Lucide-React</code>, and mock coin trends across 4 modular components…
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/6 p-2.5 bg-[#070709]">
                <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3 py-1.5">
                  <span className="flex-1 text-xs text-white/30">
                    Ask Nodex to refine or add charts…
                  </span>
                  <ArrowRight className="h-3 w-3 text-cyan-400" />
                </div>
              </div>
            </div>

            {/* Mock Preview & Code panel */}
            <div className="flex flex-1 flex-col bg-[#0b0b0e] overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/6 px-4 bg-[#08080a]">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDemoTab("preview")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 cursor-pointer transition-colors",
                      demoTab === "preview"
                        ? "border-cyan-400 text-white"
                        : "border-transparent text-white/40 hover:text-white/70"
                    )}
                  >
                    <Eye className="h-3.5 w-3.5 text-cyan-400" />
                    Live Preview
                  </button>
                  <button
                    onClick={() => setDemoTab("code")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 cursor-pointer transition-colors",
                      demoTab === "code"
                        ? "border-cyan-400 text-white"
                        : "border-transparent text-white/40 hover:text-white/70"
                    )}
                  >
                    <Code2 className="h-3.5 w-3.5 text-violet-400" />
                    Multi-File Code
                  </button>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Compiled 0 errors
                </span>
              </div>

              {demoTab === "preview" ? (
                <div className="flex-1 flex items-center justify-center p-4 bg-[#070709] overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-300 rounded-xl border border-white/10 bg-[#0f0f14] p-4 flex flex-col justify-between overflow-hidden shadow-2xl",
                      demoDevice === "laptop" && "w-full",
                      demoDevice === "tablet" && "w-[85%] border-cyan-500/20",
                      demoDevice === "mobile" && "w-[280px] rounded-2xl border-violet-500/30 p-3"
                    )}
                  >
                    <div className="flex items-center justify-between border-b border-white/6 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded bg-cyan-500/20 flex items-center justify-center text-[10px] font-bold text-cyan-400">
                          ₿
                        </div>
                        <span className="text-xs font-bold">CryptoPulse PRO</span>
                      </div>
                      <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-medium">
                        +14.2% 24h
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-2">
                      <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                        <span className="text-[10px] text-white/40">Portfolio Value</span>
                        <p className="text-sm font-bold text-white mt-0.5">$84,290.40</p>
                      </div>
                      <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                        <span className="text-[10px] text-white/40">Active Nodes</span>
                        <p className="text-sm font-bold text-cyan-400 mt-0.5">12 Live</p>
                      </div>
                    </div>

                    <div className="h-20 rounded-lg bg-gradient-to-t from-cyan-500/10 to-transparent border border-cyan-500/20 p-2 flex items-end justify-between gap-1">
                      {[35, 55, 42, 68, 48, 85, 92, 78, 95].map((h, i) => (
                        <div
                          key={i}
                          className="w-full bg-gradient-to-t from-cyan-500 to-violet-500 rounded-t-sm"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex overflow-hidden font-mono text-xs">
                  <div className="w-36 border-r border-white/6 bg-[#070709] p-2 space-y-1 text-white/50">
                    <div className="text-[10px] text-white/30 uppercase px-2 py-1">Project Files</div>
                    <div className="bg-white/10 text-white rounded px-2 py-1 flex items-center gap-1.5">
                      <Code2 className="h-3 w-3 text-cyan-400" /> /App.js
                    </div>
                    <div className="px-2 py-1 text-white/40 flex items-center gap-1.5">
                      <Code2 className="h-3 w-3" /> /Navbar.js
                    </div>
                    <div className="px-2 py-1 text-white/40 flex items-center gap-1.5">
                      <Code2 className="h-3 w-3" /> /Charts.js
                    </div>
                    <div className="px-2 py-1 text-white/40 flex items-center gap-1.5">
                      <Code2 className="h-3 w-3" /> /mockData.js
                    </div>
                  </div>
                  <div className="flex-1 p-3 bg-[#0a0a0d] overflow-x-auto text-[11px] leading-relaxed text-white/70">
                    <pre>
{`import React, { useState } from "react";
import { AreaChart, Area, XAxis, Tooltip } from "recharts";
import { TrendingUp, ShieldCheck } from "lucide-react";
import { CRYPTO_DATA } from "./data/mockData";

export default function App() {
  const [selectedCoin, setSelectedCoin] = useState("BTC");
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Nodex Synthesized Live UI */}
      <h1 className="text-xl font-bold">CryptoPulse Pro</h1>
    </div>
  );
}`}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── UNIQUE FEATURES GRID ─────────────────────────────────────────── */}
      <section className="px-4 py-20 relative">
        <div className="mx-auto mb-14 max-w-5xl text-center">
          <SectionLabel>Full-Stack Capabilities</SectionLabel>
          <SectionHeading
            gray="Everything engineered for"
            blue="flawless production."
          />
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, label, desc, tag }) => (
            <div
              key={label}
              className="group relative rounded-2xl border border-white/8 bg-[#0c0c0f]/80 p-7 transition-all duration-300 hover:border-cyan-500/40 hover:bg-[#0f0f14] hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-cyan-400 group-hover:border-cyan-500/40 group-hover:bg-cyan-500/10 group-hover:text-cyan-300 transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  {tag && (
                    <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-300">
                      {tag}
                    </span>
                  )}
                </div>
                <h3 className="mb-2 text-base font-bold text-white group-hover:text-cyan-200 transition-colors">
                  {label}
                </h3>
                <p className="text-xs leading-relaxed text-white/50">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRADITIONAL DEV VS NODEX COMPARISON ───────────────────────────── */}
      <section className="px-4 py-20 border-t border-white/6 bg-white/[0.01]">
        <div className="mx-auto mb-14 max-w-4xl text-center">
          <SectionLabel>Why Choose Nodex</SectionLabel>
          <SectionHeading
            gray="Old way of building"
            blue="vs. The Nodex AI Superpower."
          />
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Traditional Way */}
          <div className="rounded-2xl border border-white/6 bg-[#09090b] p-6 space-y-4 opacity-70">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <XCircle className="h-4 w-4" /> Traditional Development
            </div>
            <ul className="space-y-3 text-xs text-white/50">
              <li className="flex items-start gap-2">
                <span className="text-red-400/80 mt-0.5">✕</span>
                Hours spent on Webpack, Vite, Tailwind configs & dependencies
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400/80 mt-0.5">✕</span>
                Writing boilerplate mock data, routing, and card layouts manually
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400/80 mt-0.5">✕</span>
                Struggling with obscure npm installation errors and broken imports
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400/80 mt-0.5">✕</span>
                Manual responsive testing across multiple separate device windows
              </li>
            </ul>
          </div>

          {/* Nodex Way */}
          <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-[#0c0c0f] p-6 space-y-4 shadow-[0_0_30px_rgba(6,182,212,0.12)]">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <CheckCircle2 className="h-4 w-4" /> Nodex Agentic Flow
            </div>
            <ul className="space-y-3 text-xs text-white/80">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">✓</span>
                Instant multi-file React apps synthesized from simple natural prompts
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">✓</span>
                Rich, production-grade mock datasets and modern Tailwind UI styling
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">✓</span>
                Self-healing code engine auto-resolves any sandbox runtime errors
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">✓</span>
                Integrated 3-in-1 multi-device responsive testing (Laptop/Tablet/Mobile)
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 4 STEPS HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="px-4 py-20">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <SectionLabel>Workflow</SectionLabel>
          <SectionHeading gray="Four steps" blue="to a working app." />
        </div>

        <div className="mx-auto max-w-3xl">
          {STEPS.map((step, i) => (
            <div key={step.number} className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                  <span className="font-mono text-xs font-bold text-cyan-300">
                    {step.number}
                  </span>
                </div>

                {i < STEPS.length - 1 && (
                  <div className="mt-2 h-full w-px bg-gradient-to-b from-cyan-500/30 to-transparent" />
                )}
              </div>

              <div className="pb-10 pt-1.5">
                <p className="mb-1 text-sm font-bold sm:text-base text-white">
                  {step.label}
                </p>
                <p className="text-xs sm:text-sm leading-relaxed text-white/50">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING SECTION ──────────────────────────────────────────────── */}
      <section id="pricing" className="px-4 py-20 border-t border-white/6">
        <div className="mx-auto mb-14 max-w-5xl text-center">
          <SectionLabel>Transparent Plans</SectionLabel>
          <SectionHeading gray="Start free," blue="scale when ready." />
          <p className="mx-auto mt-3 max-w-sm text-xs text-white/40">
            No credit card required to start. Upgrade or downgrade anytime.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-3">
          {PRICING_PLANS.map((plan) => {
            const planOrder: Record<string, number> = {
              free: 0,
              starter: 1,
              pro: 2,
            };
            const activePlanKey = isSignedIn
              ? has?.({ plan: "pro" })
                ? "pro"
                : has?.({ plan: "starter" })
                ? "starter"
                : "free"
              : null;

            const isActive = isSignedIn && activePlanKey === plan.key;
            const isDowngrade =
              isSignedIn &&
              activePlanKey !== null &&
              !isActive &&
              planOrder[plan.key] < planOrder[activePlanKey];

            return (
              <div
                key={plan.key}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-7 transition-all duration-300",
                  plan.featured
                    ? "border-cyan-500/40 bg-gradient-to-b from-cyan-950/20 to-[#0c0c0f] shadow-[0_0_35px_rgba(6,182,212,0.15)]"
                    : "border-white/10 bg-[#0b0b0e]"
                )}
              >
                {/* Most popular pill */}
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full border border-cyan-400/30 bg-[#070709] px-3 py-1 text-[11px] font-bold text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan name + active badge */}
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-base font-bold text-white">
                    {plan.label}
                  </p>
                  {isActive && (
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                      Current
                    </span>
                  )}
                </div>

                <p className="mb-6 text-xs leading-relaxed text-white/40">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-1 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">
                    {plan.price === 0 ? (
                      <GrayTitle>$0</GrayTitle>
                    ) : (
                      <BlueTitle>${plan.price}</BlueTitle>
                    )}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-xs text-white/40">/month</span>
                  )}
                </div>
                <p className="mb-6 text-[11px] text-white/30 font-mono">
                  {plan.price === 0 ? "Always free forever" : "Billed monthly"}
                </p>

                {/* Feature list */}
                <div className="mb-8 space-y-3 border-t border-white/6 pt-6">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                          plan.featured ? "bg-cyan-500/20 text-cyan-300" : "bg-white/10 text-white/60"
                        )}
                      >
                        <Check className="h-2.5 w-2.5" />
                      </div>
                      <span className="text-xs text-white/70">{f}</span>
                    </div>
                  ))}
                </div>

                {/* CTA button */}
                <div className="mt-auto">
                  {isActive ? (
                    <Button
                      disabled
                      className="w-full rounded-full text-xs font-semibold opacity-50 cursor-not-allowed border border-white/10 bg-transparent text-white/60"
                      variant="ghost"
                    >
                      ✓ Active Plan
                    </Button>
                  ) : plan.price === 0 ? (
                    isSignedIn ? (
                      <Button
                        disabled
                        className="w-full rounded-full text-xs font-semibold opacity-50 cursor-not-allowed border border-white/10 bg-transparent text-white/60"
                        variant="ghost"
                      >
                        Default Plan
                      </Button>
                    ) : (
                      <SignInButton mode="modal">
                        <Button
                          className="w-full rounded-full text-xs font-semibold border border-white/12 bg-white/5 text-white hover:bg-white/10 cursor-pointer"
                          variant="ghost"
                        >
                          Get Started Free
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </SignInButton>
                    )
                  ) : isSignedIn ? (
                    <CheckoutButton
                      planId={plan.planId}
                      planPeriod="month"
                      checkoutProps={{
                        appearance: {
                          elements: {
                            drawerRoot: {
                              zIndex: 2000,
                            },
                          },
                        },
                      }}
                    >
                      <Button
                        className={cn(
                          "w-full rounded-full text-xs font-semibold transition-all cursor-pointer",
                          plan.featured
                            ? "bg-gradient-to-r from-cyan-500 via-violet-600 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] active:scale-95"
                            : "border border-white/12 bg-white/5 text-white hover:bg-white/10"
                        )}
                        variant="ghost"
                      >
                        {isDowngrade ? "Downgrade" : "Upgrade to " + plan.label}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </CheckoutButton>
                  ) : (
                    <SignInButton mode="modal">
                      <Button
                        className={cn(
                          "w-full rounded-full text-xs font-semibold transition-all cursor-pointer",
                          plan.featured
                            ? "bg-gradient-to-r from-cyan-500 via-violet-600 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] active:scale-95"
                            : "border border-white/12 bg-white/5 text-white hover:bg-white/10"
                        )}
                        variant="ghost"
                      >
                        Get Started with {plan.label}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </SignInButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── BOTTOM CTA BANNER ────────────────────────────────────────────── */}
      <section className="relative mx-auto my-24 max-w-5xl overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/30 via-[#0a0a0d] to-[#070709] px-6 sm:px-10 py-20 text-center shadow-[0_0_60px_rgba(6,182,212,0.15)]">
        <HoleBackground
          strokeColor="rgba(255,255,255,0.05)"
          numberOfLines={32}
          numberOfDiscs={32}
          particleRGBColor={[6, 182, 212]}
          className="absolute inset-0 h-full w-full pointer-events-none"
          style={{
            maskImage:
              "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
          }}
        />

        <div className="relative z-10">
          <SectionHeading gray="Start architecting with" blue="Nodex AI today." />

          <p className="mx-auto mt-3 mb-8 max-w-md text-xs sm:text-sm leading-relaxed text-white/50">
            Get 10 free generations instantly on sign up. No credit card required. Experience the fastest way to build full-stack React web apps.
          </p>

          <SignInButton mode="modal">
            <Button
              size="lg"
              className="h-11 rounded-full bg-gradient-to-r from-cyan-500 via-violet-600 to-fuchsia-600 px-8 text-sm font-bold text-white shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] active:scale-95 cursor-pointer"
            >
              Get Started Free
              <ChevronRight className="h-4 w-4" />
            </Button>
          </SignInButton>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <Footer />
    </main>
  );
}