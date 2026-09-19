import { beforeEach, describe, expect, it } from "vitest";
import { loadProgress, PROGRESS_STORAGE_KEY, type StorageLike, saveProgress } from "./storage";
import type { ProgressMap } from "./types";

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

const throwingStorage: StorageLike = {
  getItem: () => {
    throw new Error("読み出しできません");
  },
  setItem: () => {
    throw new Error("保存できません");
  },
};

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("保存した記録をそのまま読み出せる", () => {
    const storage = createMemoryStorage();
    const progressMap: ProgressMap = {
      livre: { wordId: "livre", correct: 2, incorrect: 1 },
    };

    expect(saveProgress(progressMap, storage)).toBe(true);
    expect(loadProgress(storage)).toEqual(progressMap);
  });

  it("保存先が空なら空の記録を返す", () => {
    expect(loadProgress(createMemoryStorage())).toEqual({});
  });

  it("localStorage が空でも例外を投げず空の記録を返す", () => {
    expect(loadProgress()).toEqual({});
  });

  it("壊れた JSON が入っていても例外を投げず空の記録を返す", () => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, "{これは JSON ではない");

    expect(() => loadProgress()).not.toThrow();
    expect(loadProgress()).toEqual({});
  });

  it("JSON だがオブジェクトでない値は空の記録として扱う", () => {
    const storage = createMemoryStorage({ [PROGRESS_STORAGE_KEY]: "[1,2,3]" });

    expect(loadProgress(storage)).toEqual({});
  });

  it("形の合わない要素は読み捨て、正しい要素だけ残す", () => {
    const storage = createMemoryStorage({
      [PROGRESS_STORAGE_KEY]: JSON.stringify({
        livre: { correct: 1, incorrect: 0 },
        eau: { correct: "たくさん", incorrect: 0 },
        pain: null,
        ami: { correct: -1, incorrect: 0 },
      }),
    });

    expect(loadProgress(storage)).toEqual({
      livre: { wordId: "livre", correct: 1, incorrect: 0 },
    });
  });

  it("読み出しが例外を投げても空の記録を返す", () => {
    expect(() => loadProgress(throwingStorage)).not.toThrow();
    expect(loadProgress(throwingStorage)).toEqual({});
  });

  it("保存が例外を投げても呼び出し側には伝播せず false を返す", () => {
    expect(() => saveProgress({}, throwingStorage)).not.toThrow();
    expect(saveProgress({}, throwingStorage)).toBe(false);
  });
});
