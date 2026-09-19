import { describe, expect, it } from "vitest";
import { words } from "./words";

describe("words", () => {
  it("単語データが20件以上ある", () => {
    expect(words.length).toBeGreaterThanOrEqual(20);
  });

  it("すべての単語で id / fr / ja / exampleFr が埋まっている", () => {
    for (const word of words) {
      expect(typeof word.id).toBe("string");
      expect(word.id.trim().length).toBeGreaterThan(0);
      expect(typeof word.fr).toBe("string");
      expect(word.fr.trim().length).toBeGreaterThan(0);
      expect(typeof word.ja).toBe("string");
      expect(word.ja.trim().length).toBeGreaterThan(0);
      expect(typeof word.exampleFr).toBe("string");
      expect(word.exampleFr.trim().length).toBeGreaterThan(0);
    }
  });

  it("id が重複していない", () => {
    const ids = new Set(words.map((word) => word.id));

    expect(ids.size).toBe(words.length);
  });
});
