import type { ProgressMap, Word, WordProgress } from "./types";

/** その単語が1回以上出題済みかどうか。 */
export function isStudied(progress: WordProgress | undefined): boolean {
  return progress !== undefined && progress.correct + progress.incorrect > 0;
}

function answeredCount(progress: WordProgress | undefined): number {
  return progress === undefined ? 0 : progress.correct + progress.incorrect;
}

/**
 * 次に出題する単語を決める純粋関数。
 *
 * - 未学習（出題回数 0）の単語を配列順で優先する。
 *   これにより、全件が学習済みになるまで同じ単語は2回出ない。
 * - 全件学習済みになったら、出題回数の最も少ない単語を配列順で返す。
 * - 単語が1件も無ければ undefined を返す。
 */
export function selectNextWord(words: readonly Word[], progressMap: ProgressMap): Word | undefined {
  const unstudied = words.find((word) => !isStudied(progressMap[word.id]));
  if (unstudied !== undefined) {
    return unstudied;
  }

  let best: Word | undefined;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const word of words) {
    const count = answeredCount(progressMap[word.id]);
    if (count < bestCount) {
      best = word;
      bestCount = count;
    }
  }
  return best;
}
