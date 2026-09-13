import { Fragment, useState } from "react";
import type { VehicleWithListing } from "../types/vehicle";
import { VehicleDetail } from "./VehicleDetail";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

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
          <th className="py-2 pr-4">Vehicle</th>
          <th className="py-2 pr-4">Price</th>
          <th className="py-2 pr-4">Mileage</th>
          <th className="py-2 pr-4">History</th>
          <th className="py-2 pr-4">Opportunity Score</th>
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
                {v.year} {v.make} {v.model} {v.trim ?? ""}
              </td>
              <td className="py-2 pr-4">{v.price != null ? currency.format(v.price) : "—"}</td>
              <td className="py-2 pr-4">{v.mileage.toLocaleString()} mi</td>
              <td className="py-2 pr-4">{v.historyStatus}</td>
              <td className="py-2 pr-4">{v.opportunityScore != null ? v.opportunityScore.toFixed(1) : "—"}</td>
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
