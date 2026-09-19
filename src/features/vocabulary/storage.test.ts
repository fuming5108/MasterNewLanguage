import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadProgress,
  mayPersist,
  PROGRESS_STORAGE_KEY,
  type StorageLike,
  saveProgress,
} from "./storage";
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

/** localStorage の参照自体が例外を投げる状況を作り、関数の実行後に必ず元へ戻す。 */
function withThrowingLocalStorageAccess(run: () => void): void {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("localStorage を参照できません");
    },
  });
  try {
    run();
  } finally {
    if (original === undefined) {
      Reflect.deleteProperty(globalThis, "localStorage");
    } else {
      Object.defineProperty(globalThis, "localStorage", original);
    }
  }
}

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("保存した記録をそのまま読み出せる", () => {
    const storage = createMemoryStorage();
    const progressMap: ProgressMap = {
      livre: { wordId: "livre", correct: 2, incorrect: 1 },
    };

    expect(saveProgress(progressMap, storage)).toBe(true);
    expect(loadProgress(storage)).toEqual({ ok: true, progressMap });
  });

  it("保存先が空なら空の記録を返す", () => {
    expect(loadProgress(createMemoryStorage())).toEqual({ ok: true, progressMap: {} });
  });

  it("localStorage が空でも例外を投げず空の記録を返す", () => {
    expect(loadProgress()).toEqual({ ok: true, progressMap: {} });
  });

  it("壊れた JSON が入っていても例外を投げず空の記録を返す", () => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, "{これは JSON ではない");

    expect(() => loadProgress()).not.toThrow();
    expect(loadProgress().progressMap).toEqual({});
  });

  it("JSON だがオブジェクトでない値は空の記録として扱う", () => {
    const storage = createMemoryStorage({ [PROGRESS_STORAGE_KEY]: "[1,2,3]" });

    expect(loadProgress(storage).progressMap).toEqual({});
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

    expect(loadProgress(storage).progressMap).toEqual({
      livre: { wordId: "livre", correct: 1, incorrect: 0 },
    });
  });

  it("小数の回数は受理せず、その単語の記録を読み捨てる", () => {
    const storage = createMemoryStorage({
      [PROGRESS_STORAGE_KEY]: JSON.stringify({
        livre: { correct: 1.5, incorrect: 0 },
        eau: { correct: 0, incorrect: 0.1 },
        pain: { correct: 2, incorrect: 1 },
      }),
    });

    const result = loadProgress(storage);

    expect(result.ok).toBe(true);
    expect(result.progressMap).toEqual({
      pain: { wordId: "pain", correct: 2, incorrect: 1 },
    });
    expect(result.progressMap.livre).toBeUndefined();
    expect(result.progressMap.eau).toBeUndefined();
  });

  it("回数が Infinity や NaN でも受理せず読み捨てる", () => {
    const storage = createMemoryStorage({
      [PROGRESS_STORAGE_KEY]: '{"livre":{"correct":1e999,"incorrect":0}}',
    });

    expect(loadProgress(storage).progressMap).toEqual({});
  });

  it("読み出しに成功したときは ok: true を返す", () => {
    const storage = createMemoryStorage({
      [PROGRESS_STORAGE_KEY]: JSON.stringify({ livre: { correct: 1, incorrect: 0 } }),
    });

    expect(loadProgress(storage).ok).toBe(true);
  });

  it("読み出しが例外を投げても空の記録を返し、ok: false で失敗を伝える", () => {
    expect(() => loadProgress(throwingStorage)).not.toThrow();
    expect(loadProgress(throwingStorage)).toEqual({ ok: false, progressMap: {} });
  });

  it("保存が例外を投げても呼び出し側には伝播せず false を返す", () => {
    expect(() => saveProgress({}, throwingStorage)).not.toThrow();
    expect(saveProgress({}, throwingStorage)).toBe(false);
  });

  it("localStorage そのものを取得できないときは ok: false と空の記録を返す", () => {
    vi.stubGlobal("localStorage", undefined);

    expect(() => loadProgress()).not.toThrow();
    expect(loadProgress()).toEqual({ ok: false, progressMap: {} });
  });

  it("localStorage そのものを取得できないときは保存せず false を返す", () => {
    vi.stubGlobal("localStorage", undefined);

    expect(() =>
      saveProgress({ livre: { wordId: "livre", correct: 1, incorrect: 0 } }),
    ).not.toThrow();
    expect(saveProgress({ livre: { wordId: "livre", correct: 1, incorrect: 0 } })).toBe(false);
  });

  it("localStorage の参照自体が例外を投げるときも loadProgress は ok: false を返す", () => {
    withThrowingLocalStorageAccess(() => {
      expect(() => loadProgress()).not.toThrow();
      expect(loadProgress()).toEqual({ ok: false, progressMap: {} });
    });
  });

  it("localStorage の参照自体が例外を投げるときも saveProgress は false を返す", () => {
    withThrowingLocalStorageAccess(() => {
      expect(() => saveProgress({})).not.toThrow();
      expect(saveProgress({})).toBe(false);
    });
  });

  it("読み出しに成功した結果からは保存を許可する", () => {
    const storage = createMemoryStorage({
      [PROGRESS_STORAGE_KEY]: JSON.stringify({ livre: { correct: 1, incorrect: 0 } }),
    });

    expect(mayPersist(loadProgress(storage))).toBe(true);
  });

  it("読み出しに失敗した結果からは保存を許可しない", () => {
    expect(mayPersist(loadProgress(throwingStorage))).toBe(false);
  });

  it("保存先が空でも読み出せていれば保存を許可する", () => {
    expect(mayPersist(loadProgress(createMemoryStorage()))).toBe(true);
  });
});
