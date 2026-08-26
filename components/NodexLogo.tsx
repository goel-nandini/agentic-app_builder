import React from "react";

interface NodexLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}

export function NodexLogo({
  size = "md",
  className = "",
  showText = true,
}: NodexLogoProps) {
  const iconSizes = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className={`flex items-center gap-2.5 select-none group ${className}`}>
      {/* Futuristic Node Icon */}
      <div className={`relative ${iconSizes[size]} flex items-center justify-center`}>
        {/* Ambient Glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-cyan-500/30 via-violet-600/30 to-fuchsia-500/30 blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Icon Frame */}
        <div className="relative h-full w-full rounded-xl bg-gradient-to-b from-neutral-900 to-black p-0.5 border border-white/15 shadow-inner group-hover:border-cyan-400/40 transition-colors duration-300">
          <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-full w-full"
          >
            <defs>
              <linearGradient id="nodex-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Neural Connection Lines */}
            <path
              d="M10 30L10 10L30 30L30 10"
              stroke="url(#nodex-grad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Node Points */}
            <circle cx="10" cy="10" r="3" fill="#06b6d4" filter="url(#glow)" />
            <circle cx="10" cy="30" r="3" fill="#8b5cf6" />
            <circle cx="20" cy="20" r="3.5" fill="#ffffff" filter="url(#glow)" />
            <circle cx="30" cy="10" r="3" fill="#8b5cf6" />
            <circle cx="30" cy="30" r="3" fill="#d946ef" filter="url(#glow)" />
          </svg>
        </div>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex items-baseline">
          <span
            className={`font-sans font-bold tracking-tight text-white ${textSizes[size]}`}
          >
            Node
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              x
            </span>
          </span>
          <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-cyan-400/80">
            .ai
          </span>
        </div>
      )}
    </div>
  );
}
