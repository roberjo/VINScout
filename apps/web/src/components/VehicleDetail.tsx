import { useEffect, useState } from "react";
import type { VehicleWithListing } from "../types/vehicle";
import type { HistoryEvidenceEntry } from "../types/evidence";
import { fetchVehicleEvidence } from "../services/vehiclesApi";

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

function ScoreStat({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-lg font-medium">{value != null ? value.toFixed(1) : "—"}</div>
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

  return (
    <div className="space-y-4 border-t border-slate-800 p-4 text-sm">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ScoreStat label="Opportunity" value={vehicle.opportunityScore} />
        <ScoreStat label="Value" value={vehicle.valueScore} />
        <ScoreStat label="Maintenance" value={vehicle.maintenanceScore} />
        <div>
          <div className="text-xs text-slate-400">Asking price</div>
          <div className="text-lg font-medium">{vehicle.price != null ? currency.format(vehicle.price) : "—"}</div>
        </div>
      </div>

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
                <span className="text-slate-500">{new Date(e.retrieved_at).toLocaleDateString()}</span>{" "}
                [{e.provider}/{e.event_type}]{" "}
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
  );
}
