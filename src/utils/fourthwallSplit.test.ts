import { describe, expect, it } from "vitest";
import { artistFeeEur, classifyFourthwallProduct } from "./fourthwallSplit";
import { planFourthwallOrder } from "./fourthwallOrderPlan";
import { fourthwallSignature, verifyFourthwallSignature } from "./fourthwallWebhook";

describe("classifyFourthwallProduct", () => {
  it("treats limited stock as a limited-edition print", () => {
    expect(classifyFourthwallProduct({ stockType: "LIMITED", unitCost: 0, name: "Skinny Plate" })).toBe(
      "stampa_limitata",
    );
  });

  it("separates tees, crewnecks and the 24x36 poster", () => {
    expect(classifyFourthwallProduct({ name: "B-Boy T-Shirt", stockType: "UNLIMITED", unitCost: 15.45 })).toBe("tshirt");
    expect(classifyFourthwallProduct({ name: "B-Boy Crewneck Sweatshirt", stockType: "UNLIMITED", unitCost: 21.75 })).toBe("felpa");
    expect(classifyFourthwallProduct({
      name: "Skinny Poster",
      stockType: "UNLIMITED",
      unitCost: 18,
      sizeName: '24" x 36"',
    })).toBe("poster_a1");
  });
});

describe("artistFeeEur", () => {
  it("pays the fixed tee fee in EUR even when the shop price is USD", () => {
    expect(artistFeeEur({
      kind: "tshirt",
      quantity: 2,
      promo: false,
      currency: "USD",
      lineNet: 62,
    })).toEqual({ feeAmount: 14, status: "pending", platformFeeEur: null });
  });

  it("uses the promo column when a promotion is on", () => {
    expect(artistFeeEur({
      kind: "felpa",
      quantity: 1,
      promo: true,
      currency: "USD",
      lineNet: 54,
    }).feeAmount).toBe(5);
  });

  it("keeps 90 EUR and gives the artist the rest only when the net is in EUR", () => {
    expect(artistFeeEur({
      kind: "stampa_limitata",
      quantity: 1,
      promo: false,
      currency: "EUR",
      lineNet: 150,
    })).toMatchObject({ feeAmount: 60, status: "pending", platformFeeEur: 90 });
  });

  it("does not subtract 90 EUR from a USD net", () => {
    expect(artistFeeEur({
      kind: "stampa_limitata",
      quantity: 1,
      promo: false,
      currency: "USD",
      lineNet: 180,
    }).status).toBe("needs_fx");
  });
});

describe("planFourthwallOrder", () => {
  const writers = { shaone: "uid-shaone" };

  it("credits the writer and ignores aelle products", () => {
    const plan = planFourthwallOrder({
      id: "order-1",
      status: "CONFIRMED",
      source: { type: "ORDER" },
      amounts: { subtotal: { value: 31, currency: "USD" }, tax: { value: 0, currency: "USD" }, discount: { value: 0, currency: "USD" } },
      offers: [
        { id: "tee", name: "B-Boy T-Shirt", variant: { id: "v1", quantity: 1, unitPrice: { value: 31, currency: "USD" }, price: { value: 31, currency: "USD" } } },
        { id: "aelle", name: "Aelle tee", variant: { id: "v2", quantity: 1, price: { value: 30, currency: "USD" } } },
      ],
    }, {
      tee: { writerSlug: "shaone", name: "B-Boy T-Shirt", stockType: "UNLIMITED", unitCost: 15.45 },
      aelle: { unmappedSlug: "aelle-original" },
    }, writers);

    expect(plan.lines).toHaveLength(1);
    expect(plan.lines[0]).toMatchObject({
      artistId: "uid-shaone",
      productType: "tshirt",
      feeAmount: 7,
      status: "pending",
      royaltyId: "fw_order-1_v1",
    });
    expect(plan.alerts.map((a) => a.reason)).toEqual(["unmapped_collection"]);
  });

  it("ignores sample orders", () => {
    const plan = planFourthwallOrder({
      id: "s1",
      source: { type: "SAMPLES_ORDER" },
      offers: [{ id: "tee", variant: { id: "v", quantity: 1, price: { value: 1, currency: "USD" } } }],
    }, { tee: { writerSlug: "shaone" } }, writers);
    expect(plan.ignoredReason).toBe("SAMPLES_ORDER");
    expect(plan.lines).toHaveLength(0);
  });
});

describe("verifyFourthwallSignature", () => {
  it("accepts the base64 HMAC of the raw body", () => {
    const body = '{"type":"ORDER_PLACED"}';
    const header = fourthwallSignature(body, "secret");
    expect(verifyFourthwallSignature(body, header, "secret")).toBe(true);
    expect(verifyFourthwallSignature(body, header, "other")).toBe(false);
  });
});
