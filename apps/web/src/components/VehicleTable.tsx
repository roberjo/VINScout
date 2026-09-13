import { Fragment, useState } from "react";
import type { VehicleWithListing } from "../types/vehicle";
import { VehicleDetail } from "./VehicleDetail";
import { scoreTier } from "../utils/scoreTier";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function ScoreBadge({ score }: { score: number }) {
  const tier = scoreTier(score);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${tier.classes}`}>
      {score.toFixed(0)} · {tier.label}
    </span>
  );
}

function MarketPositionChip({ percent }: { percent: number }) {
  const belowMarket = percent < 0;
  const classes = belowMarket ? "text-green-400" : "text-slate-400";
  const arrow = belowMarket ? "▼" : "▲";
  return (
    <span className={`text-xs ${classes}`}>
      {arrow} {Math.abs(percent).toFixed(1)}% {belowMarket ? "below" : "above"} market
    </span>
  );
}

export function VehicleTable({ vehicles }: { vehicles: VehicleWithListing[] }) {
  const [expandedVin, setExpandedVin] = useState<string | null>(null);

  if (vehicles.length === 0) {
    return (
      <p className="text-slate-400">
        No eligible vehicles match these filters, or nothing has passed the history gate and received an opportunity
        score yet.
      </p>
    );
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="text-slate-400">
        <tr>
          <th className="py-2 pr-4"></th>
          <th className="py-2 pr-4">Vehicle</th>
          <th className="py-2 pr-4">Price</th>
          <th className="py-2 pr-4">Mileage</th>
          <th className="py-2 pr-4">Opportunity</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map((v) => (
          <Fragment key={v.vin}>
            <tr
              onClick={() => setExpandedVin(expandedVin === v.vin ? null : v.vin)}
              className="cursor-pointer border-t border-slate-800 hover:bg-slate-900"
            >
              <td className="py-2 pr-4">
                {v.imageUrl ? (
                  <img src={v.imageUrl} alt="" className="h-12 w-16 rounded object-cover" />
                ) : (
                  <div className="h-12 w-16 rounded bg-slate-800" />
                )}
              </td>
              <td className="py-2 pr-4">
                {v.year} {v.make} {v.model} {v.trim ?? ""}
              </td>
              <td className="py-2 pr-4">
                <div>{v.price != null ? currency.format(v.price) : "—"}</div>
                {v.marketComparison && <MarketPositionChip percent={v.marketComparison.priceDifferencePercent} />}
              </td>
              <td className="py-2 pr-4">{v.mileage.toLocaleString()} mi</td>
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
