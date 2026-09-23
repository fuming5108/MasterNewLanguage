import type { AnswerResult, SessionState } from "./types";

/** 1セッションの問題数。区切りを固定するため、ここだけで定義する。 */
export const SESSION_LENGTH = 10;

/** 1問目から始まる新しいセッションを作る。 */
export function startSession(): SessionState {
  return { answered: 0, correct: 0, incorrect: 0 };
}

/** セッションが終了しているか（規定の問数に達しているか）。 */
export function isSessionFinished(session: SessionState): boolean {
  return session.answered >= SESSION_LENGTH;
}

/**
 * 回答1件をセッションに反映した新しい状態を返す（元の状態は変更しない）。
 * 終了済みのセッションは変化させない。
 */
export function recordSessionAnswer(session: SessionState, result: AnswerResult): SessionState {
  if (isSessionFinished(session)) return session;
  if (result === "correct") {
    return { ...session, answered: session.answered + 1, correct: session.correct + 1 };
  }
  return { ...session, answered: session.answered + 1, incorrect: session.incorrect + 1 };
}

/**
 * いま何問目かを表す 1 起点の番号。
 * 終了済みのセッションでは最終問の番号を返し、問数を超えない。
 */
export function currentQuestionNumber(session: SessionState): number {
  return Math.min(session.answered + 1, SESSION_LENGTH);
}

/** 「1 / 10」のような進捗表示の文言。 */
export function sessionProgressLabel(session: SessionState): string {
  return `${currentQuestionNumber(session)} / ${SESSION_LENGTH}`;
}
