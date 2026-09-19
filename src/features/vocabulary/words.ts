import type { Word } from "./types";

/**
 * 動作確認用の最小の単語データ。
 * 本格的な単語帳は後続のループで外部ファイル化する。
 */
export const words: Word[] = [
  {
    id: "livre",
    fr: "livre",
    ja: "本",
    exampleFr: "Je lis un livre.",
  },
];
