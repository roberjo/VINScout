import { Dashboard } from "./pages/Dashboard";

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4">
        <h1 className="text-xl font-semibold">VINScout</h1>
        <p className="text-sm text-slate-400">
          Used Vehicle Opportunity Detection & Screening
        </p>
      </header>
      <main className="p-6">
        <Dashboard />
      </main>
    </div>
  )
}

export default App
