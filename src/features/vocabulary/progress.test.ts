import { describe, expect, it } from "vitest";
import {
  accuracy,
  emptyProgress,
  progressFor,
  recordAnswer,
  recordAnswerIn,
  totalScore,
} from "./progress";
import type { ProgressMap } from "./types";

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

describe("progressFor", () => {
  it("記録が無い単語には初期記録を返す", () => {
    expect(progressFor({}, "livre")).toEqual({ wordId: "livre", correct: 0, incorrect: 0 });
  });

  it("記録がある単語にはその記録を返す", () => {
    const progressMap: ProgressMap = {
      livre: { wordId: "livre", correct: 2, incorrect: 1 },
    };

    expect(progressFor(progressMap, "livre")).toEqual(progressMap.livre);
  });
});

describe("recordAnswerIn", () => {
  it("記録集合に正解を1件足す（元の集合は変更しない）", () => {
    const before: ProgressMap = {};
    const after = recordAnswerIn(before, "livre", "correct");

    expect(after).toEqual({ livre: { wordId: "livre", correct: 1, incorrect: 0 } });
    expect(before).toEqual({});
  });

  it("既存の記録に積み上がる", () => {
    const before: ProgressMap = {
      livre: { wordId: "livre", correct: 1, incorrect: 0 },
    };
    const after = recordAnswerIn(before, "livre", "incorrect");

    expect(after.livre).toEqual({ wordId: "livre", correct: 1, incorrect: 1 });
  });
});

describe("totalScore", () => {
  it("記録が空なら 0 / 0", () => {
    expect(totalScore({})).toEqual({ correct: 0, incorrect: 0 });
  });

  it("全単語の正解数・不正解数を合計する", () => {
    const progressMap: ProgressMap = {
      livre: { wordId: "livre", correct: 2, incorrect: 1 },
      eau: { wordId: "eau", correct: 3, incorrect: 0 },
    };

    expect(totalScore(progressMap)).toEqual({ correct: 5, incorrect: 1 });
  });
});
