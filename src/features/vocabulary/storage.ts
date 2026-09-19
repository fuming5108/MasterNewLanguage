import type { ProgressMap, WordProgress } from "./types";

/** 学習記録の保存先キー。形式を変えるときは末尾の版数を上げる。 */
export const PROGRESS_STORAGE_KEY = "mnl:vocabulary:progress:v1";

/** localStorage のうち、この機能が使う部分だけを表す最小の型。 */
export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

/**
 * 読み出しの結果。
 * `ok` が false のときは保存先そのものを読めなかったことを意味し、
 * 画面に「記録が残らない」旨を伝えるための判断材料になる。
 * 保存先は読めたが中身が壊れていた場合は、読める部分だけを採用して ok: true を返す。
 */
export type LoadProgressResult = {
  readonly ok: boolean;
  readonly progressMap: ProgressMap;
};

/**
 * 既定の保存先。プライベートモードなどで参照自体が例外を投げうるため包む。
 */
export function defaultStorage(): StorageLike | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** 回数として受理できる値か。0 以上の整数のみを通し、小数や負数は受理しない。 */
function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function toWordProgress(wordId: string, value: unknown): WordProgress | undefined {
  if (!isRecord(value)) return undefined;
  if (!isCount(value.correct) || !isCount(value.incorrect)) return undefined;
  return { wordId, correct: value.correct, incorrect: value.incorrect };
}

function parseProgressMap(raw: string): ProgressMap {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!isRecord(parsed)) return {};

  const result: ProgressMap = {};
  for (const [wordId, value] of Object.entries(parsed)) {
    const progress = toWordProgress(wordId, value);
    if (progress !== undefined) {
      result[wordId] = progress;
    }
  }
  return result;
}

/**
 * 保存された学習記録を読み出す。例外は投げない。
 *
 * - 保存先を読めた場合は ok: true。未保存・壊れた JSON・形の合わない要素は
 *   読み捨てたうえで、読めた分だけの記録を返す。
 * - 保存先が使えない、または読み出しが例外を投げた場合は ok: false と空の記録を返す。
 */
export function loadProgress(
  storage: StorageLike | undefined = defaultStorage(),
): LoadProgressResult {
  if (storage === undefined) return { ok: false, progressMap: {} };

  let raw: string | null;
  try {
    raw = storage.getItem(PROGRESS_STORAGE_KEY);
  } catch {
    return { ok: false, progressMap: {} };
  }
  if (raw === null) return { ok: true, progressMap: {} };

  return { ok: true, progressMap: parseProgressMap(raw) };
}

/**
 * 学習記録を保存する。保存できなくても例外は投げず、呼び出し側の動作を止めない。
 * 保存に成功したときだけ true を返す。
 */
export function saveProgress(
  progressMap: ProgressMap,
  storage: StorageLike | undefined = defaultStorage(),
): boolean {
  if (storage === undefined) return false;
  try {
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressMap));
    return true;
  } catch {
    return false;
  }
}
