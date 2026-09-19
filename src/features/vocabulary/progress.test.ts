import { describe, expect, it } from "vitest";
import { accuracy, emptyProgress, recordAnswer } from "./progress";

describe("progress", () => {
  it("正解を記録すると correct が1増える", () => {
    const before = emptyProgress("livre");
    const after = recordAnswer(before, "correct");

    expect(after).toEqual({ wordId: "livre", correct: 1, incorrect: 0 });
    expect(before.correct).toBe(0);
  });

  it("不正解を記録すると incorrect が1増える", () => {
    const after = recordAnswer(emptyProgress("livre"), "incorrect");

    expect(after).toEqual({ wordId: "livre", correct: 0, incorrect: 1 });
  });

  it("未出題の正答率は 0", () => {
    expect(accuracy(emptyProgress("livre"))).toBe(0);
  });

  it("正答率は 正解数 / 出題数", () => {
    const progress = { wordId: "livre", correct: 3, incorrect: 1 };

    expect(accuracy(progress)).toBe(0.75);
  });
});
