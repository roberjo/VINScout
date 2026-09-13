import { Dashboard } from "./pages/Dashboard";

function App() {
  return (
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-10 px-6 py-4 backdrop-blur"
        style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border-strong)" }}
      >
        <div className="mx-auto flex max-w-6xl items-baseline gap-3">
          <h1 className="text-lg font-bold tracking-tight">VINScout</h1>
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
            Used Vehicle Opportunity Detection &amp; Screening
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">
        <Dashboard />
      </main>
    </div>
  )
}

export default App
