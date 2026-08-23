import React from "react";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[calc(100vh-64px)] w-full bg-[#09090b] text-neutral-100 flex flex-col overflow-hidden selection:bg-purple-500/20 selection:text-purple-200">
      {children}
    </div>
  );
}
