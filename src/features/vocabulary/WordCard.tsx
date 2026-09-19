import { useState } from "react";
import { emptyProgress, recordAnswer } from "./progress";
import type { AnswerResult, Word } from "./types";

type WordCardProps = {
  word: Word;
  /** 回答が記録されたときに呼ばれる。学習履歴の保存などに使う。 */
  onAnswer?: (result: AnswerResult) => void;
};

/**
 * 単語1件を表示し、「わかる」「わからない」の回答を記録する最小のカード。
 */
export function WordCard({ word, onAnswer }: WordCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [progress, setProgress] = useState(() => emptyProgress(word.id));

  const answer = (result: AnswerResult) => {
    setProgress((current) => recordAnswer(current, result));
    setRevealed(false);
    onAnswer?.(result);
  };

  return (
    <section aria-label="単語カード">
      <h2 lang="fr">{word.fr}</h2>

      {revealed ? (
        <div>
          <p data-testid="meaning">{word.ja}</p>
          <p lang="fr" data-testid="example">
            {word.exampleFr}
          </p>
        </div>
      ) : (
        <button type="button" onClick={() => setRevealed(true)}>
          意味を見る
        </button>
      )}

      <div>
        <button type="button" onClick={() => answer("correct")}>
          わかる
        </button>
        <button type="button" onClick={() => answer("incorrect")}>
          わからない
        </button>
      </div>

      <p data-testid="score">
        正解 {progress.correct} / 不正解 {progress.incorrect}
      </p>
    </section>
  );
}
