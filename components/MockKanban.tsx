import React from 'react'

const Column = ({title, children}:{title:string, children: React.ReactNode}) => (
  <div className="flex-1 bg-white/3 rounded-2xl p-4 min-h-[420px] border border-white/6">
    <div className="flex items-center justify-between mb-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-neutral-400">{React.Children.count(children)}</div>
    </div>
    <div className="flex flex-col gap-3">{children}</div>
  </div>
)

const Card = ({title}:{title:string}) => (
  <div className="bg-gradient-to-br from-neutral-900/60 to-neutral-800/60 text-white p-3 rounded-lg shadow-md border border-white/4">{title}</div>
)

export default function MockKanban(){
  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="flex gap-4 h-full">
        <Column title="Todo">
          <Card title="Design landing page" />
          <Card title="Define data model" />
        </Column>
        <Column title="In Progress">
          <Card title="Build mock UI" />
        </Column>
        <Column title="Done">
          <Card title="Project kickoff" />
        </Column>
      </div>
    </div>
  )
}
