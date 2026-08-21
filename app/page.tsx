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
import MockChat from '@/components/MockChat'
import MockKanban from '@/components/MockKanban'
import Footer from '@/components/Footer'

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
      {/* Divider after hero */}
      <div className="w-full border-b-2 border-white/10" />

      {/* Mock UI Preview Section (appears when scrolling) - fits one viewport */}
      <section id="mock-preview" className="relative z-10 bg-black/70 min-h-[82vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full">
          <div className="text-center mb-4 pt-6">
            <div className="text-sm text-neutral-400 uppercase tracking-wide">Live Mock</div>
            <h2 className="text-2xl font-semibold mt-2">App Mock Preview</h2>
            <p className="mt-2 text-neutral-400">Scroll to explore a chat-first mock UI and a Kanban preview.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(82vh-96px)]">
            <div className="lg:col-span-1 h-full">
              <MockChat />
            </div>
            <div className="lg:col-span-2 h-full">
              <MockKanban />
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

      {/* Pricing Section */}
      <section className="relative z-10 border-t border-white/10 bg-black/70 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold">Pricing</h2>
            <p className="mt-2 text-neutral-400">Start with a free trial — upgrade when you’re ready.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 to-slate-900/60 p-6 text-center transition-transform transform hover:-translate-y-1 hover:scale-[1.01] hover:shadow-2xl hover:border-blue-500/40">
              <div className="text-sm text-blue-300 uppercase">Free Trial</div>
              <div className="text-3xl font-bold mt-4 text-white">Free</div>
              <div className="text-sm text-blue-200">1 week trial</div>
              <ul className="mt-4 text-sm text-neutral-300 space-y-2">
                <li>Full feature access</li>
                <li>Live preview</li>
                <li>Export to zip</li>
              </ul>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/billing/subscribe', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ planId: 'free' }),
                    })
                    const data = await res.json()
                    if (data?.url) window.location.href = data.url
                    else alert(data?.message || 'Billing not configured. Check server logs.')
                  } catch (err) {
                    console.error(err)
                    alert('Unable to start billing flow — check console for details.')
                  }
                }}
                className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white w-full"
              >
                Start Free Trial
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-indigo-900/70 p-6 text-center transition-transform transform hover:-translate-y-1 hover:scale-[1.01] hover:shadow-2xl hover:border-blue-500/40">
              <div className="text-sm text-blue-200 uppercase">Pro</div>
              <div className="text-3xl font-bold mt-4 text-white">$12<span className="text-sm font-normal text-neutral-300">/month</span></div>
              <div className="text-sm text-blue-200">For solo creators</div>
              <ul className="mt-4 text-sm text-neutral-300 space-y-2">
                <li>Unlimited projects</li>
                <li>Priority support</li>
                <li>Export & Deploy</li>
              </ul>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/billing/subscribe', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ planId: 'pro' }),
                    })
                    const data = await res.json()
                    if (data?.url) window.location.href = data.url
                    else alert(data?.message || 'Billing not configured. Check server logs.')
                  } catch (err) {
                    console.error(err)
                    alert('Unable to start billing flow — check console for details.')
                  }
                }}
                className="mt-6 px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-xl text-white font-medium w-full"
              >
                Choose Pro
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 to-slate-900/60 p-6 text-center transition-transform transform hover:-translate-y-1 hover:scale-[1.01] hover:shadow-2xl hover:border-blue-500/40">
              <div className="text-sm text-blue-300 uppercase">Team</div>
              <div className="text-3xl font-bold mt-4 text-white">$99<span className="text-sm font-normal text-neutral-300">/yr</span></div>
              <div className="text-sm text-blue-200">Best for teams</div>
              <ul className="mt-4 text-sm text-neutral-300 space-y-2">
                <li>Team seats & permissions</li>
                <li>Shared workspaces</li>
                <li>Dedicated support</li>
              </ul>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/billing/subscribe', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ planId: 'team' }),
                    })
                    const data = await res.json()
                    if (data?.url) window.location.href = data.url
                    else alert(data?.message || 'Billing not configured. Check server logs.')
                  } catch (err) {
                    console.error(err)
                    alert('Unable to start billing flow — check console for details.')
                  }
                }}
                className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white w-full"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      
    </main>
  );
}
