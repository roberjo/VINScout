import { useEffect, useState } from "react";
import type { VehicleWithListing } from "../types/vehicle";
import type { HistoryEvidenceEntry } from "../types/evidence";
import { fetchVehicleEvidence } from "../services/vehiclesApi";
import { scoreTier } from "../utils/scoreTier";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const FLAG_LABELS: Array<[keyof VehicleWithListing, string]> = [
  ["accidentReported", "Accident reported"],
  ["damageReported", "Damage reported"],
  ["structuralDamage", "Structural damage"],
  ["airbagDeployment", "Airbag deployment"],
  ["totalLoss", "Total loss"],
  ["salvageTitle", "Salvage title"],
  ["rebuiltTitle", "Rebuilt title"],
  ["floodDamage", "Flood damage"],
  ["lemonBuyback", "Manufacturer buyback"],
  ["odometerProblem", "Odometer problem"],
];

const MAX_POSSIBLE_CONTRIBUTION = 30; // marketPriceAdvantage's weight (0.30) x a 100 score

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>
      {children}
    </div>
  );
}

export function VehicleDetail({ vehicle }: { vehicle: VehicleWithListing }) {
  const [evidence, setEvidence] = useState<HistoryEvidenceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchVehicleEvidence(vehicle.vin)
      .then((data) => {
        if (!cancelled) setEvidence(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [vehicle.vin]);

  const reportedFlags = FLAG_LABELS.filter(([key]) => vehicle[key] === true);
  const tier = vehicle.opportunityScore != null ? scoreTier(vehicle.opportunityScore) : null;

  return (
    <div
      className="grid grid-cols-1 gap-5 p-5 text-sm sm:grid-cols-[200px_1fr]"
      style={{ borderTop: "1px solid var(--border-strong)", background: "var(--surface-2)" }}
    >
      <div className="space-y-2">
        {vehicle.imageUrl ? (
          <img src={vehicle.imageUrl} alt="" className="w-full rounded-lg object-cover" />
        ) : (
          <div
            className="flex h-36 w-full items-center justify-center rounded-lg text-xs"
            style={{ background: "var(--border)", color: "var(--ink-muted)" }}
          >
            No photo
          </div>
        )}
        {tier && <span className={`badge ${tier.badgeClass} w-full justify-center py-1.5 text-sm`}>{vehicle.opportunityScore?.toFixed(1)} · {tier.label}</span>}
      </div>

      <div className="space-y-4">
        <div>
          <Label>Dealer</Label>
          <div>
            {vehicle.dealerName ?? "Unknown"}
            {vehicle.dealerCity && vehicle.dealerState ? ` — ${vehicle.dealerCity}, ${vehicle.dealerState}` : ""}
          </div>
          {vehicle.listingUrl && (
            <a href={vehicle.listingUrl} target="_blank" rel="noopener noreferrer" className="underline">
              View original listing ↗
            </a>
          )}
        </div>

        {vehicle.marketComparison && (
          <div>
            <Label>Why this price</Label>
            <div>
              Asking {currency.format(vehicle.marketComparison.askingPrice)} vs. an estimated market price of{" "}
              {currency.format(vehicle.marketComparison.estimatedMarketPrice)}, based on{" "}
              {vehicle.marketComparison.comparableCount} comparable listing
              {vehicle.marketComparison.comparableCount === 1 ? "" : "s"} —{" "}
              <span
                className="font-medium"
                style={{
                  color:
                    vehicle.marketComparison.priceDifferencePercent < 0 ? "var(--success-text)" : "var(--ink-primary)",
                }}
              >
                {Math.abs(vehicle.marketComparison.priceDifferencePercent).toFixed(1)}%{" "}
                {vehicle.marketComparison.priceDifferencePercent < 0 ? "below" : "above"} market
              </span>
              .
            </div>
          </div>
        )}

        {vehicle.scoreBreakdown && (
          <div>
            <Label>Score breakdown</Label>
            <div className="space-y-1.5">
              {vehicle.scoreBreakdown.map((entry) => (
                <div key={entry.factor} className="flex items-center gap-2">
                  <div className="w-40 shrink-0 text-xs" style={{ color: "var(--ink-secondary)" }}>
                    {entry.label}
                  </div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (entry.contribution / MAX_POSSIBLE_CONTRIBUTION) * 100)}%`,
                        background: "var(--accent)",
                      }}
                    />
                  </div>
                  <div className="w-20 shrink-0 text-right text-xs" style={{ color: "var(--ink-muted)" }}>
                    {entry.score.toFixed(0)} × {(entry.weight * 100).toFixed(0)}%
                  </div>
                  <div className="w-12 shrink-0 text-right text-xs font-medium">+{entry.contribution.toFixed(1)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label>History</Label>
          <div>
            {vehicle.historyStatus}
            {vehicle.ownerCount != null ? ` · ${vehicle.ownerCount} owner(s)` : ""}
          </div>
          {reportedFlags.length > 0 && (
            <ul className="mt-1 list-inside list-disc" style={{ color: "var(--critical)" }}>
              {reportedFlags.map(([key, label]) => (
                <li key={key}>{label}</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <Label>Evidence log</Label>
          {loading && <p style={{ color: "var(--ink-muted)" }}>Loading…</p>}
          {!loading && evidence.length === 0 && <p style={{ color: "var(--ink-muted)" }}>No evidence recorded.</p>}
          {!loading && evidence.length > 0 && (
            <ul className="space-y-1">
              {evidence.map((e) => (
                <li key={e.id}>
                  <span style={{ color: "var(--ink-muted)" }}>{new Date(e.retrieved_at).toLocaleDateString()}</span>{" "}
                  [{e.provider}/{e.event_type}]{" "}
                  {e.source_url ? (
                    <a href={e.source_url} target="_blank" rel="noopener noreferrer" className="underline">
                      {e.source_url}
                    </a>
                  ) : (
                    e.description
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
