"use client";

import { useRef, useState } from "react";
import { useStore, useT } from "@/lib/store";
import { api } from "@/lib/api";
import type { ResumeAnalysis } from "@/lib/types";
import { SectionTitle, ScoreRing, Badge, ProgressBar } from "@/components/ui";
import {
  FileText, UploadCloud, Loader2, CheckCircle2, AlertTriangle,
  Lightbulb, Target, ScanSearch, XCircle,
} from "lucide-react";

export default function ResumeAnalyzer() {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const analysis = useStore((s) => s.resumeAnalysis);
  const setAnalysis = useStore((s) => s.setResumeAnalysis);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const upload = async (file: File) => {
    setBusy(true);
    setError("");
    try {
      const { analysis } = await api.resume(file);
      setAnalysis(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) upload(f);
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        title={t("resume")}
        sub="Upload PDF or DOCX — get resume score, ATS score, career alignment and keyword gaps."
      />

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`card p-10 text-center cursor-pointer transition-colors ${
          dragOver ? "border-brand-500 bg-brand-500/5" : ""
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        {busy ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={34} className="animate-spin text-brand-500" />
            <p className="text-sm font-medium">Analyzing your resume…</p>
            <p className="text-xs muted">Parsing text, checking sections, matching against your target career</p>
          </div>
        ) : (
          <>
            <UploadCloud size={34} className="mx-auto text-brand-500" />
            <p className="text-sm font-semibold mt-3">Drag & drop your resume, or click to browse</p>
            <p className="text-xs muted mt-1">PDF, DOCX or TXT · max 8MB</p>
            <div className="flex justify-center gap-1.5 mt-3">
              <Badge tone="neutral">.pdf</Badge>
              <Badge tone="neutral">.docx</Badge>
              <Badge tone="neutral">.txt</Badge>
            </div>
          </>
        )}
        {error && <p className="text-xs text-rose-500 mt-3">{error}</p>}
      </div>

      {analysis && <AnalysisResult a={analysis} />}
    </div>
  );
}

function AnalysisResult({ a }: { a: ResumeAnalysis }) {
  const t = useT();
  return (
    <div className="space-y-4 animate-fade-up">
      {/* Scores */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <ScoreRing value={a.resumeScore} size={76} label="score" />
          <div>
            <p className="label">{t("resumeScore")}</p>
            <p className="text-xs muted mt-1">{a.wordCount} words parsed</p>
            <p className="text-[11px] muted truncate max-w-[140px]">{a.fileName}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <ScoreRing value={a.atsScore} size={76} label="ats" />
          <div>
            <p className="label">ATS Score</p>
            <p className="text-xs muted mt-1">Sections: {a.sectionsFound.length ? a.sectionsFound.join(", ") : "—"}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <ScoreRing value={a.careerAlignment} size={76} label="align" />
          <div>
            <p className="label">Career Alignment</p>
            <p className="text-xs muted mt-1">Skills detected: {a.skillsDetected.length ? a.skillsDetected.join(", ") : "none"}</p>
          </div>
        </div>
      </div>

      {a.aiSummary && (
        <div className="card p-5 border-brand-500/30">
          <p className="label flex items-center gap-1.5 mb-2"><ScanSearch size={13} /> AI recruiter summary</p>
          <p className="text-sm">{a.aiSummary}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="label flex items-center gap-1.5 mb-3"><CheckCircle2 size={13} className="text-emerald-500" /> Strengths</p>
          <ul className="space-y-2">
            {a.strengths.map((s) => (
              <li key={s} className="text-[13px] flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-px" />{s}</li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <p className="label flex items-center gap-1.5 mb-3"><AlertTriangle size={13} className="text-amber-500" /> Weaknesses</p>
          <ul className="space-y-2">
            {a.weaknesses.map((w) => (
              <li key={w} className="text-[13px] flex gap-2"><AlertTriangle size={14} className="text-amber-500 shrink-0 mt-px" />{w}</li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <p className="label flex items-center gap-1.5 mb-3"><XCircle size={13} className="text-rose-500" /> Missing skills & keywords</p>
          <div className="flex flex-wrap gap-1.5">
            {a.missingSkills.map((s) => <Badge key={s} tone="red">{s}</Badge>)}
            {a.missingKeywords.map((s) => <Badge key={s} tone="amber">{s}</Badge>)}
            {!a.missingSkills.length && !a.missingKeywords.length && <p className="text-xs muted">Great coverage!</p>}
          </div>
        </div>
        <div className="card p-5">
          <p className="label flex items-center gap-1.5 mb-3"><Lightbulb size={13} className="text-brand-500" /> Improvement suggestions</p>
          <ol className="space-y-2">
            {a.suggestions.map((s, i) => (
              <li key={s} className="text-[13px] flex gap-2">
                <span className="grid place-items-center h-5 w-5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-300 text-[10px] font-bold shrink-0">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="card p-5">
        <p className="label flex items-center gap-1.5 mb-3"><Target size={13} /> Score breakdown</p>
        <div className="space-y-3 max-w-lg">
          {[
            ["Resume score", a.resumeScore],
            ["ATS compatibility", a.atsScore],
            ["Career alignment", a.careerAlignment],
          ].map(([label, v]) => (
            <div key={label as string}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">{label}</span>
                <span className="muted">{v as number}/100</span>
              </div>
              <ProgressBar value={v as number} />
            </div>
          ))}
        </div>
        <p className="text-[11px] muted mt-4 flex items-center gap-1.5">
          <FileText size={12} /> Analyzed {new Date(a.uploadedAt).toLocaleString()} · re-upload after edits to track improvement.
        </p>
      </div>
    </div>
  );
}
