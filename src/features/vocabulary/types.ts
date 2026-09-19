/** 学習対象のフランス語単語1件。 */
export type Word = {
  id: string;
  /** フランス語の見出し語 */
  fr: string;
  /** 日本語の語義 */
  ja: string;
  /** 用法を確認するための短い例文（フランス語） */
  exampleFr: string;
};

/** 1回の出題に対する回答結果。 */
export type AnswerResult = "correct" | "incorrect";

/** 単語ごとの学習記録。 */
export type WordProgress = {
  wordId: string;
  correct: number;
  incorrect: number;
};

/** 単語 id をキーにした学習記録の集合。未学習の単語はキーを持たない。 */
export type ProgressMap = Record<string, WordProgress>;
