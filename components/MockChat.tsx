import React from 'react'

export default function MockChat() {
  return (
    <div className="w-full h-full rounded-2xl bg-gradient-to-br from-gray-900/80 to-black/60 border border-white/5 p-4 shadow-xl flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white">AI</div>
          <div>
            <div className="text-sm font-semibold">Assistant</div>
            <div className="text-xs text-neutral-400">Responds like a dev assistant</div>
          </div>
        </div>
        <div className="text-xs text-neutral-400">Live Mock</div>
      </div>

      <div className="flex-1 p-2 flex flex-col gap-3 justify-center">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs text-neutral-300">U</div>
          <div className="max-w-xs bg-neutral-800/60 text-neutral-100 px-3 py-2 rounded-lg">Hey — build me a task manager app with a Kanban board.</div>
        </div>

        <div className="flex items-end justify-end gap-3">
          <div className="max-w-xs bg-gradient-to-br from-sky-600 to-purple-600 text-white px-3 py-2 rounded-lg">I'll create a task manager with a Kanban board. Setting up the project and components now.</div>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs text-white">AI</div>
        </div>

        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs text-neutral-300">U</div>
          <div className="max-w-xs bg-neutral-800/60 text-neutral-100 px-3 py-2 rounded-lg">Installing dependencies and generating components.</div>
        </div>
      </div>

      <div className="mt-4 flex gap-3 items-center">
        <input placeholder="Type a message..." className="flex-1 bg-transparent border border-white/6 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none" />
        <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white text-sm">Send</button>
      </div>
    </div>
  )
}
