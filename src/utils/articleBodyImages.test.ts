import { describe, expect, it } from "vitest";
import {
  dataUrlToFile,
  extractDataImageUrls,
  shieldArticleImages,
  unshieldArticleImages,
} from "./articleBodyImages";

const PNG_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("articleBodyImages", () => {
  it("extracts unique base64 image sources", () => {
    const html = `<p>a</p><img src="${PNG_1PX}"><img src="${PNG_1PX}"><img src="https://cdn.example/a.jpg">`;
    expect(extractDataImageUrls(html)).toEqual([PNG_1PX]);
  });

  it("turns a data url into an image file", () => {
    const file = dataUrlToFile(PNG_1PX, "cover");
    expect(file.type).toBe("image/png");
    expect(file.name).toBe("cover.png");
    expect(file.size).toBeGreaterThan(0);
  });

  it("shields image tags and restores them after translation", () => {
    const html = '<p>Ciao</p><img src="https://cdn.example/a.jpg" alt="pezzo"><p>fine</p>';
    const shielded = shieldArticleImages(html);
    expect(shielded.html).toBe("<p>Ciao</p><!--TTIMG_0--><p>fine</p>");
    expect(shielded.images).toEqual(['<img src="https://cdn.example/a.jpg" alt="pezzo">']);

    const translated = shielded.html.replace("Ciao", "Hello").replace("fine", "end");
    expect(unshieldArticleImages(translated, shielded.images)).toBe(
      '<p>Hello</p><img src="https://cdn.example/a.jpg" alt="pezzo"><p>end</p>',
    );
  });
});
