import type { Vehicle } from "@vinscout/domain";

export function VehicleTable({ vehicles }: { vehicles: Vehicle[] }) {
  if (vehicles.length === 0) {
    return (
      <p className="text-slate-400">
        No eligible vehicles yet — nothing has passed the history gate and
        received an opportunity score.
      </p>
    );
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="text-slate-400">
        <tr>
          <th className="py-2 pr-4">Vehicle</th>
          <th className="py-2 pr-4">Mileage</th>
          <th className="py-2 pr-4">History</th>
          <th className="py-2 pr-4">Opportunity Score</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map((v) => (
          <tr key={v.vin} className="border-t border-slate-800">
            <td className="py-2 pr-4">
              {v.year} {v.make} {v.model} {v.trim ?? ""}
            </td>
            <td className="py-2 pr-4">{v.mileage.toLocaleString()} mi</td>
            <td className="py-2 pr-4">{v.historyStatus}</td>
            <td className="py-2 pr-4">
              {v.opportunityScore != null ? v.opportunityScore.toFixed(1) : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
