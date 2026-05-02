'use client';

import { useState } from 'react';

interface SharePanelProps {
  communityName: string;
  shareUrl: string;
  emailBlurb: string;
  qrPngDataUrl: string;
}

export function SharePanel({
  communityName,
  shareUrl,
  emailBlurb,
  qrPngDataUrl,
}: SharePanelProps) {
  return (
    <section className="border border-stone-300 bg-white p-6 space-y-6">
      <div>
        <h2 className="font-bold text-lg">Share signup</h2>
        <p className="mt-1 text-sm text-stone-600">
          Send this to {communityName} members. Tapping the link from a
          phone opens Messages with the join keyword pre-filled.
        </p>
      </div>

      <Field label="Shareable link" value={shareUrl} />

      <Field label="Email / group-chat blurb" value={emailBlurb} multiline />

      <div className="space-y-2">
        <div className="text-sm font-semibold">QR code (for printed signage)</div>
        <div className="flex items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrPngDataUrl}
            alt={`QR code linking to ${shareUrl}`}
            className="w-40 h-40 border border-stone-300"
          />
          <a
            href={qrPngDataUrl}
            download={`flirtphone-${slugify(communityName)}-qr.png`}
            className="text-sm underline hover:text-stone-900"
          >
            Download PNG
          </a>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked — fall through silently; user can select the text.
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{label}</div>
        <button
          type="button"
          onClick={copy}
          className="text-xs underline hover:text-stone-900"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {multiline ? (
        <textarea
          readOnly
          value={value}
          rows={4}
          className="w-full bg-stone-50 border border-stone-300 px-3 py-2 text-sm font-mono"
        />
      ) : (
        <input
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full bg-stone-50 border border-stone-300 px-3 py-2 text-sm font-mono"
        />
      )}
    </div>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
