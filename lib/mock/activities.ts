import type { Activity } from "../../types";

export const ACTIVITIES: Activity[] = [
  {
    id: "act-pool-1",
    type: "pool",
    name: "Poolspel",
    description:
      "Privétafel met begeleiding op aanvraag. Inclusief krijtjes en rack.",
    pricePerHour: 35,
    depositAmount: 20,
    minGuests: 2,
    maxGuests: 4,
    defaultDurationMinutes: 90,
  },
  {
    id: "act-pool-2",
    type: "pool",
    name: "Toernooimodus",
    description: "Twee tafels gereserveerd voor kleine private toernooien.",
    pricePerHour: 60,
    depositAmount: 40,
    minGuests: 4,
    maxGuests: 8,
    defaultDurationMinutes: 120,
  },
  {
    id: "act-dining-1",
    type: "dining",
    name: "Diner",
    description:
      "Samengesteld seizoensmenu, geserveerd aan een van onze grote tafels.",
    pricePerHour: 0,
    depositAmount: 25,
    minGuests: 2,
    maxGuests: 8,
    defaultDurationMinutes: 120,
  },
  {
    id: "act-dining-2",
    type: "dining",
    name: "Privédiner",
    description: "Exclusief gebruik van de privéruimte voor groepen.",
    pricePerHour: 0,
    depositAmount: 75,
    minGuests: 6,
    maxGuests: 12,
    defaultDurationMinutes: 180,
  },
  {
    id: "act-bar-1",
    type: "bar",
    name: "Bar seating",
    description:
      "Stoel aan de lange bar. Cocktailkaart en curatede muzieksets.",
    pricePerHour: 0,
    depositAmount: 0,
    minGuests: 1,
    maxGuests: 2,
    defaultDurationMinutes: 90,
  },
];
