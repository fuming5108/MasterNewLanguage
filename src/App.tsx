import { useState } from "react";
import { progressFor, recordAnswerIn, totalScore } from "./features/vocabulary/progress";
import { selectNextWord } from "./features/vocabulary/selection";
import {
  isSessionFinished,
  recordSessionAnswer,
  SESSION_LENGTH,
  sessionProgressLabel,
  startSession,
} from "./features/vocabulary/session";
import {
  loadStudyState,
  mayPersist,
  saveProgress,
  saveSession,
} from "./features/vocabulary/storage";
import { storageWarningFor } from "./features/vocabulary/storageWarning";
import type { AnswerResult, ProgressMap, SessionState } from "./features/vocabulary/types";
import { WordCard } from "./features/vocabulary/WordCard";
import { words } from "./features/vocabulary/words";

/** 画面が持つ状態。保存できたかどうかは storage 層の戻り値をそのまま持つ。 */
type VocabularyState = {
  progressMap: ProgressMap;
  /** いま進めているセッションの進行状態。何問目か・終了したかの判断は session.ts が行う。 */
  session: SessionState;
  /**
   * この起動で保存してよいか。起動時の読み出し結果から storage 層が決める。
   * false の起動では、既存の記録を空起点のデータで上書きしないよう一切保存しない。
   */
  savingAllowed: boolean;
  /** 直近の読み書きが成功していれば true。UI 側では判定せず storage 層の結果を使う。 */
  persisted: boolean;
};

function initialState(): VocabularyState {
  const loaded = loadStudyState();
  const savingAllowed = mayPersist(loaded);
  return {
    progressMap: loaded.progressMap,
    session: loaded.session,
    savingAllowed,
    persisted: savingAllowed,
  };
}

export function App() {
  const [state, setState] = useState<VocabularyState>(initialState);

  const word = selectNextWord(words, state.progressMap);
  const total = totalScore(state.progressMap);
  const finished = isSessionFinished(state.session);
  // 文言の出し分けは純粋関数に任せ、画面は結果を表示するだけにする。
  const warning = storageWarningFor(state);

  const handleAnswer = (result: AnswerResult) => {
    if (word === undefined || finished) return;
    const nextProgress = recordAnswerIn(state.progressMap, word.id, result);
    const nextSession = recordSessionAnswer(state.session, result);
    // 保存しない起動では、学習記録もセッション進行も書き込まず persisted を false のままにする。
    let persisted = false;
    if (state.savingAllowed) {
      const progressSaved = saveProgress(nextProgress);
      const sessionSaved = saveSession(nextSession);
      persisted = progressSaved && sessionSaved;
    }
    setState({ ...state, progressMap: nextProgress, session: nextSession, persisted });
  };

  const handleRestart = () => {
    const session = startSession();
    const persisted = state.savingAllowed ? saveSession(session) : false;
    setState({ ...state, session, persisted });
  };

  const renderStudy = () => {
    if (word === undefined) {
      return <p>出題できる単語がありません。</p>;
    }
    return (
      <>
        <p data-testid="session-progress">{sessionProgressLabel(state.session)}</p>
        <WordCard
          word={word}
          progress={progressFor(state.progressMap, word.id)}
          onAnswer={handleAnswer}
        />
      </>
    );
  };

  return (
    <main>
      <h1>フランス語 語彙トレーニング</h1>

      {warning === undefined ? null : (
        <p role="alert" data-testid="storage-warning">
          {warning}
        </p>
      )}

      <p data-testid="total-score">
        累計 正解 {total.correct} / 不正解 {total.incorrect}
      </p>

      {finished ? (
        <section aria-label="セッション終了" data-testid="session-finished">
          <h2>今回の{SESSION_LENGTH}問が終わりました</h2>
          <p data-testid="session-result">
            このセッション 正解 {state.session.correct} / 不正解 {state.session.incorrect}
          </p>
          <button type="button" onClick={handleRestart}>
            もう一度
          </button>
        </section>
      ) : (
        renderStudy()
      )}
    </main>
  );
}
