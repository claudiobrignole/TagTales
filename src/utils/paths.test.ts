import { describe, expect, it } from "vitest";
import {
  homePath,
  localizedDetailPath,
  localizedPath,
} from "./paths";

describe("localizedPath", () => {
  it("keeps IT paths", () => {
    expect(localizedPath("IT", "/exhibitions")).toBe("/exhibitions");
    expect(localizedPath("IT", "/assistenza", "/support")).toBe("/assistenza");
  });

  it("prefixes EN paths", () => {
    expect(localizedPath("EN", "/exhibitions")).toBe("/en/exhibitions");
    expect(localizedPath("EN", "/assistenza", "/support")).toBe("/en/support");
    expect(localizedPath("EN", "/")).toBe("/en");
  });

  it("homePath", () => {
    expect(homePath("IT")).toBe("/");
    expect(homePath("EN")).toBe("/en");
  });

  it("localizedDetailPath uses EN slug when present", () => {
    expect(localizedDetailPath("IT", "/writers", "shaone", "shaone-en")).toBe(
      "/writers/shaone",
    );
    expect(localizedDetailPath("EN", "/writers", "shaone", "shaone-en")).toBe(
      "/en/writers/shaone-en",
    );
  });
});
