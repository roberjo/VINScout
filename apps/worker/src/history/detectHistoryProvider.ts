export type HistoryReportProvider = "CARFAX" | "AUTOCHECK" | "OTHER";

export function detectHistoryProvider(url: string): HistoryReportProvider {
  const host = safeHostname(url);
  if (host?.endsWith("carfax.com")) return "CARFAX";
  if (host?.endsWith("autocheck.com")) return "AUTOCHECK";
  return "OTHER";
}

function safeHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}
