import { describe, expect, it } from "vitest";
import {
  chunkTranslatable,
  restoreNonTranslatable,
  shieldNonTranslatable,
  stripModelFences,
  translateMarkup,
} from "./translateContent";

describe("translateContent", () => {
  it("keeps images and comment placeholders out of the translated text", () => {
    const source = '<p>Ciao</p><img src="https://cdn.example/a.jpg"><p>Fine</p><!--TTIMG_0-->';
    const shielded = shieldNonTranslatable(source);
    expect(shielded.text).toBe("<p>Ciao</p>[[TT0]]<p>Fine</p>[[TT1]]");
    expect(shielded.tokens).toHaveLength(2);
    expect(restoreNonTranslatable(shielded.text.replace("Ciao", "Hello").replace("Fine", "End"), shielded.tokens)).toBe(
      '<p>Hello</p><img src="https://cdn.example/a.jpg"><p>End</p><!--TTIMG_0-->',
    );
  });

  it("rejoins chunks without dropping text", () => {
    const source = "<p>uno</p>".repeat(40);
    expect(chunkTranslatable(source, 50).join("")).toBe(source);
  });

  it("strips a markdown fence around the model reply", () => {
    expect(stripModelFences("```html\n<p>Hello</p>\n```")).toBe("<p>Hello</p>");
  });

  it("translates chunk by chunk and puts the images back", async () => {
    const source = `<p>${"parola ".repeat(80)}</p><img src="https://cdn.example/a.jpg"><p>fine</p>`;
    const translated = await translateMarkup(source, async (chunk) => chunk.replace(/parola/g, "word").replace("fine", "end"));
    expect(translated).toContain('<img src="https://cdn.example/a.jpg">');
    expect(translated).toContain("word");
    expect(translated).toContain("<p>end</p>");
    expect(translated).not.toContain("parola");
  });

  it("appends an image the model dropped", async () => {
    const source = '<p>Ciao</p><img src="https://cdn.example/a.jpg">';
    const translated = await translateMarkup(source, async (chunk) => chunk.replace("Ciao", "Hello").replace(/\[\[TT\d+\]\]/g, ""));
    expect(translated).toContain("<p>Hello</p>");
    expect(translated).toContain('<img src="https://cdn.example/a.jpg">');
  });
});
