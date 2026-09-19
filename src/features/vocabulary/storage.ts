import type { ProgressMap, WordProgress } from "./types";

/** 学習記録の保存先キー。形式を変えるときは末尾の版数を上げる。 */
export const PROGRESS_STORAGE_KEY = "mnl:vocabulary:progress:v1";

/** localStorage のうち、この機能が使う部分だけを表す最小の型。 */
export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
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

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
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
 * 保存された学習記録を読み出す。
 * 未保存・読み出し失敗・壊れた JSON のいずれでも空の記録を返し、例外は投げない。
 */
export function loadProgress(storage: StorageLike | undefined = defaultStorage()): ProgressMap {
  if (storage === undefined) return {};

  let raw: string | null;
  try {
    raw = storage.getItem(PROGRESS_STORAGE_KEY);
  } catch {
    return {};
  }
  if (raw === null) return {};

  return parseProgressMap(raw);
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
