import { describe, expect, it } from "vitest";
import { exhibitionCollectionHref, writerCollectionUrl, writerProductUrl } from "./fourthwallStore";

describe("fourthwallStore", () => {
  it("builds one collection url from the writer slug", () => {
    expect(writerCollectionUrl("Shaone")).toBe("https://store.aelle.hiphop/collections/shaone");
  });

  it("rejects shop collections that are not writers", () => {
    expect(writerCollectionUrl("all")).toBeNull();
    expect(writerCollectionUrl("aelle-original")).toBeNull();
    expect(writerCollectionUrl("tag-tales")).toBeNull();
    expect(writerCollectionUrl("../shaone")).toBeNull();
  });

  it("uses the only exhibition writer for every photo", () => {
    expect(exhibitionCollectionHref(["shaone"])).toBe(
      "https://store.aelle.hiphop/collections/shaone",
    );
  });

  it("does not pick a product url and does not guess among several writers", () => {
    expect(exhibitionCollectionHref(["shaone", "phase"])).toBeNull();
    expect(exhibitionCollectionHref(["shaone", "phase"], "phase")).toBe(
      "https://store.aelle.hiphop/collections/phase",
    );
  });

  it("builds a product url for the writer profile", () => {
    expect(writerProductUrl("skinny-poster-by-shaone")).toBe(
      "https://store.aelle.hiphop/products/skinny-poster-by-shaone",
    );
  });
});
