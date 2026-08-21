import React from 'react'
import Link from 'next/link'

export default function Footer(){
  return (
    <footer className="w-full bg-black border-t border-white/6 text-neutral-300 py-12 relative overflow-hidden">
      <div className="absolute -right-20 -top-10 w-56 h-56 rounded-full bg-gradient-to-tr from-blue-600/20 to-indigo-700/10 blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-6 h-1 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500/60" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div>
            <div className="text-xl font-semibold text-white">Forge</div>
            <div className="text-sm text-neutral-400 mt-2">Build AI apps faster with chat-driven generation and live previews.</div>
          </div>

          <div>
            <div className="font-semibold text-white">Contact</div>
            <div className="mt-2 text-sm"><a href="mailto:hello@forge.example" className="hover:text-blue-400 transition">hello@forge.example</a></div>
            <div className="mt-1 text-sm"><a href="https://twitter.com/forge_app" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition">@forge_app</a></div>
            <div className="mt-1 text-sm"><a href="https://github.com/your-repo" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition">github.com/your-repo</a></div>
          </div>

          <div className="text-sm">
            <div className="font-semibold text-white">Quick links</div>
            <div className="mt-2"><Link href="/#pricing" className="hover:text-blue-400 transition">Pricing</Link></div>
            <div className="mt-1"><a href="#" className="hover:text-blue-400 transition">Docs</a></div>
            <div className="mt-1"><a href="#" className="hover:text-blue-400 transition">Community</a></div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-neutral-500">A tiny unique touch: every generated app includes a playful loading sparkle ✨ that celebrates progress.</div>

        <div className="mt-6 flex flex-col items-center gap-2">
          <div className="text-xs text-neutral-400">© {new Date().getFullYear()} Forge. All rights reserved.</div>
          <div className="text-sm text-neutral-200">
            Made with <span className="text-pink-500 inline-block animate-pulse">❤️</span> by <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-400 font-semibold">nandini</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
