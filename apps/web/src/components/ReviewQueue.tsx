import { useState } from "react";
import type { HistoryVerificationInput, ReviewHighlight, ReviewQueueItem } from "../types/review";
import { submitHistoryVerification } from "../services/vehiclesApi";
import { HistoryVerificationForm } from "./HistoryVerificationForm";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const PROVIDER_LABEL: Record<string, string> = {
  CARFAX: "Carfax",
  AUTOCHECK: "AutoCheck",
  OTHER: "History report",
};

// Pre-history-review signals (price/mileage/trim/reliability/maintenance) —
// deliberately never an overall score, since spec §2 says an UNKNOWN-history
// vehicle must never look vetted. These just answer "why might this be
// worth my time to review."
function HighlightBadges({ highlights }: { highlights: ReviewHighlight[] }) {
  if (highlights.length === 0) return null;

  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {highlights.map((h) => (
        <span key={h.label} className={`badge ${h.tone === "good" ? "badge-good" : "badge-warning"}`}>
          {h.label}
        </span>
      ))}
    </div>
  );
}

// Carfax/AutoCheck both set X-Frame-Options/CSP on their report pages
// specifically to prevent embedding (same reason we never scrape their
// content directly — see docs/history-gate.md), so an <iframe> just renders
// blank; there's no workaround from our side. A sized popup window is the
// closest thing that still keeps the dashboard on screen instead of a full
// tab-switch — position it alongside the dashboard rather than losing the
// vehicle list behind it.
function openHistoryReport(url: string): void {
  window.open(url, "vinscout-history-report", "width=960,height=1000,noopener,noreferrer");
}

export function ReviewQueue({
  items,
  onVerified,
}: {
  items: ReviewQueueItem[];
  onVerified: (vin: string) => void;
}) {
  const [expandedVin, setExpandedVin] = useState<string | null>(null);

  if (items.length === 0) {
    return <p style={{ color: "var(--ink-muted)" }}>Nothing waiting on review.</p>;
  }

  const handleSubmit = async (vin: string, input: HistoryVerificationInput) => {
    await submitHistoryVerification(vin, input);
    setExpandedVin(null);
    onVerified(vin);
  };

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.vin}
          className="flex gap-3 rounded-lg p-3"
          style={{ border: "1px solid var(--border-strong)" }}
        >
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className="h-16 w-24 shrink-0 rounded object-cover" />
          ) : (
            <div
              className="flex h-16 w-24 shrink-0 items-center justify-center rounded text-xs"
              style={{ background: "var(--border)", color: "var(--ink-muted)" }}
            >
              No photo
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium">
                  {item.year} {item.make} {item.model} {item.trim ?? ""}
                </div>
                <div className="text-sm" style={{ color: "var(--ink-secondary)" }}>
                  {item.price != null ? currency.format(item.price) : "—"} · {item.mileage.toLocaleString()} mi
                  {item.dealerName ? ` · ${item.dealerName}` : ""}
                </div>
                <HighlightBadges highlights={item.highlights} />
              </div>

              <div className="flex items-center gap-3">
                {item.historyReportLinks.map((link) => (
                  <button
                    key={link.source_url}
                    type="button"
                    onClick={() => openHistoryReport(link.source_url)}
                    className="text-sm underline"
                  >
                    {PROVIDER_LABEL[link.provider] ?? link.provider} report ↗
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setExpandedVin(expandedVin === item.vin ? null : item.vin)}
                  className="rounded px-3 py-1 text-sm font-medium"
                  style={{ border: "1px solid var(--border-strong)", color: "var(--ink-secondary)" }}
                >
                  {expandedVin === item.vin ? "Cancel" : "Review"}
                </button>
              </div>
            </div>

            {expandedVin === item.vin && (
              <HistoryVerificationForm onSubmit={(input) => handleSubmit(item.vin, input)} />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
