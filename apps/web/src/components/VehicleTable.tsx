import { Fragment, useState } from "react";
import type { VehicleWithListing } from "../types/vehicle";
import { VehicleDetail } from "./VehicleDetail";
import { scoreTier } from "../utils/scoreTier";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function ScoreBadge({ score }: { score: number }) {
  const tier = scoreTier(score);
  return <span className={`badge ${tier.badgeClass}`}>{score.toFixed(0)} · {tier.label}</span>;
}

function MarketPositionChip({ percent }: { percent: number }) {
  const belowMarket = percent < 0;
  return (
    <span
      className="text-xs font-medium"
      style={{ color: belowMarket ? "var(--success-text)" : "var(--ink-muted)" }}
    >
      {belowMarket ? "▼" : "▲"} {Math.abs(percent).toFixed(1)}% {belowMarket ? "below" : "above"} market
    </span>
  );
}

export function VehicleTable({ vehicles }: { vehicles: VehicleWithListing[] }) {
  const [expandedVin, setExpandedVin] = useState<string | null>(null);

  if (vehicles.length === 0) {
    return (
      <p style={{ color: "var(--ink-muted)" }}>
        No eligible vehicles match these filters, or nothing has passed the history gate and received an opportunity
        score yet.
      </p>
    );
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr style={{ color: "var(--ink-muted)" }} className="text-xs font-semibold uppercase tracking-wide">
          <th className="py-2 pr-4 font-semibold"></th>
          <th className="py-2 pr-4 font-semibold">Vehicle</th>
          <th className="py-2 pr-4 font-semibold">Price</th>
          <th className="py-2 pr-4 font-semibold">Mileage</th>
          <th className="py-2 pr-4 font-semibold">Opportunity</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map((v) => (
          <Fragment key={v.vin}>
            <tr
              onClick={() => setExpandedVin(expandedVin === v.vin ? null : v.vin)}
              className="cursor-pointer transition-colors"
              style={{ borderTop: "1px solid var(--border)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--page)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <td className="py-2 pr-4">
                {v.imageUrl ? (
                  <img src={v.imageUrl} alt="" className="h-12 w-16 rounded object-cover" />
                ) : (
                  <div className="h-12 w-16 rounded" style={{ background: "var(--border)" }} />
                )}
              </td>
              <td className="py-2 pr-4 font-medium">
                {v.year} {v.make} {v.model} {v.trim ?? ""}
              </td>
              <td className="py-2 pr-4">
                <div className="font-medium">{v.price != null ? currency.format(v.price) : "—"}</div>
                {v.marketComparison && <MarketPositionChip percent={v.marketComparison.priceDifferencePercent} />}
              </td>
              <td className="py-2 pr-4" style={{ color: "var(--ink-secondary)" }}>
                {v.mileage.toLocaleString()} mi
              </td>
              <td className="py-2 pr-4">
                {v.opportunityScore != null ? <ScoreBadge score={v.opportunityScore} /> : "—"}
              </td>
            </tr>
            {expandedVin === v.vin && (
              <tr>
                <td colSpan={5} className="p-0">
                  <VehicleDetail vehicle={v} />
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}
