import type { AnswerResult, WordProgress } from "./types";

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
