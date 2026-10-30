export const CHECKS = [
  "uptime",
  "certificate",
  "broken-links",
  "mixed-content",
  "lighthouse",
  "dns",
  "domain",
  "blocklist",
] as const;

export type CheckId = (typeof CHECKS)[number];
export type Phase = "running" | "complete";
export type Presence = "healthy" | "attention" | "checking" | "pending";
export type DayState = "up" | "down" | "missing";

export const CHECK_LABEL: Record<CheckId, string> = {
  uptime: "Uptime",
  certificate: "Certificate health",
  "broken-links": "Broken links",
  "mixed-content": "Mixed content",
  lighthouse: "Lighthouse",
  dns: "DNS",
  domain: "Domain",
  blocklist: "DNS blocklist",
};

export const LAST_CHECKED: Record<CheckId, string> = {
  uptime: "less than a minute ago",
  certificate: "9 minutes ago",
  "broken-links": "3 minutes ago",
  "mixed-content": "3 minutes ago",
  lighthouse: "9 minutes ago",
  dns: "9 minutes ago",
  domain: "9 minutes ago",
  blocklist: "9 minutes ago",
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatIso(iso: string): { label: string; full: string } {
  const [year, month, day] = iso.split("-").map(Number);
  return {
    label: `${MONTHS_SHORT[month - 1]} ${day}`,
    full: `${MONTHS[month - 1]} ${day}, ${year}`,
  };
}

export function presence(id: CheckId, phase: Phase): Presence {
  if (phase === "complete") {
    return id === "broken-links" || id === "lighthouse" ? "attention" : "healthy";
  }
  switch (id) {
    case "uptime":
    case "certificate":
    case "domain":
      return "healthy";
    case "broken-links":
      return "attention";
    case "mixed-content":
    case "lighthouse":
      return "checking";
    default:
      return "pending";
  }
}

export function counts(phase: Phase) {
  const tally = { attention: 0, healthy: 0, checking: 0, pending: 0 };
  for (const id of CHECKS) tally[presence(id, phase)] += 1;
  return {
    ...tally,
    finished: tally.attention + tally.healthy,
    active: CHECKS.length,
    disabled: 3,
  };
}

export type UptimeDay = {
  iso: string;
  label: string;
  full: string;
  sample: DayState;
  observed: DayState;
};

function dayStateForSample(day: number): DayState {
  if (day <= 2 || day === 19) return "missing";
  return "up";
}

export const UPTIME_DAYS: UptimeDay[] = Array.from({ length: 30 }, (_, index) => {
  const day = index + 1;
  const iso = `2026-10-${String(day).padStart(2, "0")}`;
  const named = formatIso(iso);
  return {
    iso,
    label: named.label,
    full: named.full,
    sample: dayStateForSample(day),
    observed: day === 30 ? "up" : "missing",
  };
});

export type PerfPoint = {
  iso: string;
  label: string;
  full: string;
  score: number;
};

const PERF_SAMPLE_SCORES: Array<[string, number]> = [
  ["2026-09-04", 68],
  ["2026-09-11", 73],
  ["2026-09-18", 61],
  ["2026-09-25", 54],
  ["2026-10-02", 58],
  ["2026-10-09", 51],
  ["2026-10-16", 46],
  ["2026-10-23", 49],
  ["2026-10-30", 42],
];

function toPoints(rows: Array<[string, number]>): PerfPoint[] {
  return rows.map(([iso, score]) => {
    const named = formatIso(iso);
    return { iso, score, label: named.label, full: named.full };
  });
}

export const PERF_SAMPLE = toPoints(PERF_SAMPLE_SCORES);
export const PERF_ACTUAL = toPoints([["2026-10-30", 42]]);

export function dayStatusLabel(state: DayState): string {
  if (state === "up") return "Up";
  if (state === "down") return "Down";
  return "No data";
}

export function statusLabel(state: Presence): string {
  switch (state) {
    case "healthy":
      return "Healthy";
    case "attention":
      return "Needs attention";
    case "checking":
      return "Checking";
    case "pending":
      return "Pending";
  }
}
