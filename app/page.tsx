"use client";

import { useEffect, useMemo, useState } from "react";
import { getReadableTextColor, normalizeHexColor } from "@/lib/color";

type BannerMode = "scroll" | "static";

type StoredState = {
  message: string;
  mode: BannerMode;
  color: string;
  updatedAt: string | null;
  expiresAt: string | null;
  signText: string;
};

type NoticePayload = {
  message: string;
  color: string;
  updatedAt: string | null;
  expiresAt: string | null;
};

const PREVIEW_URL = "https://www.babshomeandpantry.com/";
const DEFAULT_COLOR = "#0f766e";
const COLOR_OPTIONS = ["#0f766e", "#1d4ed8", "#b91c1c", "#ca8a04", "#7c2d12", "#0f172a"];
const STORAGE_KEY = "back-in-five-state";
const DEFAULT_SIGN_TEXT =
  "If we are not open but our hours say we should be, scan this QR code for the latest update.";
const NOTICE_FALLBACK = "No active update right now. Please call the store if you need help.";

const DEFAULT_STATE: StoredState = {
  message: "",
  mode: "scroll",
  color: DEFAULT_COLOR,
  updatedAt: null,
  expiresAt: null,
  signText: DEFAULT_SIGN_TEXT
};

function formatTimestamp(value: string | null) {
  if (!value) return "Not published yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not published yet";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function toLocalInputValue(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function fromLocalInputValue(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function addHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function endOfDay() {
  const date = new Date();
  date.setHours(23, 59, 0, 0);
  return date.toISOString();
}

function tomorrowMorning() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return date.toISOString();
}

function formatExpiryLabel(expiresAt: string | null, now: number) {
  if (!expiresAt) return "No expiry set";
  const expiryTime = new Date(expiresAt).getTime();
  if (Number.isNaN(expiryTime)) return "No expiry set";
  if (expiryTime <= now) return `Expired at ${formatTimestamp(expiresAt)}`;

  const diff = expiryTime - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
  const parts = [hours ? `${hours}h` : null, `${minutes}m`].filter(Boolean).join(" ");
  return `Expires in ${parts} (${formatTimestamp(expiresAt)})`;
}

function normalizeMode(value: unknown): BannerMode {
  return value === "static" ? "static" : "scroll";
}

function normalizeExpiresAt(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function loadStoredState(): StoredState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return {
      message: typeof parsed.message === "string" ? parsed.message : DEFAULT_STATE.message,
      mode: normalizeMode(parsed.mode),
      color: normalizeHexColor(parsed.color, DEFAULT_COLOR),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : DEFAULT_STATE.updatedAt,
      expiresAt: normalizeExpiresAt(parsed.expiresAt),
      signText: typeof parsed.signText === "string" ? parsed.signText : DEFAULT_STATE.signText
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveStoredState(state: StoredState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function isExpired(expiresAt: string | null, now: number) {
  if (!expiresAt) return false;
  const time = new Date(expiresAt).getTime();
  if (Number.isNaN(time)) return false;
  return time <= now;
}

function BannerBar({
  message,
  mode,
  color,
  textColor,
  onClick
}: {
  message: string;
  mode: BannerMode;
  color: string;
  textColor: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full px-4 py-2 text-sm font-semibold uppercase tracking-wide shadow-lg transition hover:opacity-90"
      style={{ backgroundColor: color, color: textColor }}
      aria-label="Open announcement details"
    >
      <span className="block overflow-hidden whitespace-nowrap">
        <span
          className={
            mode === "scroll"
              ? "inline-block animate-marquee motion-reduce:animate-none underline underline-offset-4"
              : "inline-block underline underline-offset-4"
          }
        >
          {message}
        </span>
      </span>
    </button>
  );
}

function NoticeCard({
  message,
  updatedAt,
  color,
  isExpired,
  onClose
}: {
  message: string;
  updatedAt: string | null;
  color: string;
  isExpired: boolean;
  onClose?: () => void;
}) {
  const safeColor = normalizeHexColor(color, DEFAULT_COLOR);
  const textColor = getReadableTextColor(safeColor);
  const displayMessage = message.trim() && !isExpired ? message : NOTICE_FALLBACK;

  return (
    <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div
          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ backgroundColor: safeColor, color: textColor }}
        >
          Store Update
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600"
          >
            Close
          </button>
        )}
      </div>
      <p className="mt-4 text-lg leading-relaxed text-slate-700">{displayMessage}</p>
      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">
        {displayMessage === NOTICE_FALLBACK
          ? "No current announcement"
          : `Updated ${formatTimestamp(updatedAt)}`}
      </p>
    </div>
  );
}

export default function Home() {
  const [message, setMessage] = useState(DEFAULT_STATE.message);
  const [mode, setMode] = useState<BannerMode>(DEFAULT_STATE.mode);
  const [color, setColor] = useState(DEFAULT_STATE.color);
  const [expiresAt, setExpiresAt] = useState<string | null>(DEFAULT_STATE.expiresAt);
  const [publishedAt, setPublishedAt] = useState<string | null>(DEFAULT_STATE.updatedAt);
  const [signText, setSignText] = useState(DEFAULT_STATE.signText);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showQrPreview, setShowQrPreview] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [baseUrl, setBaseUrl] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [noticeMode, setNoticeMode] = useState(false);
  const [noticePayload, setNoticePayload] = useState<NoticePayload | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = loadStoredState();
    setMessage(stored.message);
    setMode(stored.mode);
    setColor(stored.color);
    setExpiresAt(stored.expiresAt);
    setPublishedAt(stored.updatedAt);
    setSignText(stored.signText);
    setIsLoading(false);

    const url = new URL(window.location.href);
    setBaseUrl(new URL(".", url).toString());

    const noticeParam = url.searchParams.get("notice");
    if (noticeParam === "1" || noticeParam === "true") {
      setNoticeMode(true);
      setNoticePayload({
        message: url.searchParams.get("message") || stored.message,
        color: url.searchParams.get("color") || stored.color,
        updatedAt: url.searchParams.get("updatedAt") || stored.updatedAt,
        expiresAt: url.searchParams.get("expiresAt") || stored.expiresAt
      });
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const safeColor = normalizeHexColor(color, DEFAULT_COLOR);
  const textColor = getReadableTextColor(safeColor);
  const isBannerExpired = isExpired(expiresAt, now);
  const hasMessage = message.trim().length > 0;
  const showBanner = hasMessage && !isBannerExpired;
  const bannerMessage = hasMessage ? message : "Your announcement will appear here.";
  const expiryLabel = useMemo(() => formatExpiryLabel(expiresAt, now), [expiresAt, now]);

  const noticeUrl = useMemo(() => {
    if (!baseUrl) return "";
    const url = new URL(baseUrl);
    url.searchParams.set("notice", "1");
    if (message.trim()) url.searchParams.set("message", message.trim());
    if (safeColor) url.searchParams.set("color", safeColor);
    if (expiresAt) url.searchParams.set("expiresAt", expiresAt);
    if (publishedAt) url.searchParams.set("updatedAt", publishedAt);
    return url.toString();
  }, [baseUrl, message, safeColor, expiresAt, publishedAt]);

  const qrUrl = noticeUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(noticeUrl)}`
    : "";

  const widgetUrl = baseUrl ? new URL("widget.js", baseUrl).toString() : "./widget.js";
  const widgetSnippet = `<script src="${widgetUrl}" data-message="${escapeAttribute(
    bannerMessage
  )}" data-mode="${mode}" data-color="${safeColor}" data-expires="${expiresAt ?? ""}" async></script>`;

  const handlePublish = () => {
    setIsPublishing(true);
    const updatedAt = new Date().toISOString();
    setPublishedAt(updatedAt);
    saveStoredState({
      message,
      mode,
      color: safeColor,
      updatedAt,
      expiresAt,
      signText
    });
    setStatus("Published and saved on this device.");
    setIsPublishing(false);
  };

  const handlePrintSign = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  useEffect(() => {
    if (!showBanner) {
      setShowOverlay(false);
      setShowQrPreview(false);
    }
  }, [showBanner]);

  if (noticeMode) {
    const payload = noticePayload ?? {
      message,
      color: safeColor,
      updatedAt: publishedAt,
      expiresAt
    };
    const noticeExpired = isExpired(payload.expiresAt, now);

    return (
      <main className="min-h-screen px-4 py-10 sm:px-6">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6">
          <NoticeCard
            message={payload.message}
            updatedAt={payload.updatedAt}
            color={payload.color}
            isExpired={noticeExpired}
          />
          <p className="text-xs text-slate-500">
            This notice link is meant for customers scanning the QR code on your storefront.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Store Update</p>
            <h1 className="text-3xl font-semibold text-slate-900">Announcement Editor</h1>
            <p className="text-sm text-slate-600">
              Write a short announcement for your customers. Publish to save it on this device and update the preview.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-5">
            <label className="text-sm font-semibold text-slate-700" htmlFor="message">
              Announcement text
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Type announcement here..."
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base shadow-sm focus:border-[#0f766e] focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20"
            />

            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-slate-700">Options</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    value="scroll"
                    checked={mode === "scroll"}
                    onChange={() => setMode("scroll")}
                    className="h-4 w-4 accent-[#0f766e]"
                  />
                  Scrolling banner
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    value="static"
                    checked={mode === "static"}
                    onChange={() => setMode("static")}
                    className="h-4 w-4 accent-[#0f766e]"
                  />
                  Static banner
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-slate-700">Banner color</p>
              <div className="flex flex-wrap items-center gap-3">
                {COLOR_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setColor(option)}
                    className={`h-10 w-10 rounded-full border-2 ${
                      safeColor === option ? "border-slate-900" : "border-white"
                    } shadow-sm`}
                    style={{ backgroundColor: option }}
                    aria-label={`Set banner color ${option}`}
                  />
                ))}
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <input
                    type="color"
                    value={safeColor}
                    onChange={(event) => setColor(event.target.value)}
                    className="h-10 w-10 rounded-full border border-slate-200"
                    aria-label="Choose custom banner color"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    className="w-28 bg-transparent text-xs uppercase tracking-[0.2em] text-slate-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-slate-700">Expiry timer</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setExpiresAt(null)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                    !expiresAt ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  No expiry
                </button>
                <button
                  type="button"
                  onClick={() => setExpiresAt(addHours(2))}
                  className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600"
                >
                  2 hours
                </button>
                <button
                  type="button"
                  onClick={() => setExpiresAt(addHours(6))}
                  className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600"
                >
                  6 hours
                </button>
                <button
                  type="button"
                  onClick={() => setExpiresAt(endOfDay())}
                  className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600"
                >
                  End of day
                </button>
                <button
                  type="button"
                  onClick={() => setExpiresAt(tomorrowMorning())}
                  className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600"
                >
                  Tomorrow 9am
                </button>
              </div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500" htmlFor="expiresAt">
                Custom expiry
              </label>
              <input
                id="expiresAt"
                type="datetime-local"
                value={toLocalInputValue(expiresAt)}
                onChange={(event) => setExpiresAt(fromLocalInputValue(event.target.value))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-[#0f766e] focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20"
              />
              <p className={`text-xs ${isBannerExpired ? "text-rose-600" : "text-slate-500"}`}>{expiryLabel}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing || isLoading}
                className="rounded-full bg-[#0f766e] px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-white shadow-lg transition hover:bg-[#0b5f5a] disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isPublishing ? "Publishing..." : "Publish Update"}
              </button>
              <div className="text-xs text-slate-500">
                Last published: <span className="font-semibold text-slate-700">{formatTimestamp(publishedAt)}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-500">
              Status: <span className="font-semibold text-slate-700">{status}</span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Preview</p>
            <h2 className="text-2xl font-semibold text-slate-900">Live Banner Preview</h2>
            <p className="text-sm text-slate-600">
              The banner sits at the top of the website. Tap it to see the full announcement.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowQrPreview(true)}
            className="mt-4 w-full rounded-2xl border border-teal-700/30 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800 shadow-sm"
          >
            Preview what someone who scans the QR code would see
          </button>

          <div className="relative mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
            {showBanner && (
              <div className="absolute left-0 right-0 top-0 z-20">
                <BannerBar
                  message={bannerMessage}
                  mode={mode}
                  color={safeColor}
                  textColor={textColor}
                  onClick={() => setShowOverlay(true)}
                />
              </div>
            )}
            <div className="h-[520px] w-full">
              <iframe
                title="Store website preview"
                src={PREVIEW_URL}
                className="w-full border-0"
                style={{ height: "calc(100% - 40px)", marginTop: showBanner ? "40px" : "0" }}
              />
            </div>

            {showOverlay && showBanner && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <NoticeCard
                  message={bannerMessage}
                  updatedAt={publishedAt}
                  color={safeColor}
                  isExpired={isBannerExpired}
                  onClose={() => setShowOverlay(false)}
                />
              </div>
            )}

            {showQrPreview && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <NoticeCard
                  message={bannerMessage}
                  updatedAt={publishedAt}
                  color={safeColor}
                  isExpired={isBannerExpired}
                  onClose={() => setShowQrPreview(false)}
                />
              </div>
            )}
          </div>

          <p className={`mt-3 text-xs ${isBannerExpired ? "text-rose-600" : "text-slate-500"}`}>
            {isBannerExpired
              ? "Banner hidden because the announcement expired."
              : "Preview loads the real website in an iframe. Some clicks may be blocked by the site."}
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">QR Code</p>
            <h2 className="text-2xl font-semibold text-slate-900">Storefront Notice Sign</h2>
            <p className="text-sm text-slate-600">
              Edit the text, then print the sign and post it on the door.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <label className="text-sm font-semibold text-slate-700" htmlFor="signText">
              Sign text
            </label>
            <textarea
              id="signText"
              value={signText}
              onChange={(event) => setSignText(event.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-[#0f766e] focus:outline-none focus:ring-2 focus:ring-[#0f766e]/20"
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">The sign includes the QR code and message together.</p>
            <button
              type="button"
              onClick={handlePrintSign}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              Print sign
            </button>
          </div>

          <div
            id="print-sign"
            className="mt-6 rounded-3xl border-4 border-black bg-white p-6 text-black shadow-xl"
          >
            <p className="text-center text-lg font-semibold leading-relaxed sm:text-xl">
              {signText || DEFAULT_SIGN_TEXT}
            </p>
            <div className="mt-6 flex items-center justify-center">
              {qrUrl ? (
                <div className="rounded-2xl bg-white p-3">
                  <img src={qrUrl} alt="QR code for the store update page" className="h-56 w-56" />
                </div>
              ) : (
                <div className="rounded-2xl border border-black/20 bg-slate-50 px-6 py-10 text-center text-xs uppercase tracking-[0.2em] text-slate-600">
                  Deploy to generate a QR code
                </div>
              )}
            </div>
            <p className="mt-4 text-center text-xs uppercase tracking-[0.3em] text-slate-700">
              Scan for updates
            </p>
            <p className="mt-2 break-all text-center text-xs text-slate-600">{noticeUrl}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Widget Snippet</p>
            <h2 className="text-2xl font-semibold text-slate-900">Embed on Any Website</h2>
            <p className="text-sm text-slate-600">
              Add this script tag to the store website to show this announcement. Update the snippet when you publish a new message.
            </p>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-900 p-4 text-xs text-slate-100">
            <code>{widgetSnippet}</code>
          </pre>
        </section>
      </div>
    </main>
  );
}
