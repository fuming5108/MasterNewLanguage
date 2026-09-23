import { SESSION_LENGTH, startSession } from "./session";
import type { ProgressMap, SessionState, WordProgress } from "./types";

/** 学習記録の保存先キー。形式を変えるときは末尾の版数を上げる。 */
export const PROGRESS_STORAGE_KEY = "mnl:vocabulary:progress:v1";

/** セッション進行の保存先キー。学習記録とは別に持ち、互いの形式に影響しない。 */
export const SESSION_STORAGE_KEY = "mnl:vocabulary:session:v1";

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
 * その起動で学習記録を保存してよいかを、起動時の読み出し結果から決める純粋関数。
 *
 * 読み出しに失敗した起動では、手元の記録が「空」から始まってしまう。
 * その状態で保存すると、保存先に残っている既存の記録を空起点のデータで
 * 上書きして壊す。壊さないことを優先し、その回は一切保存しない。
 */
export function mayPersist(loaded: { readonly ok: boolean }): boolean {
  return loaded.ok;
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

/**
 * 起動時にまとめて読み出した学習状態。
 * `ok` が false のときは保存先を読めなかったことを意味し、その回は一切保存しない。
 */
export type LoadStudyStateResult = {
  readonly ok: boolean;
  readonly progressMap: ProgressMap;
  readonly session: SessionState;
};

/** 読み出しに失敗したときの戻り値。手元は空から始め、保存は許可しない。 */
function failedStudyState(): LoadStudyStateResult {
  return { ok: false, progressMap: {}, session: startSession() };
}

/**
 * 保存されたセッション進行を解釈する。
 * 形が合わない、回数の内訳が合わない、問数を超えている場合は新しいセッションとして扱う。
 */
function parseSession(raw: string): SessionState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return startSession();
  }
  if (!isRecord(parsed)) return startSession();

  const { answered, correct, incorrect } = parsed;
  if (!isCount(answered) || !isCount(correct) || !isCount(incorrect)) return startSession();
  if (answered > SESSION_LENGTH) return startSession();
  if (correct + incorrect !== answered) return startSession();
  return { answered, correct, incorrect };
}

/**
 * 学習記録とセッション進行を起動時に1度だけ読み出す。例外は投げない。
 *
 * 学習記録の読み出しに失敗した時点で、その起動は保存しないことが決まるため、
 * セッション進行は読みにいかない。どちらかの読み出しが失敗したら ok: false を返す。
 */
export function loadStudyState(
  storage: StorageLike | undefined = defaultStorage(),
): LoadStudyStateResult {
  if (storage === undefined) return failedStudyState();

  const loaded = loadProgress(storage);
  if (!loaded.ok) return failedStudyState();

  let raw: string | null;
  try {
    raw = storage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return failedStudyState();
  }

  return {
    ok: true,
    progressMap: loaded.progressMap,
    session: raw === null ? startSession() : parseSession(raw),
  };
}

/**
 * セッション進行を保存する。保存できなくても例外は投げない。
 * 保存に成功したときだけ true を返す。
 */
export function saveSession(
  session: SessionState,
  storage: StorageLike | undefined = defaultStorage(),
): boolean {
  if (storage === undefined) return false;
  try {
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}
