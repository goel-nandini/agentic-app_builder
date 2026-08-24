"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import {
  Send,
  Loader2,
  Paperclip,
  Check,
  User,
  Wand2,
  FileCode,
  Copy,
  X,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface MessageStep {
  title: string;
  status: "pending" | "in-progress" | "completed";
}

export interface AttachedFile {
  id: string;
  name: string;
  type: "image" | "file";
  url: string;
  size?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  steps?: MessageStep[];
  filesCreated?: string[];
  attachments?: AttachedFile[];
}

interface ChatPanelProps {
  initialPrompt?: string;
  messages: ChatMessage[];
  onSendMessage: (text: string, attachments?: AttachedFile[]) => void;
  isGenerating: boolean;
}

const QUICK_SUGGESTIONS = [
  "Add dark/light mode toggle",
  "Add export to CSV feature",
  "Improve mobile responsiveness",
];

// ─── Code block with copy button ─────────────────────────────
function CodeBlock({ children, className }: { children?: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="relative group my-2 rounded-lg overflow-hidden border border-neutral-800">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 rounded p-1"
        title="Copy code"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-neutral-300" />}
      </button>
      <code className={`${className} block text-[11px] leading-relaxed overflow-x-auto p-3 bg-black/60`}>
        {children}
      </code>
    </div>
  );
}

// ─── Markdown renderer ────────────────────────────────────────
function MarkdownMessage({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        h1: ({ children }) => <h1 className="text-sm font-bold text-white mt-2 mb-1">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xs font-semibold text-white mt-2 mb-1">{children}</h2>,
        p: ({ children }) => <p className="text-xs leading-relaxed text-neutral-300 mb-1">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) return <CodeBlock className={className}>{children}</CodeBlock>;
          return <code className="bg-neutral-800 text-purple-300 font-mono text-[11px] rounded px-1.5 py-0.5">{children}</code>;
        },
        ul: ({ children }) => <ul className="list-disc list-inside text-xs text-neutral-300 space-y-0.5 my-1">{children}</ul>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

// ─── Main ChatPanel Component ─────────────────────────────────
export default function ChatPanel({
  initialPrompt,
  messages,
  onSendMessage,
  isGenerating,
}: ChatPanelProps) {
  const [inputPrompt, setInputPrompt] = useState("");
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileUrl = e.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            type: isImage ? "image" : "file",
            url: fileUrl,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSend = () => {
    if ((!inputPrompt.trim() && attachments.length === 0) || isGenerating) return;
    onSendMessage(inputPrompt, attachments);
    setInputPrompt("");
    setAttachments([]);
  };

  return (
    <div className="w-full bg-[#0a0a0d] flex flex-col h-full select-none">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files && processFiles(e.target.files)}
        multiple
        accept="image/*,.pdf,.txt,.json,.js,.ts,.tsx,.css"
        className="hidden"
      />

      {/* Top Header Strip */}
      <div className="px-4 py-2.5 border-b border-neutral-800/60 flex items-center justify-end bg-[#0a0a0d] shrink-0">
        <span className="text-[11px] text-neutral-400 font-medium bg-neutral-900 border border-neutral-800 px-2.5 py-0.5 rounded-full">
          24 credits
        </span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-3">

            {/* USER MESSAGE: Right aligned pill with user avatar */}
            {msg.sender === "user" && (
              <div className="flex items-center justify-end gap-2.5">
                <div className="bg-[#18181d] border border-neutral-800 text-neutral-100 text-xs px-4 py-2.5 rounded-2xl max-w-[85%] leading-relaxed shadow-sm">
                  {msg.text}
                </div>
                <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 shrink-0">
                  <User className="w-4 h-4" />
                </div>
              </div>
            )}

            {/* AGENT MESSAGE CARD: Single <f> icon + reasoning steps card */}
            {msg.sender === "ai" && (
              <div className="flex items-start gap-3">
                {/* <f> Brand Avatar */}
                <div className="w-7 h-7 rounded-lg bg-black border border-neutral-700 flex items-center justify-center text-white font-mono text-xs font-bold shrink-0 mt-0.5 shadow-md">
                  &lt;f&gt;
                </div>

                {/* Reasoning Steps Card */}
                <div className="flex-1 bg-[#121217] border border-neutral-800/90 rounded-xl p-3.5 space-y-2 text-xs">
                  {msg.steps && msg.steps.length > 0 ? (
                    <div className="space-y-1.5 font-sans">
                      {msg.steps.map((step, idx) => {
                        const isInProgress = step.status === "in-progress";
                        const isCompleted = step.status === "completed";

                        return (
                          <div
                            key={idx}
                            className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${
                              isInProgress
                                ? "bg-blue-600/25 border border-blue-500/40 text-blue-300 font-semibold px-2.5 py-1.5 rounded-lg shadow-sm"
                                : isCompleted
                                ? "text-neutral-400 py-0.5"
                                : "text-neutral-600 py-0.5"
                            }`}
                          >
                            {isInProgress ? (
                              <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                            ) : isCompleted ? (
                              <Check className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border border-neutral-700 shrink-0" />
                            )}
                            <span>{step.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <MarkdownMessage text={msg.text} />
                  )}

                  {/* Created Files Pills */}
                  {msg.filesCreated && msg.filesCreated.length > 0 && (
                    <div className="pt-2 border-t border-neutral-800/60 flex flex-wrap gap-1.5">
                      {msg.filesCreated.map((file, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[11px] font-mono bg-purple-500/10 border border-purple-500/25 text-purple-300 px-2 py-0.5 rounded-md"
                        >
                          <FileCode className="w-3 h-3" />
                          {file}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      <div className="px-3 py-1.5 border-t border-neutral-800/60 bg-[#09090b] flex items-center gap-1.5 overflow-x-auto shrink-0" style={{ scrollbarWidth: "none" }}>
        <Wand2 className="w-3 h-3 text-purple-400 shrink-0" />
        {QUICK_SUGGESTIONS.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(suggestion)}
            disabled={isGenerating}
            className="text-[11px] text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-full px-2.5 py-1 transition-all whitespace-nowrap disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-neutral-800/80 bg-[#0a0a0d] shrink-0">
        <div className="rounded-xl border border-neutral-800 bg-[#121217] p-2 focus-within:border-neutral-700 transition-colors">
          {/* Pending Attachments */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-2 mb-2 border-b border-neutral-800 px-1">
              {attachments.map((att) => (
                <div key={att.id} className="relative flex items-center bg-neutral-800 px-2 py-1 rounded text-xs text-neutral-200 gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  <span className="truncate max-w-[100px]">{att.name}</span>
                  <button onClick={() => setAttachments((p) => p.filter((a) => a.id !== att.id))}>
                    <X className="w-3 h-3 text-neutral-400 hover:text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask AI to make edits, upload images/files, or paste screenshots..."
            rows={2}
            className="w-full bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none resize-none px-2 py-1"
          />

          <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60 px-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-neutral-400 hover:text-purple-400 p-1.5 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
              title="Attach images or files"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span className="text-[11px] text-neutral-400">Attach</span>
            </button>

            <Button
              onClick={handleSend}
              disabled={(!inputPrompt.trim() && attachments.length === 0) || isGenerating}
              size="sm"
              className="h-7 px-3 gap-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-lg disabled:opacity-50 shadow-md shadow-purple-600/20"
            >
              <span>Send</span>
              <Send className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
