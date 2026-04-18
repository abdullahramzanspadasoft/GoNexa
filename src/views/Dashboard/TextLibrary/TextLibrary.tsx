"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

const MAX_CHARS = 63206;
const DEFAULT_MODEL = "gemini-2.5-flash-lite";

type ChatRole = "system" | "user" | "assistant";

type ChatMessage = { role: ChatRole; content: string };

type PuterStreamPart = { text?: string };

declare global {
  interface Window {
    puter?: {
      ai: {
        chat: (
          messages: ChatMessage[],
          options?: { model?: string; stream?: boolean }
        ) => Promise<AsyncIterable<PuterStreamPart>>;
      };
    };
  }
}

function buildSystemPrompt(opts: {
  language: string;
  tone: string;
  creativity: string;
  words: string;
  hashtags: string;
}) {
  const hashtagRule =
    opts.hashtags === "Include"
      ? "End with 2–5 relevant hashtags each on its own line."
      : "Do not use hashtags or # symbols.";
  const creativityHint =
    opts.creativity === "Low"
      ? "Use straightforward, conventional wording; avoid flashy metaphors."
      : opts.creativity === "High"
        ? "Use vivid language, varied rhythm, and memorable hooks where it fits."
        : "Balance clarity with light originality.";

  return `You are a professional writing assistant.
Write in ${opts.language}.
Tone: ${opts.tone}.
Creativity: ${creativityHint}
Target length: approximately ${opts.words} words (stay close; slightly under is better than far over).
${hashtagRule}
Return only the final copy the user asked for — no preamble or meta-commentary.`;
}

const EMOJI_PICKS = ["😊", "❤️", "🔥", "✨", "👍", "🎉", "💡", "✅"];

type HistoryState = { versions: string[]; index: number };

export function TextLibrary() {
  const [prompt, setPrompt] = useState("");
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("English");
  const [tone, setTone] = useState("Professional");
  const [creativity, setCreativity] = useState("Balanced");
  const [words, setWords] = useState("120");
  const [hashtags, setHashtags] = useState("Include");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [puterReady, setPuterReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [history, setHistory] = useState<HistoryState>({ versions: [], index: -1 });
  const { versions, index: versionIndex } = history;

  const textRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef(false);

  const model = process.env.NEXT_PUBLIC_PUTER_MODEL || DEFAULT_MODEL;

  const opts = { language, tone, creativity, words, hashtags };

  const isPuterAvailable = useCallback(() => {
    return typeof window !== "undefined" && !!window.puter?.ai?.chat;
  }, []);

  /** Wait for Puter script (up to maxMs). Call after user clicks Generate so the button does not stay disabled. */
  const waitForPuter = useCallback(
    async (maxMs = 15000, step = 120) => {
      const start = Date.now();
      while (Date.now() - start < maxMs) {
        if (abortRef.current) return false;
        if (isPuterAvailable()) {
          setPuterReady(true);
          return true;
        }
        await new Promise((r) => setTimeout(r, step));
      }
      return isPuterAvailable();
    },
    [isPuterAvailable]
  );

  const streamChat = useCallback(
    async (messages: ChatMessage[]) => {
      if (!isPuterAvailable()) {
        throw new Error("AI is still loading. Wait a moment and try again.");
      }
      const stream = await window.puter!.ai.chat(messages, {
        model,
        stream: true,
      });
      let full = "";
      for await (const part of stream) {
        if (abortRef.current) break;
        if (part.text) {
          full += part.text;
          setText(full);
        }
      }
      return full;
    },
    [isPuterAvailable, model]
  );

  const pushVersion = useCallback((next: string) => {
    setHistory((h) => {
      const base = h.index >= 0 ? h.versions.slice(0, h.index + 1) : [];
      const versions = [...base, next];
      return { versions, index: versions.length - 1 };
    });
  }, []);

  const handleGenerate = async () => {
    const p = prompt.trim();
    if (!p) {
      setError("Write a prompt first.");
      return;
    }
    setError("");
    setCopied(false);
    abortRef.current = false;
    setLoading(true);
    setText("");
    try {
      if (!(await waitForPuter())) {
        throw new Error(
          "AI could not load. Check your network, disable blockers for js.puter.com, then try again."
        );
      }
      const system = buildSystemPrompt(opts);
      const messages: ChatMessage[] = [
        { role: "system", content: system },
        { role: "user", content: p },
      ];
      const out = await streamChat(messages);
      if (!abortRef.current && out.trim()) {
        pushVersion(out);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Generation failed.";
      setError(msg);
      setText("");
    } finally {
      setLoading(false);
    }
  };

  const runRefinement = async (instruction: string) => {
    const body = text.trim();
    if (!body) {
      setError("Generate or paste text first.");
      return;
    }
    setError("");
    abortRef.current = false;
    setLoading(true);
    setText("");
    try {
      if (!(await waitForPuter())) {
        throw new Error(
          "AI could not load. Check your network, disable blockers for js.puter.com, then try again."
        );
      }
      const system = buildSystemPrompt(opts);
      const messages: ChatMessage[] = [
        { role: "system", content: system },
        {
          role: "user",
          content: `${instruction}\n\n---\n${body}`,
        },
      ];
      const out = await streamChat(messages);
      if (!abortRef.current && out.trim()) {
        pushVersion(out);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed.";
      setError(msg);
      setText(body);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    abortRef.current = true;
    setLoading(false);
    setPrompt("");
    setText("");
    setError("");
    setHistory({ versions: [], index: -1 });
    setShowEmojis(false);
  };

  const handleApply = async () => {
    const t = text.trim();
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  };

  const goPrev = () => {
    if (versionIndex <= 0) return;
    const i = versionIndex - 1;
    setText(versions[i] ?? "");
    setHistory((h) => ({ ...h, index: i }));
  };

  const goNext = () => {
    if (versionIndex < 0 || versionIndex >= versions.length - 1) return;
    const i = versionIndex + 1;
    setText(versions[i] ?? "");
    setHistory((h) => ({ ...h, index: i }));
  };

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const el = textRef.current?.closest(".tlg-panel-text");
      if (showEmojis && el && !el.contains(e.target as Node)) {
        setShowEmojis(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [showEmojis]);

  const charCount = Math.min(text.length, MAX_CHARS);

  return (
    <div className="tlg-page">
      <Script
        src="https://js.puter.com/v2/"
        strategy="afterInteractive"
        onLoad={() => {
          const start = Date.now();
          const id = window.setInterval(() => {
            if (isPuterAvailable()) {
              setPuterReady(true);
              window.clearInterval(id);
            } else if (Date.now() - start > 15000) {
              window.clearInterval(id);
            }
          }, 100);
        }}
      />

      <div className="tlg-card">
        <div className="tlg-title">AI Text Generator</div>

        {!puterReady && !prompt.trim() && (
          <p className="tlg-hint">Starting AI in the background — type a prompt, then press Generate.</p>
        )}
        {error && (
          <p className="tlg-error" role="alert">
            {error}
          </p>
        )}
        {copied && <p className="tlg-success">Copied to clipboard.</p>}

        <div className="tlg-grid">
          <div className="tlg-panel tlg-panel-prompt">
            <label className="tlg-label" htmlFor="tlg-prompt">
              Prompt
            </label>
            <textarea
              id="tlg-prompt"
              className="tlg-textarea tlg-textarea-lg"
              placeholder="Write your prompt here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="tlg-panel tlg-panel-controls">
            <div className="tlg-controls-grid">
              <div className="tlg-select-group">
                <label className="tlg-select-label" htmlFor="tlg-lang">
                  Language
                </label>
                <select
                  id="tlg-lang"
                  className="tlg-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={loading}
                >
                  <option>English</option>
                  <option>Arabic</option>
                  <option>French</option>
                  <option>Urdu</option>
                  <option>Spanish</option>
                </select>
              </div>
              <div className="tlg-select-group">
                <label className="tlg-select-label" htmlFor="tlg-tone">
                  Tone
                </label>
                <select
                  id="tlg-tone"
                  className="tlg-select"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  disabled={loading}
                >
                  <option>Professional</option>
                  <option>Friendly</option>
                  <option>Casual</option>
                  <option>Persuasive</option>
                </select>
              </div>
              <div className="tlg-select-group">
                <label className="tlg-select-label" htmlFor="tlg-creative">
                  Creativity
                </label>
                <select
                  id="tlg-creative"
                  className="tlg-select"
                  value={creativity}
                  onChange={(e) => setCreativity(e.target.value)}
                  disabled={loading}
                >
                  <option>Balanced</option>
                  <option>Low</option>
                  <option>High</option>
                </select>
              </div>
              <div className="tlg-select-group">
                <label className="tlg-select-label" htmlFor="tlg-words">
                  Words
                </label>
                <select
                  id="tlg-words"
                  className="tlg-select"
                  value={words}
                  onChange={(e) => setWords(e.target.value)}
                  disabled={loading}
                >
                  <option>60</option>
                  <option>120</option>
                  <option>250</option>
                  <option>500</option>
                </select>
              </div>
              <div className="tlg-select-group tlg-select-full">
                <label className="tlg-select-label" htmlFor="tlg-hash">
                  Hashtags
                </label>
                <select
                  id="tlg-hash"
                  className="tlg-select"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  disabled={loading}
                >
                  <option>Include</option>
                  <option>Exclude</option>
                </select>
              </div>
              <button
                className="tlg-generate-btn"
                type="button"
                onClick={() => void handleGenerate()}
                disabled={loading || !prompt.trim()}
                title={!prompt.trim() ? "Write a prompt first" : undefined}
              >
                {loading ? "Generating…" : "Generate"}
              </button>
            </div>
          </div>
        </div>

        <div className="tlg-grid tlg-grid-bottom">
          <div className="tlg-panel tlg-panel-text">
            <label className="tlg-label" htmlFor="tlg-output">
              Text
            </label>
            <textarea
              ref={textRef}
              id="tlg-output"
              className="tlg-textarea tlg-textarea-xl"
              placeholder="Generated text will appear here..."
              value={text}
              onChange={(e) => {
                const v = e.target.value;
                if (v.length <= MAX_CHARS) setText(v);
              }}
              disabled={loading}
            />
            <div className="tlg-text-footer">
              <div className="tlg-emoji-wrap">
                <button
                  className="tlg-icon-btn"
                  type="button"
                  aria-label="Insert emoji"
                  onClick={() => setShowEmojis((s) => !s)}
                  disabled={loading}
                >
                  😊
                </button>
                {showEmojis && (
                  <div className="tlg-emoji-popover" role="listbox">
                    {EMOJI_PICKS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        className="tlg-emoji-item"
                        onClick={() => {
                          setText((t) => (t + em).slice(0, MAX_CHARS));
                          setShowEmojis(false);
                        }}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="tlg-text-footer-right">
                <span className="tlg-count">
                  {charCount}/{MAX_CHARS}
                </span>
              </div>
            </div>
          </div>

          <div className="tlg-panel tlg-panel-actions">
            <button
              className="tlg-action-btn"
              type="button"
              disabled={loading || !text.trim()}
              onClick={() =>
                void runRefinement(
                  "Rephrase the text below. Keep the same language, tone, and approximate length unless the original is very short."
                )
              }
            >
              Rephrase
            </button>
            <button
              className="tlg-action-btn"
              type="button"
              disabled={loading || !text.trim()}
              onClick={() =>
                void runRefinement("Make the text shorter while keeping the core message and tone.")
              }
            >
              Make shorter
            </button>
            <button
              className="tlg-action-btn"
              type="button"
              disabled={loading || !text.trim()}
              onClick={() =>
                void runRefinement(
                  "Make the text punchier: stronger verbs, tighter sentences, same meaning."
                )
              }
            >
              Make punchier
            </button>
            <button
              className="tlg-action-btn"
              type="button"
              disabled={loading || !text.trim()}
              onClick={() =>
                void runRefinement(
                  "Fix grammar, spelling, and punctuation only. Do not change meaning or style more than necessary."
                )
              }
            >
              Correct text
            </button>
          </div>
        </div>

        <div className="tlg-footer">
          <div className="tlg-footer-left">
            <button
              className="tlg-nav-btn"
              type="button"
              aria-label="Previous version"
              disabled={loading || versionIndex <= 0}
              onClick={goPrev}
            >
              ‹
            </button>
            <button
              className="tlg-nav-btn"
              type="button"
              aria-label="Next version"
              disabled={loading || versionIndex < 0 || versionIndex >= versions.length - 1}
              onClick={goNext}
            >
              ›
            </button>
          </div>
          <div className="tlg-footer-right">
            <button className="tlg-cancel-btn" type="button" onClick={handleCancel}>
              Cancel
            </button>
            <button
              className="tlg-apply-btn"
              type="button"
              onClick={() => void handleApply()}
              disabled={!text.trim()}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
