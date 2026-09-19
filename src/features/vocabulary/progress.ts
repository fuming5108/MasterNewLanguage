import type { AnswerResult, ProgressMap, WordProgress } from "./types";

/** まだ一度も出題していない単語の初期記録を作る。 */
export function emptyProgress(wordId: string): WordProgress {
  return { wordId, correct: 0, incorrect: 0 };
}

/**
 * 回答1件を学習記録に反映した新しい記録を返す（元の記録は変更しない）。
 */
export function recordAnswer(progress: WordProgress, result: AnswerResult): WordProgress {
  if (result === "correct") {
    return { ...progress, correct: progress.correct + 1 };
  }
  return { ...progress, incorrect: progress.incorrect + 1 };
}

/** 正答率（0〜1）。未出題の場合は 0 を返す。 */
export function accuracy(progress: WordProgress): number {
  const total = progress.correct + progress.incorrect;
  if (total === 0) return 0;
  return progress.correct / total;
}

/** 記録集合から単語1件の記録を取り出す。無ければ初期記録を返す。 */
export function progressFor(progressMap: ProgressMap, wordId: string): WordProgress {
  const stored = progressMap[wordId];
  return stored === undefined ? emptyProgress(wordId) : stored;
}

/**
 * 回答1件を記録集合に反映した新しい集合を返す（元の集合は変更しない）。
 */
export function recordAnswerIn(
  progressMap: ProgressMap,
  wordId: string,
  result: AnswerResult,
): ProgressMap {
  return {
    ...progressMap,
    [wordId]: recordAnswer(progressFor(progressMap, wordId), result),
  };
}

/** 記録集合全体の正解数・不正解数の合計。 */
export function totalScore(progressMap: ProgressMap): { correct: number; incorrect: number } {
  let correct = 0;
  let incorrect = 0;
  for (const entry of Object.values(progressMap)) {
    correct += entry.correct;
    incorrect += entry.incorrect;
  }
  return { correct, incorrect };
}
