"use client";

import {
  ArrowUp,
  Bot,
  ChevronDown,
  FilePlus2,
  MessagesSquare,
  Paperclip,
  Plus,
  RefreshCw,
  Square,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { CopyButton } from "@/components/dashboard/copy-button";
import { MarkdownMessage } from "@/components/dashboard/markdown-message";
import { ModelSelector } from "@/components/dashboard/model-selector";
import { ActionFeedback, DemoBadge, InlineNotice } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import type { DashboardPreviewResult, FixtureConversation, FixtureMessage } from "@/lib/contracts/dashboard";
import { workspaceFixture } from "@/lib/dashboard/fixtures";
import { getModel } from "@/lib/dashboard/models";
import { previewDashboardService } from "@/lib/mocks/dashboard-preview";
import { cn } from "@/lib/utils";

export type ChatViewState = "default" | "streaming" | "error";

function ConversationList({ activeId, onNavigate }: { activeId?: string; onNavigate?: () => void }) {
  return (
    <>
      <Button asChild variant="primary" className="mb-4 w-full"><Link href="/app/chat" onClick={onNavigate}><Plus aria-hidden="true" />New chat</Link></Button>
      <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-muted">Fixture conversations</p>
      <ul className="space-y-1.5">
        {workspaceFixture.conversations.map((conversation) => (
          <li key={conversation.id}>
            <Link href={`/app/chat/${conversation.id}`} onClick={onNavigate} aria-current={activeId === conversation.id ? "page" : undefined} className={cn("block rounded-2xl border px-3.5 py-3 transition-colors", activeId === conversation.id ? "border-teal/20 bg-[#edf7f2]" : "border-transparent hover:bg-soft")}>
              <span className="flex items-start gap-2.5"><MessagesSquare className={cn("mt-0.5 size-4 shrink-0", activeId === conversation.id ? "text-teal" : "text-muted")} aria-hidden="true" /><span className="min-w-0"><span className="block truncate text-sm font-semibold text-ink">{conversation.title}</span><span className="mt-1 block text-[11px] text-muted">{conversation.updatedLabel}</span></span></span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-5 px-2 text-[11px] leading-5 text-muted">Local examples only. Starting a chat does not create a persistent conversation.</p>
    </>
  );
}

function EmptyChat({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  const suggestions = [
    "Turn a rough idea into a practical creative brief",
    "Compare three directions for a product launch",
    "Create a checklist for my first website draft",
  ];
  return (
    <div className="flex min-h-[390px] flex-col items-center justify-center px-4 py-10 text-center sm:px-8">
      <span className="mb-5 grid size-14 place-items-center rounded-2xl bg-[#eaf6f0] text-teal"><MessagesSquare className="size-6" aria-hidden="true" /></span>
      <DemoBadge label="New local chat preview" />
      <h2 className="mb-3 mt-4 text-2xl font-semibold tracking-[-0.035em]">Start with a thought</h2>
      <p className="max-w-md text-sm leading-6 text-body">Ask a question, shape a brief or prepare an idea for another Orindle product. This demo validates your message but never sends it to a model.</p>
      <div className="mt-7 grid w-full max-w-2xl gap-2 sm:grid-cols-3">
        {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => onPrompt(suggestion)} className="min-h-20 rounded-2xl border border-line bg-white p-3 text-left text-xs font-medium leading-5 text-body transition-colors hover:border-teal/30 hover:bg-soft hover:text-ink">{suggestion}</button>)}
      </div>
    </div>
  );
}

function Message({ message, onRegenerate }: { message: FixtureMessage; onRegenerate: () => void }) {
  const assistant = message.role === "assistant";
  return (
    <article className={cn("group flex gap-3", assistant ? "items-start" : "justify-end")}>
      {assistant && <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-xl bg-[#eaf6f0] text-teal"><Bot className="size-4" aria-hidden="true" /></span>}
      <div className={cn("min-w-0", assistant ? "max-w-[850px] flex-1" : "max-w-[85%] sm:max-w-[75%]")}>
        <div className={cn(assistant ? "pt-0.5" : "rounded-3xl rounded-br-md bg-[#eaf5ef] px-5 py-4")}>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink">{assistant ? <><span>Orindle</span><DemoBadge label="Fixture response" /></> : <span className="sr-only">You</span>}</div>
          <MarkdownMessage markdown={message.markdown} className={cn(!assistant && "text-ink")} />
        </div>
        <div className={cn("mt-1 flex items-center gap-1", !assistant && "justify-end")}>
          <CopyButton text={message.markdown} label="Copy message" />
          {assistant && <Button type="button" variant="ghost" size="sm" onClick={onRegenerate} className="min-h-9 px-2.5 text-xs"><RefreshCw aria-hidden="true" />Regenerate</Button>}
        </div>
      </div>
      {!assistant && <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-xl bg-subtle text-body"><UserRound className="size-4" aria-hidden="true" /></span>}
    </article>
  );
}

export function ChatWorkspace({ conversation, initialState = "default" }: { conversation?: FixtureConversation; initialState?: ChatViewState }) {
  const [viewState, setViewState] = useState<ChatViewState>(initialState);
  const [phase, setPhase] = useState<"ready" | "submitted" | "streaming">(initialState === "streaming" ? "streaming" : "ready");
  const [prompt, setPrompt] = useState("");
  const [modelId, setModelId] = useState(conversation?.modelId ?? "auto");
  const [showModel, setShowModel] = useState(false);
  const [attachmentNames, setAttachmentNames] = useState<string[]>([]);
  const [localMessages, setLocalMessages] = useState<FixtureMessage[]>([]);
  const [result, setResult] = useState<DashboardPreviewResult | null>(null);
  const [validationError, setValidationError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const displayConversation = conversation ?? (initialState !== "default" ? workspaceFixture.conversations[0] : undefined);
  const messages = [...(displayConversation?.messages ?? []), ...localMessages];
  const selectedModel = getModel(modelId);

  async function submit() {
    const cleanPrompt = prompt.trim();
    if (cleanPrompt.length < 2) {
      setValidationError("Write at least 2 characters before previewing a message.");
      return;
    }
    setValidationError("");
    setPhase("submitted");
    const preview = await previewDashboardService.generate({ product: "chat", modelId, prompt: cleanPrompt, attachmentNames });
    if (conversation) {
      setLocalMessages((current) => [...current, { id: `local-${current.length + 1}`, role: "user", markdown: cleanPrompt, modelId: null, status: "ready" }]);
    }
    setResult({ ...preview, message: attachmentNames.length ? `${preview.message} ${attachmentNames.length} selected file${attachmentNames.length === 1 ? " was" : "s were"} not uploaded.` : preview.message });
    setPrompt("");
    setAttachmentNames([]);
    if (fileRef.current) fileRef.current.value = "";
    setPhase("ready");
  }

  async function regenerate() {
    const response = await previewDashboardService.generate({ product: "chat", modelId, prompt: "Regenerate the last fixture response", attachmentNames: [] });
    setResult({ ...response, message: "Regeneration is not connected. The existing fixture response is unchanged and no model request or credit deduction occurred." });
  }

  function stop() {
    setPhase("ready");
    setViewState("default");
    setResult({ status: "unavailable", persisted: false, creditsChanged: 0, message: "The static streaming presentation stopped locally. No active request or server job was cancelled." });
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_1px_2px_rgba(21,25,24,0.02)]">
      <div className="border-b border-line px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0"><div className="mb-1 flex items-center gap-2"><DemoBadge /><span className="text-[11px] text-muted">No model connection</span></div><h1 className="truncate text-xl font-semibold tracking-[-0.03em]">{displayConversation?.title ?? "New conversation"}</h1></div>
          <Button type="button" variant="secondary" size="sm" onClick={() => setShowModel((value) => !value)} aria-expanded={showModel} aria-controls="chat-model-panel"><span className="max-w-52 truncate">{modelId === "auto" ? "Auto model" : selectedModel?.displayName ?? modelId}</span><ChevronDown className={cn("transition-transform", showModel && "rotate-180")} aria-hidden="true" /></Button>
        </div>
        {showModel && <div id="chat-model-panel" className="mt-4 max-w-xl"><ModelSelector id="chat-model" product="chat" value={modelId} onChange={setModelId} allowAuto /></div>}
      </div>

      <div className="xl:grid xl:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="hidden border-r border-line bg-[#fbfcfb] p-4 xl:block"><ConversationList activeId={displayConversation?.id} /></aside>
        <div className="min-w-0">
          <details className="border-b border-line bg-[#fbfcfb] px-4 py-3 xl:hidden">
            <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between text-sm font-semibold text-ink"><span>Conversations <span className="font-normal text-muted">({workspaceFixture.conversations.length})</span></span><ChevronDown className="size-4" aria-hidden="true" /></summary>
            <div className="pt-3"><ConversationList activeId={displayConversation?.id} /></div>
          </details>

          {viewState === "error" && <div className="border-b border-error/10 bg-[#fff9f8] p-4 sm:px-6"><InlineNotice title="Chat response error fixture" tone="error"><p>This is a safe simulated error state, not a provider failure. No request was sent.</p><Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => { setViewState("default"); setResult({ status: "preview", persisted: false, creditsChanged: 0, message: "The error fixture was dismissed locally. No network retry occurred." }); }}><RefreshCw aria-hidden="true" />Dismiss error fixture</Button></InlineNotice></div>}

          <div className="max-h-[680px] min-h-[390px] overflow-y-auto px-4 py-6 sm:px-7" aria-label="Conversation messages">
            {messages.length === 0 && phase !== "streaming" ? <EmptyChat onPrompt={setPrompt} /> : (
              <div className="mx-auto max-w-4xl space-y-8">
                {messages.map((message) => <Message key={message.id} message={message} onRegenerate={regenerate} />)}
                {phase === "streaming" && (
                  <div className="flex items-start gap-3" data-testid="streaming-fixture">
                    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#eaf6f0] text-teal"><Bot className="size-4" aria-hidden="true" /></span>
                    <div className="flex-1 rounded-2xl border border-teal/15 bg-[#f5faf7] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-ink">Streaming response fixture…</p><p className="mt-1 text-xs text-muted">Static UI state. No tokens are arriving.</p></div><Button type="button" variant="secondary" size="sm" onClick={stop}><Square aria-hidden="true" />Stop preview</Button></div><div className="mt-4 space-y-2" aria-hidden="true"><div className="h-2.5 w-11/12 animate-pulse rounded bg-line" /><div className="h-2.5 w-8/12 animate-pulse rounded bg-line" /></div></div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-line bg-[#fbfcfb] p-3 sm:p-5">
            <div className="mx-auto max-w-4xl">
              <ActionFeedback result={result} />
              {validationError && <p role="alert" className="mb-2 text-sm font-medium text-error">{validationError}</p>}
              {attachmentNames.length > 0 && <div className="mb-3 flex flex-wrap gap-2" aria-label="Locally selected attachments">{attachmentNames.map((name, index) => <span key={`${name}-${index}`} className="inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-3 pr-1.5 text-xs text-body"><FilePlus2 className="size-3.5 shrink-0 text-teal" aria-hidden="true" /><span className="max-w-52 truncate">{name}</span><span className="sr-only">Not uploaded</span><button type="button" onClick={() => setAttachmentNames((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="grid size-7 place-items-center rounded-full hover:bg-soft" aria-label={`Remove ${name}`}><X className="size-3.5" aria-hidden="true" /></button></span>)}</div>}
              <div className="rounded-2xl border border-line bg-white p-2 shadow-[0_4px_20px_rgba(21,25,24,0.04)] focus-within:border-teal focus-within:ring-2 focus-within:ring-teal/10">
                <label htmlFor="chat-composer" className="sr-only">Message Orindle demo chat</label>
                <textarea id="chat-composer" value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void submit(); } }} rows={3} maxLength={8000} placeholder="Ask, explore or draft something…" className="max-h-44 min-h-20 w-full resize-y bg-transparent px-3 py-2 text-[15px] leading-6 text-ink outline-none placeholder:text-muted" aria-describedby="composer-guidance" />
                <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-1">
                  <div className="flex items-center gap-1">
                    <input ref={fileRef} id="chat-attachments" type="file" multiple className="sr-only" aria-label="Chat attachments, local file names only" accept="image/*,.pdf,.txt,.md" onChange={(event) => { const files = Array.from(event.target.files ?? []).slice(0, 5); setAttachmentNames(files.map((file) => file.name)); }} />
                    <Button type="button" variant="ghost" size="sm" onClick={() => fileRef.current?.click()}><Paperclip aria-hidden="true" />Attach</Button>
                    <span className="hidden text-[11px] text-muted sm:inline">Names only · never uploaded</span>
                  </div>
                  {phase === "streaming" ? <Button type="button" variant="secondary" size="sm" onClick={stop}><Square aria-hidden="true" />Stop</Button> : <Button type="button" size="icon" onClick={() => void submit()} disabled={phase === "submitted"} aria-label="Preview message"><ArrowUp className="size-5" aria-hidden="true" /></Button>}
                </div>
              </div>
              <p id="composer-guidance" className="mt-2 text-center text-[11px] leading-5 text-muted">Enter to preview · Shift + Enter for a new line · No AI response, upload or credit deduction occurs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
