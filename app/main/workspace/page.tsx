import React, { Suspense } from "react";
import WorkspaceClient from "@/components/WorkspaceClient";
import { Loader2 } from "lucide-react";

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="h-full w-full flex flex-col items-center justify-center bg-[#09090b] text-purple-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm font-medium text-neutral-400">Loading AI Workspace Canvas...</span>
        </div>
      }
    >
      <WorkspaceClient />
    </Suspense>
  );
}
