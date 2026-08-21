"use client";

import { useState, useEffect } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HoleBackground } from "@/components/animate-ui/components/backgrounds/hole";
import { GrayTitle, BlueTitle, SectionHeading } from "@/components/Reusables";
import { PLACEHOLDERS, SUGGESTIONS, FEATURES, STEPS } from "@/lib/data";
import { PRICING_PLANS } from "@/lib/constant";
import { ArrowRight, Sparkles, Check, Zap } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = () => {
    if (!prompt.trim()) return;

    if (!isSignedIn) {
      openSignIn();
      return;
    }

    // Generation trigger logic when signed in
    console.log("Generating app with prompt:", prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <main className="relative min-h-screen bg-black text-white selection:bg-purple-500/20 overflow-hidden">
      {/* Hero Section with HoleBackground */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-20 pb-16 text-center">
        {/* Animated Hole Background */}
        <div className="absolute inset-0 z-0 size-full pointer-events-none opacity-80">
          <HoleBackground className="size-full" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-6">
          <Badge variant="outline" className="gap-2 border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300 backdrop-blur-md">
            <div className="h-2 w-2 animate-pulse rounded-full bg-purple-400"></div>
            Powered by Gemini 3.6 Flash
          </Badge>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            <GrayTitle>Build Full-Stack AI Apps</GrayTitle> <br />
            <BlueTitle>In Seconds</BlueTitle>
          </h1>

          <p className="max-w-2xl text-lg sm:text-xl text-neutral-400 font-normal">
            Describe your application in plain English. Watch as AI constructs production-ready React code, styling, and interactivity in real-time.
          </p>

          {/* Prompt Input Box */}
          <div className="w-full max-w-2xl mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl shadow-2xl transition-all focus-within:border-purple-500/50">
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 px-2 py-1">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={PLACEHOLDERS[placeholderIndex]}
                rows={2}
                className="w-full resize-none bg-transparent text-sm sm:text-base text-white placeholder-neutral-500 focus:outline-none min-h-[52px] max-h-[160px] py-1 transition-all duration-300"
              />
              <Button
                onClick={handleGenerate}
                className="gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium px-5 h-10 shrink-0 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                Generate
              </Button>
            </div>
          </div>

          {/* Prompt Suggestions List */}
          <div className="w-full max-w-2xl mt-3 flex flex-col items-center gap-3">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" /> Try one of these prompt suggestions
            </span>
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
              {SUGGESTIONS.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(suggestion)}
                  className="group relative flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-neutral-300 backdrop-blur-md transition-all hover:border-purple-500/50 hover:bg-white/10 hover:text-white hover:scale-[1.02] cursor-pointer"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400 group-hover:scale-125 transition-transform" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 border-t border-white/10 bg-black/60 py-24 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <SectionHeading gray="Everything You Need" blue="To Ship Fast" />
            <p className="mt-4 text-neutral-400">Powered by state-of-the-art AI infrastructure</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm hover:border-purple-500/40 transition-colors">
                  <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 text-purple-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    <GrayTitle>{feature.label}</GrayTitle>
                  </h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 border-t border-white/10 bg-black/80 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <SectionHeading gray="How It Works In" blue="4 Simple Steps" />
            <p className="mt-4 text-neutral-400">From prompt to live application in minutes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, idx) => (
              <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col justify-between">
                <div>
                  <span className="text-3xl font-extrabold text-blue-400">{step.number}</span>
                  <h3 className="text-lg font-semibold mt-4 mb-2">
                    <GrayTitle>{step.label}</GrayTitle>
                  </h3>
                  <p className="text-neutral-400 text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
