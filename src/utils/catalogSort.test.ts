import { describe, expect, it } from "vitest";
import {
  planManualOrder,
  planNewestOrder,
  sortCatalog,
  type OrderedItem,
} from "./catalogSort";

interface Row extends OrderedItem {
  createdAt?: string;
}

const rows: Row[] = [
  { id: "old", order: 0, createdAt: "2020-01-01" },
  { id: "new", order: 1, createdAt: "2026-05-01" },
  { id: "mid", order: 2, createdAt: "2024-03-01" },
];

describe("sortCatalog", () => {
  it("keeps the saved manual order", () => {
    expect(sortCatalog(rows, "manual", (row) => row.createdAt).map((row) => row.id)).toEqual([
      "old",
      "new",
      "mid",
    ]);
  });

  it("puts the newest date first and the oldest last", () => {
    expect(sortCatalog(rows, "newest", (row) => row.createdAt).map((row) => row.id)).toEqual([
      "new",
      "mid",
      "old",
    ]);
  });

  it("publishes date order without forgetting the drag order", () => {
    const plan = planNewestOrder(rows, (row) => row.createdAt);
    expect(plan.items.map((row) => row.id)).toEqual(["new", "mid", "old"]);
    expect(plan.patches.map((patch) => patch.order)).toEqual([0, 1, 2]);
    expect(plan.patches.find((patch) => patch.id === "old")?.manualOrder).toBe(0);
    expect(plan.patches.find((patch) => patch.id === "new")?.manualOrder).toBe(1);
  });

  it("restores the drag order after a date sort", () => {
    const dated = planNewestOrder(rows, (row) => row.createdAt).items;
    const restored = planManualOrder(dated);
    expect(restored.items.map((row) => row.id)).toEqual(["old", "new", "mid"]);
    expect(restored.patches.map((patch) => patch.manualOrder)).toEqual([0, 1, 2]);
  });
});
