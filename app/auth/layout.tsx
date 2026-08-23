import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full bg-[#050508] text-white flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden selection:bg-purple-500/30">
      {/* Background Decorative Ambient Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-6">
        {/* Header Logo & Title */}
        <Link href="/" className="flex flex-col items-center gap-3 group transition-transform hover:scale-[1.02]">
          <Image
            src="/logo.png"
            alt="Forge Logo"
            width={140}
            height={46}
            className="h-10 w-auto object-contain"
            priority
          />
          <Badge
            variant="outline"
            className="gap-1.5 border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs text-purple-300 backdrop-blur-md"
          >
            <Sparkles className="w-3 h-3 text-purple-400" /> AI App Builder
          </Badge>
        </Link>

        {/* Card Wrapper for Clerk SignIn / SignUp */}
        <div className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-2 sm:p-4 backdrop-blur-2xl shadow-2xl shadow-purple-950/20 flex justify-center items-center">
          {children}
        </div>

        {/* Footer Note */}
        <p className="text-xs text-neutral-500 text-center">
          By signing in, you agree to our Terms of Service & Privacy Policy.
        </p>
      </div>
    </div>
  );
}
