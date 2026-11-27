export type CatalogSort = "manual" | "newest";

export interface OrderedItem {
  id: string;
  order?: number | null;
  manualOrder?: number | null;
}

export interface OrderPatch {
  id: string;
  order: number;
  manualOrder: number;
}

export function catalogTimestamp(value: unknown): number {
  if (value == null || value === "") return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === "object") {
    const record = value as { toMillis?: () => number; seconds?: number };
    if (typeof record.toMillis === "function") return record.toMillis();
    if (typeof record.seconds === "number") return record.seconds * 1000;
  }
  return 0;
}

export function articleDate(item: any): unknown {
  return item?.dataPubblicazione || item?.publishedAt || item?.createdAt || item?.updatedAt;
}

export function exhibitionDate(item: any): unknown {
  return item?.dataApertura || item?.createdAt;
}

export function writerDate(item: any): unknown {
  return item?.createdAt || item?.updatedAt;
}

export function sortCatalog<T extends OrderedItem>(
  items: T[],
  mode: CatalogSort,
  dateOf: (item: T) => unknown,
): T[] {
  const copy = [...items];
  if (mode === "newest") {
    return copy.sort((a, b) => {
      const byDate = catalogTimestamp(dateOf(b)) - catalogTimestamp(dateOf(a));
      if (byDate !== 0) return byDate;
      return (a.order ?? 9999) - (b.order ?? 9999);
    });
  }
  return copy.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
}

export function sameCatalogOrder(left: { id: string }[], right: { id: string }[]): boolean {
  return left.length === right.length && left.every((item, index) => item.id === right[index]?.id);
}

/** Date order for the public site, keeping the previous drag order in manualOrder. */
export function planNewestOrder<T extends OrderedItem>(
  items: T[],
  dateOf: (item: T) => unknown,
): { items: T[]; patches: OrderPatch[] } {
  const sorted = sortCatalog(items, "newest", dateOf);
  const next = sorted.map((item, index) => ({
    ...item,
    order: index,
    manualOrder: item.manualOrder ?? item.order ?? index,
  }));
  return {
    items: next,
    patches: next.map((item) => ({
      id: item.id,
      order: item.order ?? 0,
      manualOrder: item.manualOrder ?? 0,
    })),
  };
}

/** Restore the last drag order and publish it. */
export function planManualOrder<T extends OrderedItem>(
  items: T[],
): { items: T[]; patches: OrderPatch[] } {
  const sorted = [...items].sort(
    (a, b) => (a.manualOrder ?? a.order ?? 9999) - (b.manualOrder ?? b.order ?? 9999),
  );
  const next = sorted.map((item, index) => ({
    ...item,
    order: index,
    manualOrder: index,
  }));
  return {
    items: next,
    patches: next.map((item) => ({
      id: item.id,
      order: item.order ?? 0,
      manualOrder: item.manualOrder ?? 0,
    })),
  };
}
