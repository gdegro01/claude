import type { OccupancyPhrase } from "../types";

export const MOCK_NOW = new Date("2026-05-19T20:14:00+02:00");

function minutesBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 60_000);
}

function formatDuration(totalMinutes: number): string {
  const absMinutes = Math.abs(totalMinutes);
  if (absMinutes < 60) return `${absMinutes}m`;
  const h = Math.floor(absMinutes / 60);
  const m = absMinutes % 60;
  return m === 0 ? `${h}u` : `${h}u ${m}m`;
}

export function formatOccupancy(
  start: Date,
  now: Date,
  expectedEnd: Date
): OccupancyPhrase {
  const minsToStart = minutesBetween(now, start);
  const minsElapsed = minutesBetween(start, now);
  const minsOvertime = minutesBetween(expectedEnd, now);

  if (minsToStart > 0 && minsToStart <= 20) {
    return { kind: "arriving", label: "Komt eraan" };
  }

  if (minsToStart > 20) {
    return {
      kind: "upcoming",
      label: `Start over · ${formatDuration(minsToStart)}`,
    };
  }

  if (minsOvertime > 0) {
    return {
      kind: "overtime",
      label: `Overtijd · +${formatDuration(minsOvertime)}`,
    };
  }

  if (minsElapsed >= 60) {
    return {
      kind: "active",
      label: `Ingecheckt · ${formatDuration(minsElapsed)}`,
    };
  }

  return {
    kind: "active",
    label: `Speelt · ${formatDuration(minsElapsed)}`,
  };
}
