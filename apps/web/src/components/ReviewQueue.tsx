import { useState } from "react";
import type { HistoryVerificationInput, ReviewQueueItem } from "../types/review";
import { submitHistoryVerification } from "../services/vehiclesApi";
import { HistoryVerificationForm } from "./HistoryVerificationForm";

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
        <li key={item.vin} className="rounded border border-slate-800 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-medium">
                {item.year} {item.make} {item.model} {item.trim ?? ""}
              </span>
              <span className="ml-2 text-sm text-slate-400">
                {item.mileage.toLocaleString()} mi · VIN {item.vin}
              </span>
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
        </li>
      ))}
    </ul>
  );
}
