import React from 'react'
import Link from 'next/link'
import { NodexLogo } from './NodexLogo'

export default function Footer(){
  return (
    <footer className="w-full bg-[#070709] border-t border-white/6 text-neutral-300 py-12 relative overflow-hidden">
      <div className="absolute -right-20 -top-10 w-56 h-56 rounded-full bg-gradient-to-tr from-cyan-600/20 via-violet-700/10 to-fuchsia-600/10 blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8 h-px w-full bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div>
            <NodexLogo size="md" />
            <div className="text-sm text-neutral-400 mt-3 max-w-sm">Build, iterate, and deploy full-stack React web apps instantly with chat-driven generation and live multi-device preview.</div>
          </div>

          <div>
            <div className="font-semibold text-white">Contact & Community</div>
            <div className="mt-2 text-sm"><a href="mailto:hello@nodex.ai" className="hover:text-cyan-400 transition">hello@nodex.ai</a></div>
            <div className="mt-1 text-sm"><a href="https://twitter.com/nodex_ai" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition">@nodex_ai</a></div>
            <div className="mt-1 text-sm"><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition">github.com/nodex-ai</a></div>
          </div>

          <div className="text-sm">
            <div className="font-semibold text-white">Platform</div>
            <div className="mt-2"><Link href="/#pricing" className="hover:text-cyan-400 transition">Pricing Plans</Link></div>
            <div className="mt-1"><Link href="/projects" className="hover:text-cyan-400 transition">My Projects</Link></div>
            <div className="mt-1"><a href="#" className="hover:text-cyan-400 transition">Documentation</a></div>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-white/6 pt-6 text-xs text-neutral-500 gap-3">
          <div>© {new Date().getFullYear()} Nodex. All rights reserved.</div>
          <div className="text-sm text-neutral-300">
            Engineered with <span className="text-pink-500 inline-block animate-pulse">❤️</span> by <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-400 font-semibold">Nandini</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
