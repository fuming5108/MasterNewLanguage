import { describe, expect, it } from "vitest";
import { recordAnswerIn } from "./progress";
import { isStudied, selectNextWord } from "./selection";
import type { ProgressMap, Word } from "./types";
import { words } from "./words";

const sample: Word[] = [
  { id: "a", fr: "a", ja: "あ", exampleFr: "A." },
  { id: "b", fr: "b", ja: "い", exampleFr: "B." },
  { id: "c", fr: "c", ja: "う", exampleFr: "C." },
];

describe("isStudied", () => {
  it("記録が無ければ未学習", () => {
    expect(isStudied(undefined)).toBe(false);
  });

  it("出題回数が 0 なら未学習", () => {
    expect(isStudied({ wordId: "a", correct: 0, incorrect: 0 })).toBe(false);
  });

  it("不正解1回でも学習済み", () => {
    expect(isStudied({ wordId: "a", correct: 0, incorrect: 1 })).toBe(true);
  });
});

describe("selectNextWord", () => {
  it("記録が空なら先頭の単語を出す", () => {
    expect(selectNextWord(sample, {})).toEqual(sample[0]);
  });

  it("学習済みを飛ばして未学習の単語を出す", () => {
    const progressMap: ProgressMap = {
      a: { wordId: "a", correct: 1, incorrect: 0 },
      b: { wordId: "b", correct: 0, incorrect: 2 },
    };

    expect(selectNextWord(sample, progressMap)).toEqual(sample[2]);
  });

  it("単語が1件も無ければ undefined", () => {
    expect(selectNextWord([], {})).toBeUndefined();
  });

  it("全件学習済みになるまで同じ単語が2回出ない", () => {
    let progressMap: ProgressMap = {};
    const seen: string[] = [];

    for (let i = 0; i < words.length; i += 1) {
      const next = selectNextWord(words, progressMap);
      expect(next).toBeDefined();
      if (next === undefined) return;

      expect(seen).not.toContain(next.id);
      seen.push(next.id);
      progressMap = recordAnswerIn(progressMap, next.id, "correct");
    }

    expect(seen).toHaveLength(words.length);
    expect(new Set(seen).size).toBe(words.length);
  });

  it("全件学習済みになったら出題回数が最も少ない単語を出す", () => {
    const progressMap: ProgressMap = {
      a: { wordId: "a", correct: 2, incorrect: 0 },
      b: { wordId: "b", correct: 1, incorrect: 0 },
      c: { wordId: "c", correct: 3, incorrect: 0 },
    };

    expect(selectNextWord(sample, progressMap)).toEqual(sample[1]);
  });
});
