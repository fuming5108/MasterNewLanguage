import { describe, expect, it } from "vitest";
import {
  currentQuestionNumber,
  isSessionFinished,
  recordSessionAnswer,
  SESSION_LENGTH,
  sessionProgressLabel,
  startSession,
} from "./session";
import type { AnswerResult, SessionState } from "./types";

/** 指定した結果を n 回記録したセッションを作る。 */
function answerTimes(session: SessionState, count: number, result: AnswerResult): SessionState {
  let current = session;
  for (let index = 0; index < count; index += 1) {
    current = recordSessionAnswer(current, result);
  }
  return current;
}

describe("session", () => {
  it("1セッションは10問である", () => {
    expect(SESSION_LENGTH).toBe(10);
  });

  it("開始直後のセッションは1問目で、正解数も不正解数も0", () => {
    const session = startSession();

    expect(session).toEqual({ answered: 0, correct: 0, incorrect: 0 });
    expect(currentQuestionNumber(session)).toBe(1);
    expect(sessionProgressLabel(session)).toBe("1 / 10");
  });

  it("1問答えるごとに問題番号が1増える", () => {
    let session = startSession();

    for (let expected = 2; expected <= SESSION_LENGTH; expected += 1) {
      session = recordSessionAnswer(session, "correct");
      expect(currentQuestionNumber(session)).toBe(expected);
      expect(sessionProgressLabel(session)).toBe(`${expected} / 10`);
    }
  });

  it("正解を記録すると correct だけが増える", () => {
    const session = recordSessionAnswer(startSession(), "correct");

    expect(session).toEqual({ answered: 1, correct: 1, incorrect: 0 });
  });

  it("不正解を記録すると incorrect だけが増える", () => {
    const session = recordSessionAnswer(startSession(), "incorrect");

    expect(session).toEqual({ answered: 1, correct: 0, incorrect: 1 });
  });

  it("記録しても元のセッションは変化しない", () => {
    const session = startSession();

    recordSessionAnswer(session, "correct");

    expect(session).toEqual({ answered: 0, correct: 0, incorrect: 0 });
  });

  it("9問答えた時点ではまだ終了していない", () => {
    const session = answerTimes(startSession(), 9, "correct");

    expect(session.answered).toBe(9);
    expect(isSessionFinished(session)).toBe(false);
    expect(sessionProgressLabel(session)).toBe("10 / 10");
  });

  it("10問答えると終了になる", () => {
    const session = answerTimes(startSession(), 10, "correct");

    expect(isSessionFinished(session)).toBe(true);
  });

  it("終了したセッションに答えを記録しても状態は変わらない", () => {
    const finished = answerTimes(startSession(), 10, "correct");

    const after = recordSessionAnswer(finished, "incorrect");

    expect(after).toEqual(finished);
    expect(after.answered).toBe(10);
  });

  it("終了したセッションでも問題番号は10を超えない", () => {
    const finished = answerTimes(startSession(), 10, "correct");

    expect(currentQuestionNumber(finished)).toBe(SESSION_LENGTH);
    expect(sessionProgressLabel(finished)).toBe("10 / 10");
  });

  it("正解と不正解が混ざっても内訳と問題番号が一致する", () => {
    const session = answerTimes(answerTimes(startSession(), 3, "correct"), 2, "incorrect");

    expect(session).toEqual({ answered: 5, correct: 3, incorrect: 2 });
    expect(currentQuestionNumber(session)).toBe(6);
    expect(sessionProgressLabel(session)).toBe("6 / 10");
    expect(isSessionFinished(session)).toBe(false);
  });

  it("新しいセッションを始めると1問目・正解0・不正解0に戻る", () => {
    const finished = answerTimes(startSession(), 10, "incorrect");

    const restarted = startSession();

    expect(isSessionFinished(finished)).toBe(true);
    expect(restarted).toEqual({ answered: 0, correct: 0, incorrect: 0 });
    expect(isSessionFinished(restarted)).toBe(false);
    expect(sessionProgressLabel(restarted)).toBe("1 / 10");
  });
});
