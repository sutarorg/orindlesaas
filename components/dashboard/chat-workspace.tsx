"use client";

import { ArrowUp, Bot, ChevronDown, LoaderCircle, MessagesSquare, Plus, Square, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CopyButton } from "@/components/dashboard/copy-button";
import { MarkdownMessage } from "@/components/dashboard/markdown-message";
import { Button } from "@/components/ui/button";
import type { WorkspaceSnapshot } from "@/lib/server/workspace/queries";
import { cn } from "@/lib/utils";

type ChatMessage = { id: string; role: "system" | "user" | "assistant"; content: string };
type InitialConversation = { conversation: { id: string; title: string; modelId?: string | null }; messages: ChatMessage[] };

async function errorMessage(response: Response) {
  const body = await response.clone().json().catch(() => null);
  return body?.error?.message ?? `Request failed (${response.status}).`;
}

export function ChatWorkspace({ data, initialConversation }: { data: WorkspaceSnapshot; initialConversation?: InitialConversation }) {
  const router = useRouter();
  const models = data.models.filter((model) => model.kind === "chat");
  const [conversationId, setConversationId] = useState(initialConversation?.conversation.id);
  const [title, setTitle] = useState(initialConversation?.conversation.title ?? "New conversation");
  const [modelId, setModelId] = useState(initialConversation?.conversation.modelId ?? models[0]?.id ?? "");
  const [showModel, setShowModel] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");
  const [estimate, setEstimate] = useState<number | null>(null);
  const pendingKey = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messages = [...(initialConversation?.messages ?? []), ...localMessages].filter((message) => message.role !== "system");

  useEffect(() => {
    if (!prompt.trim() || !modelId) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/v1/catalog/estimate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "chat", modelId, prompt, maxOutputTokens: 2000 }), signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw new Error(body?.error?.message);
        setEstimate(body.data.estimatedCredits);
      } catch { if (!controller.signal.aborted) setEstimate(null); }
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [modelId, prompt]);

  async function submit() {
    const message = prompt.trim();
    if (!message || !modelId || busy) { if (!message) setError("Write a message before sending."); return; }
    const retry = Boolean(pendingKey.current);
    const idempotencyKey = pendingKey.current ?? crypto.randomUUID(); pendingKey.current = idempotencyKey;
    if (!retry) setLocalMessages((current) => [...current, { id: `user-${idempotencyKey}`, role: "user", content: message }]);
    setBusy(true); setError("");
    const controller = new AbortController(); abortRef.current = controller;
    try {
      const response = await fetch("/api/v1/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modelId, conversationId, message, idempotencyKey }), signal: controller.signal });
      if (!response.ok) throw new Error(await errorMessage(response));
      pendingKey.current = null;
      setRetrying(false);
      const newConversationId = response.headers.get("x-orindle-conversation-id") ?? conversationId;
      setConversationId(newConversationId);
      if (!initialConversation && title === "New conversation") setTitle(message.slice(0, 80));
      setPrompt("");
      if (!response.body) throw new Error("The response stream is unavailable.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const assistantId = response.headers.get("x-orindle-generation-id") ?? crypto.randomUUID();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setLocalMessages((current) => {
          const existing = current.some((item) => item.id === assistantId);
          return existing ? current.map((item) => item.id === assistantId ? { ...item, content: text } : item) : [...current, { id: assistantId, role: "assistant", content: text }];
        });
      }
      text += decoder.decode();
      router.refresh();
    } catch (reason) {
      if (controller.signal.aborted) setError("Streaming stopped. The server reconciles any actual provider usage; no automatic resubmission occurs.");
      else {
        if (pendingKey.current) setRetrying(true);
        setError(reason instanceof Error ? reason.message : "The chat request failed.");
      }
    } finally { setBusy(false); abortRef.current = null; }
  }

  return <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm"><div className="border-b border-line px-4 py-4 sm:px-6"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-[11px] font-medium text-teal">Metered AI conversation</p><h1 className="truncate text-xl font-semibold">{title}</h1></div><Button type="button" variant="secondary" size="sm" onClick={() => setShowModel((value) => !value)} aria-expanded={showModel} aria-controls="chat-model-panel"><span className="max-w-52 truncate">{models.find((model) => model.id === modelId)?.name ?? "No model available"}</span><ChevronDown className={cn(showModel && "rotate-180")} /></Button></div>{showModel && <div id="chat-model-panel" className="mt-4 max-w-xl"><label htmlFor="chat-model" className="mb-2 block text-xs font-semibold">Enabled chat model</label><select id="chat-model" value={modelId} onChange={(event) => setModelId(event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm">{models.map((model) => <option key={model.id} value={model.id}>{model.name} · {model.provider}</option>)}</select></div>}</div>
    <div className="xl:grid xl:grid-cols-[270px_minmax(0,1fr)]"><aside className="hidden border-r border-line bg-[#fbfcfb] p-4 xl:block"><Button asChild className="mb-4 w-full"><Link href="/app/chat"><Plus />New chat</Link></Button><p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-muted">Your conversations</p>{data.conversations.length ? <ul className="space-y-1.5">{data.conversations.map((conversation) => <li key={conversation.id}><Link href={`/app/chat/${conversation.id}`} aria-current={conversationId === conversation.id ? "page" : undefined} className={cn("block rounded-2xl border px-3.5 py-3", conversationId === conversation.id ? "border-teal/20 bg-[#edf7f2]" : "border-transparent hover:bg-soft")}><span className="flex items-center gap-2"><MessagesSquare className="size-4 shrink-0 text-teal" /><span className="truncate text-sm font-semibold">{conversation.title}</span></span></Link></li>)}</ul> : <p className="px-2 text-xs leading-5 text-muted">No saved conversations yet.</p>}</aside>
      <div className="min-w-0"><details className="border-b border-line bg-[#fbfcfb] px-4 py-3 xl:hidden"><summary className="flex min-h-10 cursor-pointer items-center justify-between text-sm font-semibold">Conversations ({data.conversations.length})<ChevronDown className="size-4" /></summary><div className="flex flex-wrap gap-2 pt-3"><Button asChild size="sm"><Link href="/app/chat"><Plus />New</Link></Button>{data.conversations.map((conversation) => <Button key={conversation.id} asChild variant="secondary" size="sm"><Link href={`/app/chat/${conversation.id}`}>{conversation.title}</Link></Button>)}</div></details>
        <div className="max-h-[680px] min-h-[390px] overflow-y-auto px-4 py-6 sm:px-7" aria-label="Conversation messages" aria-live="polite">{messages.length === 0 ? <div className="flex min-h-[350px] flex-col items-center justify-center text-center"><span className="mb-5 grid size-14 place-items-center rounded-2xl bg-[#eaf6f0] text-teal"><MessagesSquare className="size-6" /></span><h2 className="text-2xl font-semibold">Start with a thought</h2><p className="mt-3 max-w-md text-sm leading-6 text-body">Your message is sent to the selected model. Actual usage is settled from Gateway cost.</p><div className="mt-7 grid w-full max-w-2xl gap-2 sm:grid-cols-3">{["Turn a rough idea into a practical creative brief", "Compare three directions for a product launch", "Create a checklist for my first website draft"].map((suggestion) => <button key={suggestion} type="button" onClick={() => setPrompt(suggestion)} className="min-h-20 rounded-2xl border border-line p-3 text-left text-xs leading-5 hover:bg-soft">{suggestion}</button>)}</div></div> : <div className="mx-auto max-w-4xl space-y-8">{messages.map((message) => { const assistant = message.role === "assistant"; return <article key={message.id} className={cn("flex gap-3", assistant ? "items-start" : "justify-end")}>{assistant && <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-xl bg-[#eaf6f0] text-teal"><Bot className="size-4" /></span>}<div className={cn("min-w-0", assistant ? "max-w-[850px] flex-1" : "max-w-[85%] sm:max-w-[75%]")}><div className={cn(assistant ? "pt-0.5" : "rounded-3xl rounded-br-md bg-[#eaf5ef] px-5 py-4")}><div className="mb-2 text-xs font-semibold">{assistant ? "Orindle" : <span className="sr-only">You</span>}</div><MarkdownMessage markdown={message.content || (busy ? "…" : "")} /></div>{message.content && <div className="mt-1"><CopyButton text={message.content} label="Copy message" /></div>}</div>{!assistant && <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-xl bg-subtle"><UserRound className="size-4" /></span>}</article>; })}{busy && !messages.some((message) => message.role === "assistant" && localMessages.some((local) => local.id === message.id)) && <div className="flex items-center gap-2 text-sm text-muted"><LoaderCircle className="size-4 animate-spin" />Waiting for the model…</div>}</div>}</div>
        <div className="border-t border-line bg-[#fbfcfb] p-3 sm:p-5"><div className="mx-auto max-w-4xl">{error && <p role="alert" className="mb-3 rounded-xl bg-[#fff5f3] p-3 text-sm leading-6 text-error">{error}</p>}<div className="rounded-2xl border border-line bg-white p-2 focus-within:border-teal"><label htmlFor="chat-composer" className="sr-only">Message Orindle chat</label><textarea id="chat-composer" value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void submit(); } }} rows={3} maxLength={8000} placeholder="Ask, explore or draft something…" className="max-h-44 min-h-20 w-full resize-y bg-transparent px-3 py-2 text-[15px] leading-6 outline-none" /><div className="flex items-center justify-between gap-2 px-1 pb-1"><span className="text-[11px] text-muted">{!prompt.trim() || estimate === null ? "Estimate appears as you write" : `Estimate: ${estimate.toLocaleString()} credits · actual billed separately`}</span>{busy ? <Button type="button" variant="secondary" size="sm" onClick={() => abortRef.current?.abort()}><Square />Stop</Button> : <Button type="button" size="icon" onClick={() => void submit()} disabled={!models.length} aria-label={retrying ? "Retry same chat request" : "Send message"}><ArrowUp className="size-5" /></Button>}</div></div><p className="mt-2 text-center text-[11px] leading-5 text-muted">Enter to send · Shift + Enter for a new line · No automatic charged retries</p></div></div>
      </div></div></div>;
}
