"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import {
  Sparkles,
  Send,
  Loader2,
  Paperclip,
  CheckCircle2,
  Bot,
  User,
  Wand2,
  FileCode,
  Zap,
  Copy,
  Check,
  X,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  "Add search and filter functionality",
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
    <div className="relative group my-2 rounded-lg overflow-hidden border border-white/10">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 rounded p-1"
        title="Copy code"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-neutral-300" />}
      </button>
      <code className={`${className} block text-[11px] leading-relaxed overflow-x-auto p-3`}>
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
        h1: ({ children }) => <h1 className="text-base font-bold text-white mt-3 mb-1">{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-semibold text-white mt-2.5 mb-1">{children}</h2>,
        h3: ({ children }) => <h3 className="text-xs font-semibold text-neutral-200 mt-2 mb-0.5">{children}</h3>,
        p: ({ children }) => <p className="text-xs leading-relaxed text-neutral-200 mb-1.5">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
        em: ({ children }) => <em className="italic text-purple-300">{children}</em>,
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return <CodeBlock className={className}>{children}</CodeBlock>;
          }
          return (
            <code className="bg-white/10 text-purple-300 font-mono text-[11px] rounded px-1.5 py-0.5">
              {children}
            </code>
          );
        },
        pre: ({ children }) => <>{children}</>,
        ul: ({ children }) => <ul className="list-disc list-inside text-xs text-neutral-300 space-y-0.5 mb-1.5 pl-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside text-xs text-neutral-300 space-y-0.5 mb-1.5 pl-1">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-purple-500/60 pl-3 my-2 text-neutral-400 italic text-xs">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-2 rounded-lg border border-white/10">
            <table className="w-full text-xs text-neutral-300">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="px-3 py-1.5 bg-white/5 text-left font-semibold text-white border-b border-white/10">{children}</th>,
        td: ({ children }) => <td className="px-3 py-1.5 border-b border-white/5">{children}</td>,
        hr: () => <hr className="my-3 border-white/10" />,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors">
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

// ─── Main ChatPanel ───────────────────────────────────────────
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

  // File Upload Handlers
  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const reader = new FileReader();

      reader.onload = (e) => {
        const fileUrl = e.target?.result as string;
        const sizeFormatted =
          file.size < 1024 * 1024
            ? `${(file.size / 1024).toFixed(1)} KB`
            : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

        const newAttachment: AttachedFile = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          type: isImage ? "image" : "file",
          url: fileUrl,
          size: sizeFormatted,
        };

        setAttachments((prev) => [...prev, newAttachment]);
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      processFiles(e.clipboardData.files);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSend = () => {
    if ((!inputPrompt.trim() && attachments.length === 0) || isGenerating) return;
    onSendMessage(inputPrompt, attachments);
    setInputPrompt("");
    setAttachments([]);
  };

  return (
    <div className="w-full bg-[#0c0c0e] flex flex-col h-full select-none">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt,.json,.csv,.js,.ts,.tsx,.css,.html"
        className="hidden"
      />

      {/* Header */}
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              <span>AI Architect</span>
              <Badge variant="outline" className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-300 py-0 px-1.5 h-4">
                Active
              </Badge>
            </div>
            <div className="text-[11px] text-neutral-400">Powered by Gemini 3.6 Flash</div>
          </div>
        </div>
        <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-300 text-[11px] gap-1">
          <Zap className="w-3 h-3 fill-purple-400 text-purple-400" /> Live Agent
        </Badge>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            {/* Sender label */}
            <div className="flex items-center gap-1.5 mb-1 text-[11px] text-neutral-400">
              {msg.sender === "user" ? (
                <>
                  <span>You</span>
                  <User className="w-3 h-3 text-purple-400" />
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-purple-400" />
                  <span>Forge Agent</span>
                </>
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-[92%] rounded-2xl p-3.5 ${
                msg.sender === "user"
                  ? "bg-purple-600/90 text-white rounded-tr-none shadow-lg shadow-purple-600/10"
                  : "bg-white/[0.04] border border-white/10 text-neutral-200 rounded-tl-none backdrop-blur-sm"
              }`}
            >
              {/* Message text */}
              {msg.text && (
                msg.sender === "user" ? (
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div className="prose-sm text-xs leading-relaxed">
                    <MarkdownMessage text={msg.text} />
                  </div>
                )
              )}

              {/* Message Attachments */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-white/10 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {msg.attachments.map((att) => (
                      <div key={att.id} className="relative group">
                        {att.type === "image" ? (
                          <div className="relative rounded-lg overflow-hidden border border-white/20 bg-black/40">
                            <img
                              src={att.url}
                              alt={att.name}
                              className="max-h-40 max-w-xs object-cover rounded-lg"
                            />
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-0.5 text-[10px] text-white truncate">
                              {att.name}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-white/10 border border-white/15 px-2.5 py-1.5 rounded-lg text-xs">
                            <FileText className="w-4 h-4 text-purple-300" />
                            <div className="flex flex-col">
                              <span className="font-medium text-white truncate max-w-[150px]">{att.name}</span>
                              {att.size && <span className="text-[10px] text-neutral-400">{att.size}</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Created Files Pills */}
              {msg.filesCreated && msg.filesCreated.length > 0 && (
                <div className="mt-3 pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
                  {msg.filesCreated.map((file, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[11px] font-mono bg-purple-500/15 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded-md"
                    >
                      <FileCode className="w-3 h-3" />
                      {file}
                    </span>
                  ))}
                </div>
              )}

              {/* Steps Progress */}
              {msg.steps && (
                <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5">
                  {msg.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-neutral-300 font-sans">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{step.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <span className="text-[10px] text-neutral-500 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {/* Generating indicator */}
        {isGenerating && (
          <div className="flex items-center gap-3 text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 p-3.5 rounded-2xl animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-purple-400 shrink-0" />
            <div className="space-y-0.5">
              <div className="font-semibold text-purple-200">Building application components…</div>
              <div className="text-[11px] text-neutral-400">Synthesizing Sandpack files & UI preview</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      <div className="px-3 py-2 border-t border-white/5 bg-[#09090b] flex items-center gap-1.5 overflow-x-auto shrink-0" style={{ scrollbarWidth: "none" }}>
        <Wand2 className="w-3 h-3 text-purple-400 shrink-0" />
        {QUICK_SUGGESTIONS.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(suggestion)}
            disabled={isGenerating}
            className="text-[11px] text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-2.5 py-1 transition-all whitespace-nowrap disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3.5 border-t border-white/10 bg-[#09090b] shrink-0">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2 focus-within:border-purple-500/60 transition-colors">

          {/* Pending Attachments Bar */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-2 mb-2 border-b border-white/10 px-1">
              {attachments.map((att) => (
                <div key={att.id} className="relative group flex items-center bg-white/10 border border-white/15 rounded-lg p-1 pr-6 text-xs">
                  {att.type === "image" ? (
                    <div className="flex items-center gap-1.5">
                      <img src={att.url} alt={att.name} className="w-6 h-6 object-cover rounded" />
                      <span className="text-[11px] text-white truncate max-w-[100px]">{att.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-purple-400" />
                      <span className="text-[11px] text-white truncate max-w-[100px]">{att.name}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="absolute right-1 text-neutral-400 hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask AI to make edits, upload images/files, or paste screenshots..."
            rows={2}
            className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none resize-none px-2 py-1"
          />
          <div className="flex items-center justify-between pt-2 border-t border-white/5 px-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-neutral-400 hover:text-purple-400 p-1.5 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1 text-xs"
              title="Attach images or files"
            >
              <Paperclip className="w-4 h-4" />
              <span className="text-[11px] hidden sm:inline text-neutral-400">Attach</span>
            </button>

            <Button
              onClick={handleSend}
              disabled={(!inputPrompt.trim() && attachments.length === 0) || isGenerating}
              size="sm"
              className="h-8 px-3 gap-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-lg disabled:opacity-50 shadow-md shadow-purple-600/20"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
