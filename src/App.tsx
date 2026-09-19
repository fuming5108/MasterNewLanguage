import { useState } from "react";
import { progressFor, recordAnswerIn, totalScore } from "./features/vocabulary/progress";
import { selectNextWord } from "./features/vocabulary/selection";
import { loadProgress, saveProgress } from "./features/vocabulary/storage";
import type { AnswerResult, ProgressMap } from "./features/vocabulary/types";
import { WordCard } from "./features/vocabulary/WordCard";
import { words } from "./features/vocabulary/words";

export function App() {
  const [progressMap, setProgressMap] = useState<ProgressMap>(() => loadProgress());

  const word = selectNextWord(words, progressMap);
  const total = totalScore(progressMap);

  const handleAnswer = (result: AnswerResult) => {
    if (word === undefined) return;
    const next = recordAnswerIn(progressMap, word.id, result);
    setProgressMap(next);
    saveProgress(next);
  };

  return (
    <main>
      <h1>フランス語 語彙トレーニング</h1>

      <p data-testid="total-score">
        累計 正解 {total.correct} / 不正解 {total.incorrect}
      </p>

      {word === undefined ? (
        <p>出題できる単語がありません。</p>
      ) : (
        <WordCard
          word={word}
          progress={progressFor(progressMap, word.id)}
          onAnswer={handleAnswer}
        />
      )}
    </main>
  );
}
