"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

export function Tabs({
  value,
  onValueChange,
  className,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn(className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }: { className?: string; variant?: string; children: React.ReactNode }) {
  return <div className={cn("flex items-center", className)}>{children}</div>;
}

export function TabsTrigger({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const tabs = React.useContext(TabsContext);
  if (!tabs) throw new Error("TabsTrigger must be used inside Tabs");
  return (
    <button
      type="button"
      onClick={() => tabs.onValueChange(value)}
      data-state={tabs.value === value ? "active" : "inactive"}
      className={cn("flex items-center gap-1.5 px-3 pb-2 text-xs text-white/50 data-[state=active]:border-blue-400 data-[state=active]:text-white", className)}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
}: {
  value: string;
  keepMounted?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const tabs = React.useContext(TabsContext);
  if (!tabs) throw new Error("TabsContent must be used inside Tabs");
  return (
    <div className={cn(tabs.value === value ? "block" : "hidden", className)}>
      {children}
    </div>
  );
}