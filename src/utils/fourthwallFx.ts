/** Euros bought by one unit of `currency`, from the latest ECB rate. EUR is 1. */
export async function eurPerUnit(currency: string): Promise<number | null> {
  const code = currency.trim().toUpperCase();
  if (!code) return null;
  if (code === "EUR") return 1;
  const res = await fetch(
    `https://api.frankfurter.app/latest?from=${encodeURIComponent(code)}&to=EUR`,
  );
  if (!res.ok) return null;
  const body = await res.json();
  const rate = Number(body?.rates?.EUR);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}

export async function eurRatesFor(currencies: string[]): Promise<Record<string, number>> {
  const rates: Record<string, number> = {};
  for (const currency of new Set(currencies.map((c) => c.trim().toUpperCase()).filter(Boolean))) {
    const rate = await eurPerUnit(currency);
    if (rate != null) rates[currency] = rate;
  }
  return rates;
}
