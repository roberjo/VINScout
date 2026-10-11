import { Fragment, useState } from "react";
import type { HistoryVerificationInput, ReviewHighlight, ReviewQueueItem, ReviewSort } from "../types/review";
import { submitHistoryVerification } from "../services/vehiclesApi";
import { HistoryVerificationForm } from "./HistoryVerificationForm";
import { SortableHeader } from "./SortableHeader";

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
    <div className="mt-1 flex flex-wrap gap-1.5">
      {highlights.map((h) => (
        <span key={h.label} className={`badge ${h.tone === "good" ? "badge-good" : "badge-warning"}`}>
          {h.label}
        </span>
      ))}
    </div>
  );
}

// Wraps its child in a link to the original listing when one exists — used
// for both the photo and the title, so either one takes you to the source.
function MaybeListingLink({ url, children }: { url: string | null; children: React.ReactNode }) {
  if (!url) return <>{children}</>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

function VehiclePhoto({ imageUrl }: { imageUrl: string | null }) {
  if (imageUrl) {
    return <img src={imageUrl} alt="" className="h-12 w-16 rounded object-cover" />;
  }
  return (
    <div
      className="flex h-12 w-16 items-center justify-center rounded text-xs"
      style={{ background: "var(--border)", color: "var(--ink-muted)" }}
    >
      No photo
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
  sort,
  onSortChange,
  onVerified,
}: {
  items: ReviewQueueItem[];
  sort: ReviewSort;
  onSortChange: (sort: ReviewSort) => void;
  onVerified: () => void;
}) {
  const [expandedVin, setExpandedVin] = useState<string | null>(null);

  if (items.length === 0) {
    return <p style={{ color: "var(--ink-muted)" }}>Nothing waiting on review.</p>;
  }

  const handleSubmit = async (vin: string, input: HistoryVerificationInput) => {
    await submitHistoryVerification(vin, input);
    setExpandedVin(null);
    onVerified();
  };

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr style={{ color: "var(--ink-muted)" }} className="text-xs font-semibold uppercase tracking-wide">
          <th className="py-2 pr-4 font-semibold"></th>
          <SortableHeader label="Vehicle" column="firstSeenAt" sort={sort} onSortChange={onSortChange} defaultDir="desc" />
          <SortableHeader label="Price" column="price" sort={sort} onSortChange={onSortChange} defaultDir="asc" />
          <SortableHeader label="Mileage" column="mileage" sort={sort} onSortChange={onSortChange} defaultDir="asc" />
          <th className="py-2 pr-4 font-semibold">Highlights</th>
          <th className="py-2 pr-4 font-semibold">Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <Fragment key={item.vin}>
            <tr style={{ borderTop: "1px solid var(--border)" }}>
              <td className="py-2 pr-4">
                <MaybeListingLink url={item.listingUrl}>
                  <VehiclePhoto imageUrl={item.imageUrl} />
                </MaybeListingLink>
              </td>
              <td className="py-2 pr-4 font-medium">
                <MaybeListingLink url={item.listingUrl}>
                  <span className={item.listingUrl ? "hover:underline" : undefined}>
                    {item.year} {item.make} {item.model} {item.trim ?? ""}
                  </span>
                </MaybeListingLink>
                {item.dealerName && (
                  <div className="text-xs font-normal" style={{ color: "var(--ink-muted)" }}>
                    {item.dealerName}
                  </div>
                )}
              </td>
              <td className="py-2 pr-4">{item.price != null ? currency.format(item.price) : "—"}</td>
              <td className="py-2 pr-4" style={{ color: "var(--ink-secondary)" }}>
                {item.mileage.toLocaleString()} mi
              </td>
              <td className="py-2 pr-4">
                <HighlightBadges highlights={item.highlights} />
              </td>
              <td className="py-2 pr-4">
                <div className="flex flex-wrap items-center gap-3">
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
              </td>
            </tr>
            {expandedVin === item.vin && (
              <tr>
                <td colSpan={6} className="p-0">
                  <div className="px-3 pb-3">
                    <HistoryVerificationForm onSubmit={(input) => handleSubmit(item.vin, input)} />
                  </div>
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}
