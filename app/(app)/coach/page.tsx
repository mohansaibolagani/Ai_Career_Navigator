"use client";

import { useEffect, useRef, useState } from "react";
import { useStore, useT } from "@/lib/store";
import { api } from "@/lib/api";
import { CAREERS } from "@/lib/data";
import { computeSkillGap } from "@/lib/engine";
import { SectionTitle, Badge } from "@/components/ui";
import { BotMessageSquare, Send, Sparkles, User, Trash2 } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

const SUGGESTIONS = [
  "What should I learn next?",
  "Can I apply for internships now?",
  "How do I improve my resume?",
  "Explain my roadmap simply",
  "Which project should I start first?",
];

export default function Coach() {
  const t = useT();
  const profile = useStore((s) => s.profile);
  const chat = useStore((s) => s.chat);
  const addChat = useStore((s) => s.addChat);
  const clearChat = useStore((s) => s.clearChat);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, busy]);

  if (!profile) return null;
  const career = CAREERS.find((c) => c.id === profile.targetCareerId);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    setInput("");
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: question, at: new Date().toISOString() };
    addChat(userMsg);
    setBusy(true);
    try {
      const { reply } = await api.coach(question, chat.slice(-8).map((m) => ({ role: m.role, content: m.content })));
      addChat({ id: crypto.randomUUID(), role: "coach", content: reply, at: new Date().toISOString() });
    } catch {
      addChat({ id: crypto.randomUUID(), role: "coach", content: "Sorry — I couldn't reach the server. Please try again.", at: new Date().toISOString() });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-3xl mx-auto">
      <SectionTitle
        title={t("aiCoach")}
        sub={career ? `Knows your ${career.title} goal, skill gaps and roadmap` : "Knows your profile and interests"}
        right={
          chat.length > 0 ? (
            <button className="btn btn-ghost !py-1.5 text-xs" onClick={clearChat}><Trash2 size={13} /> Clear</button>
          ) : undefined
        }
      />

      {/* context chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Badge tone="blue">{profile.degree} {profile.branch}</Badge>
        {career && <Badge tone="green">Goal: {career.title}</Badge>}
        {(() => {
          const gap = career ? computeSkillGap(profile, career) : null;
          return gap && gap.priority[0]
            ? <Badge tone="amber">Priority: {gap.priority[0].name}</Badge>
            : null;
        })()}
        <Badge tone="neutral">Language: {profile.language.toUpperCase()}</Badge>
      </div>

      {/* messages */}
      <div className="card flex-1 overflow-y-auto p-4 space-y-4">
        {chat.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center py-10">
            <span className="grid place-items-center h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 text-white">
              <BotMessageSquare size={26} />
            </span>
            <h3 className="font-semibold mt-4">Your personal AI career coach</h3>
            <p className="text-sm muted mt-1 max-w-sm">
              I know your degree, branch, skills, target career, skill gaps and roadmap. Ask anything — I answer in your selected language.
            </p>
          </div>
        )}
        {chat.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <span className={`grid place-items-center h-8 w-8 rounded-full shrink-0 ${
              m.role === "user" ? "bg-brand-600/15 text-brand-600 dark:text-brand-300" : "bg-gradient-to-br from-brand-600 to-brand-400 text-white"
            }`}>
              {m.role === "user" ? <User size={15} /> : <Sparkles size={15} />}
            </span>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.role === "user"
                ? "bg-brand-600 text-white rounded-tr-sm"
                : "surface rounded-tl-sm"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex gap-3">
            <span className="grid place-items-center h-8 w-8 rounded-full bg-gradient-to-br from-brand-600 to-brand-400 text-white">
              <Sparkles size={15} />
            </span>
            <div className="surface rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* suggestions */}
      {chat.length === 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className="badge surface muted !px-3 !py-1.5 hover:border-brand-400 cursor-pointer">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* input */}
      <form
        className="flex gap-2 mt-3"
        onSubmit={(e) => { e.preventDefault(); send(input); }}
      >
        <input
          className="input flex-1"
          placeholder={t("askQuestion")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn btn-primary !px-4" disabled={busy || !input.trim()}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
