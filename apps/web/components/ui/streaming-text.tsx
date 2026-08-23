"use client";

import React, { useEffect, useState } from "react";

/* ──────────────────────────────────
 * STREAMING TEXT (21st.dev component)
 * Words resolve out of blur, inline citations appear in
 * context, then actions and follow-up prompts become usable.
 * ────────────────────────────────── */

const WORD_MS = 80;
const HOLD_MS = 3400;

export type Token = { text: string; cite?: boolean };

export interface StreamingTextProps {
  tokens?: Token[];
  followUps?: string[];
  onSelectFollowUp?: (prompt: string) => void;
  sources?: Array<{
    name: string;
    domain: string;
    href: string;
    image: string;
  }>;
  autoLoop?: boolean;
}

const DEFAULT_TOKENS: Token[] = [
  ..."Pistachio is your fastest-growing flavor — sales are up 23% this month and margins beat vanilla by 8 points."
    .split(" ")
    .map((text) => ({ text })),
  { text: "", cite: true },
  ..."Stone-fruit flavors are trending in the same range."
    .split(" ")
    .map((text) => ({ text })),
];

const DEFAULT_FOLLOW_UPS = [
  "Which flavors sell best in winter?",
  "Compare gelato and soft serve margins",
];

const SOURCE_IMAGES = {
  scoop:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%231f7a5f'/%3E%3Cpath d='M20 36c0 7 5.4 12 12 12s12-5 12-12H20Z' fill='%23fff'/%3E%3Ccircle cx='32' cy='25' r='11' fill='%23bff3dd'/%3E%3Cpath d='M24 24c4-7 13-7 17 0' fill='none' stroke='%231f7a5f' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E",
  trends:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%232f6fec'/%3E%3Cpath d='M15 43 27 31l8 7 14-18' fill='none' stroke='%23fff' stroke-width='7' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='49' cy='20' r='5' fill='%23bfe0ff'/%3E%3C/svg%3E",
  market:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%23e56d24'/%3E%3Cpath d='M17 45V25h8v20h-8Zm11 0V16h8v29h-8Zm11 0V30h8v15h-8Z' fill='%23fff'/%3E%3Cpath d='M16 49h32' stroke='%23ffd6b8' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E",
};

const DEFAULT_SOURCES = [
  {
    name: "Scoop Data",
    domain: "scoopdata.io",
    href: "https://scoopdata.io/",
    image: SOURCE_IMAGES.scoop,
  },
  {
    name: "Trends Index",
    domain: "trends.google.com",
    href: "https://trends.google.com/trends/",
    image: SOURCE_IMAGES.trends,
  },
  {
    name: "Market Basket",
    domain: "marketbasket.io",
    href: "https://marketbasket.io/",
    image: SOURCE_IMAGES.market,
  },
];

function SourceChip({ source = DEFAULT_SOURCES[0] }: { source?: (typeof DEFAULT_SOURCES)[number] }) {
  return (
    <a
      href={source.href}
      target="_blank"
      rel="noreferrer"
      className="ml-0 mr-1.5 inline-flex h-5 translate-y-[-1px] items-center gap-1.5 rounded-[5px]
        px-2 align-middle font-mono text-[11px] text-gray-300 shadow-sm
        transition-all duration-150 hover:bg-blue-500/20 hover:text-blue-300 border border-white/10"
      style={{
        background: "rgba(255, 255, 255, 0.06)",
        animation: "pop-in 250ms cubic-bezier(0.23,1,0.32,1) both",
        textDecoration: "none",
      }}
    >
      <img
        src={source.image}
        alt=""
        className="size-3.5 rounded-[3px] object-cover"
        style={{ width: "13px", height: "13px", borderRadius: "3px" }}
      />
      <span>{source.domain}</span>
    </a>
  );
}

const ACTION_ICONS: React.ReactNode[] = [
  <g key="copy">
    <rect x="9" y="9" width="12" height="12" rx="2.5" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </g>,
  <path key="retry" d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />,
  <path
    key="up"
    d="M7 10v12M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z"
  />,
  <path
    key="down"
    d="M17 14V2M9 18.12L10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88z"
  />,
];

export function StreamingText({
  tokens = DEFAULT_TOKENS,
  followUps = DEFAULT_FOLLOW_UPS,
  onSelectFollowUp,
  sources = DEFAULT_SOURCES,
  autoLoop = true,
}: StreamingTextProps) {
  const [count, setCount] = useState(0);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const done = count >= tokens.length;

  useEffect(() => {
    if (!autoLoop && done) return;

    const t = setTimeout(
      () => setCount((c) => (c >= tokens.length ? (autoLoop ? 0 : tokens.length) : c + 1)),
      done ? HOLD_MS : WORD_MS,
    );
    return () => clearTimeout(t);
  }, [count, done, tokens.length, autoLoop]);

  const handleCopy = () => {
    const fullText = tokens.map((t) => t.text).join(" ");
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[13rem] w-full max-w-xl" style={{ color: "#F3F4F6" }}>
      {/* Streaming Text Body */}
      <p className="text-[14px] leading-relaxed text-gray-200" style={{ lineHeight: 1.7 }}>
        {tokens.slice(0, count).map((token, i) =>
          token.cite ? (
            <SourceChip key={i} source={sources[0]} />
          ) : (
            <span
              key={i}
              className="inline"
              style={{ animation: "fade-in 250ms ease-out both" }}
            >
              {token.text}{" "}
            </span>
          ),
        )}
        {!done && (
          <span
            className="ml-0.5 inline-block h-3.5 w-1 translate-y-0.5 rounded-full bg-blue-400"
            style={{ animation: "fade-in 150ms ease-out both", display: "inline-block", width: "4px", height: "14px", backgroundColor: "#60A5FA" }}
          />
        )}
      </p>

      {/* Action Icons Row */}
      <div
        className="mt-3 flex items-center gap-1.5 transition-opacity duration-300"
        style={{
          opacity: done ? 1 : 0,
          pointerEvents: done ? "auto" : "none",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginTop: "12px",
        }}
      >
        {ACTION_ICONS.map((icon, i) => (
          <button
            key={i}
            type="button"
            aria-label="Action"
            onClick={i === 0 ? handleCopy : undefined}
            className="flex size-7 items-center justify-center rounded-[6px] text-gray-400
              transition-colors duration-150 hover:bg-white/10 hover:text-white"
            style={{
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: i === 0 && copied ? "#34D399" : "#9CA3AF",
              cursor: "pointer",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {icon}
            </svg>
          </button>
        ))}

        {/* Sources Dropdown Toggle */}
        <button
          type="button"
          aria-expanded={sourcesOpen}
          onClick={() => setSourcesOpen((current) => !current)}
          className="ml-2 flex items-center gap-1.5 rounded-[6px] px-2 py-1 text-left transition-colors duration-150 hover:bg-white/10"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "6px",
            padding: "4px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span className="flex -space-x-1" style={{ display: "flex", marginRight: "4px" }}>
            {sources.map((source) => (
              <img
                key={source.domain}
                src={source.image}
                alt=""
                className="size-3.5 rounded-full"
                style={{ width: "14px", height: "14px", borderRadius: "50%", border: "1px solid #07080A", marginLeft: "-4px" }}
              />
            ))}
          </span>
          <span className="text-[11.5px] text-gray-300 font-medium" style={{ fontSize: "11.5px", color: "#D1D5DB" }}>
            {sources.length} sources
          </span>
        </button>
      </div>

      {/* Expandable Sources Drawer */}
      <div
        className="grid transition-[grid-template-rows,opacity] duration-300"
        style={{
          gridTemplateRows: done && sourcesOpen ? "1fr" : "0fr",
          opacity: done && sourcesOpen ? 1 : 0,
          transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
          display: "grid",
          transition: "all 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        <div className="overflow-hidden" style={{ overflow: "hidden" }}>
          <div
            className="mt-2 flex flex-col rounded-lg bg-gray-900/60 p-1.5 border border-white/10"
            style={{
              marginTop: "8px",
              borderRadius: "8px",
              background: "rgba(17, 19, 24, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "6px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {sources.map((source) => (
              <a
                key={source.domain}
                href={source.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-[12px] text-gray-300 transition-colors duration-150 hover:bg-white/10 hover:text-white"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 8px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  color: "#D1D5DB",
                  fontSize: "12px",
                }}
              >
                <img
                  src={source.image}
                  alt=""
                  className="size-4 rounded-[4px]"
                  style={{ width: "16px", height: "16px", borderRadius: "4px" }}
                />
                <span className="font-medium">{source.name}</span>
                <span className="ml-auto font-mono text-[10.5px] text-gray-500" style={{ marginLeft: "auto", fontFamily: "monospace", color: "#6B7280", fontSize: "10.5px" }}>
                  {source.domain}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Follow-Up Prompt Suggestions */}
      {followUps.length > 0 && (
        <div
          className="mt-3.5 transition-opacity duration-300"
          style={{
            opacity: done ? 1 : 0,
            pointerEvents: done ? "auto" : "none",
            marginTop: "14px",
          }}
        >
          <p className="text-[11.5px] font-semibold uppercase tracking-wider text-gray-500 mb-1" style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", color: "#6B7280", textTransform: "uppercase" }}>
            Suggested Follow-ups
          </p>
          <div className="flex flex-col gap-1" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {followUps.map((text, i) => (
              <button
                key={text}
                type="button"
                onClick={() => onSelectFollowUp?.(text)}
                className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12.5px] text-gray-300 transition-all duration-150 hover:bg-white/10 hover:text-blue-400"
                style={
                  done
                    ? {
                        animation: `fade-up 350ms cubic-bezier(0.23,1,0.32,1) ${i * 90}ms both`,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "7px 10px",
                        borderRadius: "6px",
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                        color: "#E5E7EB",
                        fontSize: "12.5px",
                        cursor: "pointer",
                        textAlign: "left",
                      }
                    : { opacity: 0 }
                }
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#60A5FA"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                  style={{ flexShrink: 0 }}
                >
                  <path d="M9 10l-5 5 5 5" />
                  <path d="M20 4v7a4 4 0 0 1-4 4H4" />
                </svg>
                <span>{text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default StreamingText;
