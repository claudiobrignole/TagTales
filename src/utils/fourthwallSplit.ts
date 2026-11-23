/** Artist fees in EUR, same amounts already used for Ecwid (Allegato B). */
export const ARTIST_FEE_EUR: Record<string, { full: number; promo: number }> = {
  tshirt: { full: 7, promo: 4 },
  felpa: { full: 9, promo: 5 },
  poster_a2: { full: 17, promo: 12 },
  poster_a1: { full: 19, promo: 13 },
  tela_12x18: { full: 93, promo: 67 },
  tela_16x24: { full: 111, promo: 81 },
  tela_20x30: { full: 124, promo: 90 },
  tela_40x60: { full: 164, promo: 104 },
};

/** TagTales keeps this much, in EUR, on each limited-edition print. */
export const LIMITED_PLATFORM_FEE_EUR = 90;

export type FourthwallProductKind = keyof typeof ARTIST_FEE_EUR | "stampa_limitata" | "unknown";

export type ClassifiedProduct = {
  name?: string;
  stockType?: string | null;
  unitCost?: number | null;
  sizeName?: string | null;
};

const near = (value: number | null | undefined, target: number) =>
  value != null && Math.abs(value - target) < 0.02;

export function classifyFourthwallProduct(product: ClassifiedProduct): FourthwallProductKind {
  const name = (product.name || "").toLowerCase();
  const size = (product.sizeName || "").toLowerCase();
  const stock = (product.stockType || "").toUpperCase();
  const cost = product.unitCost;

  if (stock === "LIMITED" || (cost === 0 && !size)) return "stampa_limitata";
  if (/sweatshirt|crewneck|hoodie|felpa/.test(name) || near(cost, 21.75)) return "felpa";
  if (/t-?shirt|\btee\b/.test(name) || near(cost, 15.45)) return "tshirt";
  if (/poster/.test(name) || near(cost, 18)) {
    if (/a2|18\s*[x×]\s*24|12\s*[x×]\s*18/.test(size)) return "poster_a2";
    return "poster_a1";
  }
  if (/12\s*[x×]\s*18/.test(size)) return "tela_12x18";
  if (/16\s*[x×]\s*24/.test(size)) return "tela_16x24";
  if (/20\s*[x×]\s*30/.test(size)) return "tela_20x30";
  if (/40\s*[x×]\s*60/.test(size)) return "tela_40x60";
  return "unknown";
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Artist credit in EUR.
 * POD: fixed Allegato B amount, independent of the sale currency.
 * Limited edition: net (after tax and discount) minus €90, only when that net is already in EUR.
 */
export function artistFeeEur(input: {
  kind: FourthwallProductKind;
  quantity: number;
  promo: boolean;
  currency: string;
  lineNet: number;
}): { feeAmount: number; status: "pending" | "needs_fx" | "unknown_product"; platformFeeEur: number | null } {
  const quantity = Math.max(0, input.quantity || 0);
  if (input.kind === "unknown" || quantity === 0) {
    return { feeAmount: 0, status: "unknown_product", platformFeeEur: null };
  }
  if (input.kind === "stampa_limitata") {
    const platformFeeEur = LIMITED_PLATFORM_FEE_EUR * quantity;
    if (input.currency.toUpperCase() !== "EUR") {
      return { feeAmount: 0, status: "needs_fx", platformFeeEur };
    }
    return {
      feeAmount: roundMoney(Math.max(0, input.lineNet - platformFeeEur)),
      status: "pending",
      platformFeeEur,
    };
  }
  const row = ARTIST_FEE_EUR[input.kind];
  const perUnit = input.promo ? row.promo : row.full;
  return {
    feeAmount: roundMoney(perUnit * quantity),
    status: "pending",
    platformFeeEur: null,
  };
}
