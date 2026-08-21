import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HoleBackground } from "@/components/animate-ui/components/backgrounds/hole";
import { SUGGESTIONS, FEATURES, STEPS } from "@/lib/data";
import { PRICING_PLANS } from "@/lib/constant";
import { ArrowRight, Sparkles, Check, Zap } from "lucide-react";
import Image from "next/image";

export default function Home() {
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

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl bg-gradient-to-b from-white via-white/90 to-white/50 bg-clip-text text-transparent">
            Build Full-Stack AI Apps <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              In Seconds
            </span>
          </h1>

          <p className="max-w-2xl text-lg sm:text-xl text-neutral-400 font-normal">
            Describe your application in plain English. Watch as AI constructs production-ready React code, styling, and interactivity in real-time.
          </p>

          {/* Prompt Input Box Mock */}
          <div className="w-full max-w-2xl mt-4 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-xl shadow-2xl transition-all focus-within:border-purple-500/50">
            <div className="flex items-center gap-2 px-3 py-2">
              <input
                type="text"
                placeholder="Describe the web app you want to build..."
                className="w-full bg-transparent text-sm sm:text-base text-white placeholder-neutral-500 focus:outline-none"
              />
              <Button className="gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium px-5">
                <Sparkles className="h-4 w-4" />
                Generate
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 px-3 pb-2 pt-1 border-t border-white/5">
              {SUGGESTIONS.slice(0, 3).map((suggestion, index) => (
                <span
                  key={index}
                  className="cursor-pointer rounded-lg bg-white/5 px-2.5 py-1 text-xs text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {suggestion}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 border-t border-white/10 bg-black/60 py-24 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl text-white">Everything You Need To Ship Fast</h2>
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
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.label}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
