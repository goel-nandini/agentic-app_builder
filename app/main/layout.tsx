import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/auth/sign-in");
  }

  return (
    // Cover the entire viewport including the global header
    <div className="fixed inset-0 z-[200] bg-[#09090b] text-neutral-100 flex flex-col overflow-hidden selection:bg-purple-500/20 selection:text-purple-200">
      {children}
    </div>
  );
}
