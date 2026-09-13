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
    <div className="grid grid-cols-1 gap-4 border-t border-slate-800 p-4 text-sm sm:grid-cols-[200px_1fr]">
      <div className="space-y-2">
        {vehicle.imageUrl ? (
          <img src={vehicle.imageUrl} alt="" className="w-full rounded object-cover" />
        ) : (
          <div className="flex h-36 w-full items-center justify-center rounded bg-slate-800 text-xs text-slate-500">
            No photo
          </div>
        )}
        {tier && (
          <div className={`rounded px-2 py-1 text-center text-sm font-medium ${tier.classes}`}>
            {vehicle.opportunityScore?.toFixed(1)} · {tier.label}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-xs text-slate-400">Dealer</div>
          <div>
            {vehicle.dealerName ?? "Unknown"}
            {vehicle.dealerCity && vehicle.dealerState ? ` — ${vehicle.dealerCity}, ${vehicle.dealerState}` : ""}
          </div>
          {vehicle.listingUrl && (
            <a href={vehicle.listingUrl} target="_blank" rel="noopener noreferrer" className="text-sky-400 underline">
              View original listing ↗
            </a>
          )}
        </div>

        {vehicle.marketComparison && (
          <div>
            <div className="text-xs text-slate-400">Why this price</div>
            <div>
              Asking {currency.format(vehicle.marketComparison.askingPrice)} vs. an estimated market price of{" "}
              {currency.format(vehicle.marketComparison.estimatedMarketPrice)}, based on{" "}
              {vehicle.marketComparison.comparableCount} comparable listing
              {vehicle.marketComparison.comparableCount === 1 ? "" : "s"} —{" "}
              <span className={vehicle.marketComparison.priceDifferencePercent < 0 ? "text-green-400" : "text-slate-300"}>
                {Math.abs(vehicle.marketComparison.priceDifferencePercent).toFixed(1)}%{" "}
                {vehicle.marketComparison.priceDifferencePercent < 0 ? "below" : "above"} market
              </span>
              .
            </div>
          </div>
        )}

        {vehicle.scoreBreakdown && (
          <div>
            <div className="mb-1 text-xs text-slate-400">Score breakdown</div>
            <table className="w-full text-xs">
              <tbody>
                {vehicle.scoreBreakdown.map((entry) => (
                  <tr key={entry.factor} className="border-t border-slate-800">
                    <td className="py-1 pr-2 text-slate-300">{entry.label}</td>
                    <td className="py-1 pr-2 text-slate-500">{(entry.weight * 100).toFixed(0)}%</td>
                    <td className="py-1 pr-2">{entry.score.toFixed(0)}</td>
                    <td className="py-1 text-right text-slate-400">+{entry.contribution.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div>
          <div className="text-xs text-slate-400">History</div>
          <div>
            {vehicle.historyStatus}
            {vehicle.ownerCount != null ? ` · ${vehicle.ownerCount} owner(s)` : ""}
          </div>
          {reportedFlags.length > 0 && (
            <ul className="mt-1 list-inside list-disc text-red-400">
              {reportedFlags.map(([key, label]) => (
                <li key={key}>{label}</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="mb-1 text-xs text-slate-400">Evidence log</div>
          {loading && <p className="text-slate-500">Loading…</p>}
          {!loading && evidence.length === 0 && <p className="text-slate-500">No evidence recorded.</p>}
          {!loading && evidence.length > 0 && (
            <ul className="space-y-1">
              {evidence.map((e) => (
                <li key={e.id} className="text-slate-300">
                  <span className="text-slate-500">{new Date(e.retrieved_at).toLocaleDateString()}</span> [
                  {e.provider}/{e.event_type}]{" "}
                  {e.source_url ? (
                    <a href={e.source_url} target="_blank" rel="noopener noreferrer" className="text-sky-400 underline">
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
