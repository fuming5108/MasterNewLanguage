import { useState } from "react";
import { progressFor, recordAnswerIn, totalScore } from "./features/vocabulary/progress";
import { selectNextWord } from "./features/vocabulary/selection";
import { loadProgress, mayPersist, saveProgress } from "./features/vocabulary/storage";
import type { AnswerResult, ProgressMap } from "./features/vocabulary/types";
import { WordCard } from "./features/vocabulary/WordCard";
import { words } from "./features/vocabulary/words";

/** 画面が持つ状態。保存できたかどうかは storage 層の戻り値をそのまま持つ。 */
type VocabularyState = {
  progressMap: ProgressMap;
  /**
   * この起動で保存してよいか。起動時の読み出し結果から storage 層が決める。
   * false の起動では、既存の記録を空起点のデータで上書きしないよう一切保存しない。
   */
  savingAllowed: boolean;
  /** 直近の読み書きが成功していれば true。UI 側では判定せず storage 層の結果を使う。 */
  persisted: boolean;
};

function initialState(): VocabularyState {
  const loaded = loadProgress();
  const savingAllowed = mayPersist(loaded);
  return { progressMap: loaded.progressMap, savingAllowed, persisted: savingAllowed };
}

export function App() {
  const [state, setState] = useState<VocabularyState>(initialState);

  const word = selectNextWord(words, state.progressMap);
  const total = totalScore(state.progressMap);

  const handleAnswer = (result: AnswerResult) => {
    if (word === undefined) return;
    const next = recordAnswerIn(state.progressMap, word.id, result);
    // 保存しない起動では persisted も false のままにし、警告を出し続ける。
    const persisted = state.savingAllowed ? saveProgress(next) : false;
    setState({ ...state, progressMap: next, persisted });
  };

  return (
    <main>
      <h1>フランス語 語彙トレーニング</h1>

      {state.persisted ? null : (
        <p role="alert" data-testid="storage-warning">
          学習記録を保存できませんでした。このブラウザでは記録が残らないため、
          ページを閉じたり再読み込みしたりすると学習内容が失われます。
        </p>
      )}

      <p data-testid="total-score">
        累計 正解 {total.correct} / 不正解 {total.incorrect}
      </p>

      {word === undefined ? (
        <p>出題できる単語がありません。</p>
      ) : (
        <WordCard
          word={word}
          progress={progressFor(state.progressMap, word.id)}
          onAnswer={handleAnswer}
        />
      )}
    </main>
  );
}
