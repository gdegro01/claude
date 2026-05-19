export type ActivityType = "pool" | "dining" | "bar";

export type ReservationStatus =
  | "confirmed"
  | "checked-in"
  | "no-show"
  | "cancelled"
  | "waitlist-claimed";

export type TableShape = "rect" | "circle" | "bar-seat";

export type TableZone = "pool" | "dining" | "bar";

export interface TablePosition {
  x: number;
  y: number;
  rotation: number;
}

export interface Table {
  id: string;
  zone: TableZone;
  label: string;
  capacity: number;
  shape: TableShape;
  width: number;
  height: number;
  position: TablePosition;
}

export interface Activity {
  id: string;
  type: ActivityType;
  name: string;
  description: string;
  pricePerHour: number;
  depositAmount: number;
  minGuests: number;
  maxGuests: number;
  defaultDurationMinutes: number;
}

export interface KoelkastItem {
  id: string;
  name: string;
  description: string;
  priceEuros: number;
  category: "wine" | "champagne" | "spirits" | "non-alcoholic" | "snacks";
  isPopular: boolean;
}

export interface KoelkastPackage {
  id: string;
  name: string;
  tagline: string;
  priceEuros: number;
  items: string[];
  isSignature: boolean;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  isVip: boolean;
  previousVisits: number;
  notes: string | null;
}

export interface Reservation {
  id: string;
  reference: string;
  guestId: string;
  tableId: string;
  activityId: string;
  koelkastPackageId: string | null;
  status: ReservationStatus;
  partySize: number;
  startTime: Date;
  expectedEndTime: Date;
  actualCheckInTime: Date | null;
  depositPaid: boolean;
  depositAmount: number;
  specialRequests: string | null;
  internalNotes: string | null;
}

export type WaitlistStatus =
  | "waiting"
  | "notified"
  | "claim-open"
  | "claimed"
  | "expired";

export interface WaitlistItem {
  id: string;
  guestId: string;
  activityType: ActivityType;
  requestedDate: Date;
  requestedPartySize: number;
  preferredTimeFrom: string;
  preferredTimeTo: string;
  status: WaitlistStatus;
  addedAt: Date;
  notifiedAt: Date | null;
  claimWindowEndsAt: Date | null;
  linkedReservationId: string | null;
  priority: number;
}

export interface InboxMessage {
  id: string;
  type:
    | "late-arrival"
    | "special-request"
    | "complaint"
    | "vip-note"
    | "suspicious-booking"
    | "birthday"
    | "system";
  guestId: string | null;
  reservationId: string | null;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
  requiresAction: boolean;
}

export type OccupancyPhrase =
  | { kind: "upcoming"; label: string }
  | { kind: "active"; label: string }
  | { kind: "overtime"; label: string }
  | { kind: "free"; label: "Vrij" }
  | { kind: "arriving"; label: "Komt eraan" };
