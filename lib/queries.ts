import { GUESTS, RESERVATIONS } from "./mock/reservations";
import { TABLES } from "./mock/tables";
import { ACTIVITIES } from "./mock/activities";
import { WAITLIST } from "./mock/waitlist";
import { MOCK_NOW, formatOccupancy } from "./time";
import type {
  Reservation,
  Guest,
  Table,
  Activity,
  WaitlistItem,
  OccupancyPhrase,
} from "../types";

export interface ResolvedReservation {
  reservation: Reservation;
  guest: Guest;
  table: Table;
  activity: Activity;
  occupancy: OccupancyPhrase;
}

export interface ResolvedWaitlistItem {
  item: WaitlistItem;
  guest: Guest;
  activity: Activity | null;
}

export interface DashboardMetrics {
  coverts: { value: number; max: number };
  occupancy: { ratio: number; tablesActive: number; tablesTotal: number };
  waitlist: { count: number; activeStatuses: number };
  deposits: { totalEuros: number };
}

const guestById = new Map(GUESTS.map((g) => [g.id, g]));
const tableById = new Map(TABLES.map((t) => [t.id, t]));
const activityById = new Map(ACTIVITIES.map((a) => [a.id, a]));
const activityByType = new Map(
  ACTIVITIES.map((a) => [a.type, a] as const)
);

function resolve(res: Reservation, now: Date): ResolvedReservation | null {
  const guest = guestById.get(res.guestId);
  const table = tableById.get(res.tableId);
  const activity = activityById.get(res.activityId);
  if (!guest || !table || !activity) return null;
  return {
    reservation: res,
    guest,
    table,
    activity,
    occupancy: formatOccupancy(res.startTime, now, res.expectedEndTime),
  };
}

export function getUpcomingArrivals(
  now: Date = MOCK_NOW,
  windowMinutes = 240
): ResolvedReservation[] {
  const cutoff = new Date(now.getTime() + windowMinutes * 60_000);
  return RESERVATIONS.filter(
    (r) =>
      (r.status === "confirmed" || r.status === "waitlist-claimed") &&
      r.startTime >= now &&
      r.startTime <= cutoff
  )
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .map((r) => resolve(r, now))
    .filter((r): r is ResolvedReservation => r !== null);
}

export function getActiveReservations(
  now: Date = MOCK_NOW
): ResolvedReservation[] {
  return RESERVATIONS.filter(
    (r) =>
      (r.status === "checked-in" || r.status === "confirmed") &&
      r.startTime <= now &&
      r.expectedEndTime.getTime() + 120 * 60_000 > now.getTime()
  )
    .sort((a, b) => a.expectedEndTime.getTime() - b.expectedEndTime.getTime())
    .map((r) => resolve(r, now))
    .filter((r): r is ResolvedReservation => r !== null);
}

export function getResolvedWaitlist(): ResolvedWaitlistItem[] {
  return WAITLIST.filter(
    (w) => w.status !== "claimed" && w.status !== "expired"
  )
    .sort((a, b) => a.priority - b.priority)
    .map((w) => {
      const guest = guestById.get(w.guestId);
      const activity = activityByType.get(w.activityType) ?? null;
      if (!guest) return null;
      return { item: w, guest, activity };
    })
    .filter((w): w is ResolvedWaitlistItem => w !== null);
}

export function getAttentionItems(
  now: Date = MOCK_NOW
): ResolvedReservation[] {
  return RESERVATIONS.filter((r) => {
    if (r.status === "no-show") return true;
    if (r.status === "confirmed") {
      const lateMinutes = (now.getTime() - r.startTime.getTime()) / 60_000;
      if (lateMinutes > 15 && !r.actualCheckInTime) return true;
    }
    return false;
  })
    .map((r) => resolve(r, now))
    .filter((r): r is ResolvedReservation => r !== null);
}

export function getDashboardMetrics(
  now: Date = MOCK_NOW
): DashboardMetrics {
  const active = RESERVATIONS.filter(
    (r) =>
      (r.status === "checked-in" || r.status === "confirmed") &&
      r.startTime <= now &&
      r.expectedEndTime >= now
  );
  const tablesTotal = TABLES.length;
  const tablesActive = new Set(active.map((r) => r.tableId)).size;
  const coversValue = RESERVATIONS.filter(
    (r) =>
      r.status !== "cancelled" &&
      r.startTime >= new Date(now.getTime() - 6 * 60 * 60_000)
  ).reduce((sum, r) => sum + r.partySize, 0);
  const waitlistResolved = getResolvedWaitlist();
  const depositsToday = RESERVATIONS.filter(
    (r) =>
      r.depositPaid &&
      r.startTime.toDateString() === now.toDateString()
  ).reduce((sum, r) => sum + r.depositAmount, 0);

  return {
    coverts: { value: coversValue, max: 80 },
    occupancy: {
      ratio: tablesTotal > 0 ? tablesActive / tablesTotal : 0,
      tablesActive,
      tablesTotal,
    },
    waitlist: {
      count: waitlistResolved.length,
      activeStatuses: waitlistResolved.filter(
        (w) =>
          w.item.status === "claim-open" || w.item.status === "notified"
      ).length,
    },
    deposits: { totalEuros: depositsToday },
  };
}

export function formatClock(d: Date): string {
  return d.toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function secondsUntil(target: Date, now: Date = MOCK_NOW): number {
  return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
}
