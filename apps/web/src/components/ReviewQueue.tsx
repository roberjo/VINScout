import { useState } from "react";
import type { HistoryVerificationInput, ReviewQueueItem } from "../types/review";
import { submitHistoryVerification } from "../services/vehiclesApi";
import { HistoryVerificationForm } from "./HistoryVerificationForm";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const PROVIDER_LABEL: Record<string, string> = {
  CARFAX: "Carfax",
  AUTOCHECK: "AutoCheck",
  OTHER: "History report",
};

export function ReviewQueue({
  items,
  onVerified,
}: {
  items: ReviewQueueItem[];
  onVerified: (vin: string) => void;
}) {
  const [expandedVin, setExpandedVin] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="text-slate-400">Nothing waiting on review.</p>;
  }

  const handleSubmit = async (vin: string, input: HistoryVerificationInput) => {
    await submitHistoryVerification(vin, input);
    setExpandedVin(null);
    onVerified(vin);
  };

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.vin} className="flex gap-3 rounded border border-slate-800 p-3">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className="h-16 w-24 shrink-0 rounded object-cover" />
          ) : (
            <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded bg-slate-800 text-xs text-slate-500">
              No photo
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium">
                  {item.year} {item.make} {item.model} {item.trim ?? ""}
                </div>
                <div className="text-sm text-slate-400">
                  {item.price != null ? currency.format(item.price) : "—"} · {item.mileage.toLocaleString()} mi
                  {item.dealerName ? ` · ${item.dealerName}` : ""}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {item.historyReportLinks.map((link) => (
                  <a
                    key={link.source_url}
                    href={link.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-sky-400 underline"
                  >
                    {PROVIDER_LABEL[link.provider] ?? link.provider} report ↗
                  </a>
                ))}

                <button
                  type="button"
                  onClick={() => setExpandedVin(expandedVin === item.vin ? null : item.vin)}
                  className="rounded border border-slate-700 px-2 py-1 text-sm text-slate-300"
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
