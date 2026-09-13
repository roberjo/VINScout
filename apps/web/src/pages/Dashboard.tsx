import { useVehicles } from "../hooks/useVehicles";
import { VehicleTable } from "../components/VehicleTable";

export function Dashboard() {
  const { vehicles, loading, error } = useVehicles();

  if (loading) return <p className="text-slate-400">Loading vehicles…</p>;
  if (error) return <p className="text-red-400">Error: {error}</p>;

  return <VehicleTable vehicles={vehicles} />;
}
